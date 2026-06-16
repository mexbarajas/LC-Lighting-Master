// IMPORTANT: Register these events in Stripe Dashboard:
// Stripe → Developers → Webhooks → your endpoint → Add events:
//   ✅ checkout.session.completed  (already registered)
//   ✅ charge.refunded             (ADD THIS)
//   ✅ charge.dispute.created      (ADD THIS)

// Run in Supabase SQL Editor if not already present:
// ALTER TABLE public.subscriptions
//   ADD COLUMN IF NOT EXISTS seats integer DEFAULT 1,
//   ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
//   ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
//   ADD COLUMN IF NOT EXISTS email text;
//
// To show real emails in admin Recent Signups, also run:
// CREATE OR REPLACE FUNCTION public.handle_new_user()
// RETURNS trigger AS $$
// BEGIN
//   INSERT INTO public.subscriptions (user_id, plan, status, email)
//   VALUES (new.id, 'free', 'active', new.email)
//   ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
//   RETURN new;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
//
// CREATE OR REPLACE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
//
// Verify:
// SELECT column_name, data_type
// FROM information_schema.columns
// WHERE table_name = 'subscriptions';
//
// Run in Supabase SQL Editor to speed up refund lookups:
// CREATE INDEX IF NOT EXISTS idx_subscriptions_email
//   ON public.subscriptions(email)
//   WHERE email IS NOT NULL;
//
// CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
//   ON public.subscriptions(stripe_customer_id)
//   WHERE stripe_customer_id IS NOT NULL;
//
// CREATE INDEX IF NOT EXISTS idx_subscriptions_payment
//   ON public.subscriptions(stripe_payment_intent)
//   WHERE stripe_payment_intent IS NOT NULL;

import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  const body = await request.text()
  if (body.length > 65536) {
    return new Response('Payload too large', { status: 413 })
  }
  const sig  = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Only process paid sessions
    if (session.payment_status !== 'paid') {
      return new Response('Skipped — not paid', { status: 200 })
    }

    const userId = session.metadata?.user_id
    const plan   = session.metadata?.plan
    const seats  = parseInt(session.metadata?.seats || '1')

    if (!userId || !plan) {
      console.error('Webhook missing metadata:', session.metadata)
      return new Response('Missing metadata', { status: 400 })
    }

    // Access expiry = December 31 of current year.
    // If purchased after Nov 1, extend to Dec 31 next year.
    const now = new Date()
    const expiry = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    if (now.getMonth() >= 10) {
      expiry.setFullYear(expiry.getFullYear() + 1)
    }

    const supabase = createServiceClient()

    // Idempotency: skip if this payment_intent was already processed
    if (session.payment_intent) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('stripe_payment_intent')
        .eq('stripe_payment_intent', session.payment_intent)
        .single()
      if (existing) {
        console.log(`Duplicate webhook skipped — payment already processed: ${session.payment_intent}`)
        return new Response('Already processed', { status: 200 })
      }
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id:               userId,
        plan:                  plan,
        status:                'active',
        stripe_customer_id:    session.customer || null,
        stripe_payment_intent: session.payment_intent || null,
        email:                 session.customer_email || null,
        current_period_end:    expiry.toISOString(),
        seats:                 plan === 'team' ? seats : 1,
        exam_addon:            plan === 'exam_addon' ? true : false,
        is_admin:              false,
        updated_at:            new Date().toISOString(),
      }, { onConflict: 'user_id' })

    console.log('Stored stripe_customer_id:', session.customer)
    console.log('Stored payment_intent:', session.payment_intent)
    console.log('Stored email:', session.customer_email)

    if (error) {
      console.error('Supabase write error:', error)
      return new Response('Database error', { status: 500 })
    }
  }

  // ── REFUND HANDLER ────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge = event.data.object
    const isFullRefund = charge.amount_refunded >= charge.amount

    console.log('Refund event:', {
      customer:       charge.customer,
      paymentIntent:  charge.payment_intent,
      receiptEmail:   charge.receipt_email,
      isFullRefund,
      amountRefunded: charge.amount_refunded,
      amount:         charge.amount,
    })

    if (!isFullRefund) {
      return new Response('Partial refund — no action', { status: 200 })
    }

    const supabase = createServiceClient()
    let updated = false
    const revokePayload = {
      plan:               'free',
      status:             'refunded',
      current_period_end: null,
      exam_addon:         false,
      updated_at:         new Date().toISOString(),
    }

    // Try 1: match by stripe_customer_id
    if (charge.customer) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(revokePayload)
        .eq('stripe_customer_id', charge.customer)
        .select()
      if (!error && data?.length > 0) {
        updated = true
        console.log('✓ Refund: matched by customer ID', charge.customer)
      }
    }

    // Try 2: match by stripe_payment_intent
    if (!updated && charge.payment_intent) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(revokePayload)
        .eq('stripe_payment_intent', charge.payment_intent)
        .select()
      if (!error && data?.length > 0) {
        updated = true
        console.log('✓ Refund: matched by payment intent', charge.payment_intent)
      }
    }

    // Try 3: match by email
    if (!updated && charge.receipt_email) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(revokePayload)
        .eq('email', charge.receipt_email.toLowerCase())
        .select()
      if (!error && data?.length > 0) {
        updated = true
        console.log('✓ Refund: matched by email', charge.receipt_email)
      }
    }

    if (!updated) {
      console.error('✗ Refund: could not find user to revoke', {
        customer:      charge.customer,
        paymentIntent: charge.payment_intent,
        email:         charge.receipt_email,
      })
      // Return 200 so Stripe doesn't keep retrying — handle edge cases manually
    }
  }

  // ── DISPUTE / CHARGEBACK HANDLER ─────────────────────
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object
    const customerId = dispute.customer

    if (customerId) {
      const supabase = createServiceClient()
      await supabase
        .from('subscriptions')
        .update({
          plan:       'free',
          status:     'disputed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)

      console.log(`⚠ Dispute created — access suspended for customer ${customerId}`)
    }
  }

  return new Response('OK', { status: 200 })
}
