// IMPORTANT: Register these events in Stripe Dashboard:
// Stripe → Developers → Webhooks → your endpoint → Add events:
//   ✅ checkout.session.completed  (already registered)
//   ✅ charge.refunded             (ADD THIS)
//   ✅ charge.dispute.created      (ADD THIS)

// CRITICAL: Add unique constraint on stripe_payment_intent in Supabase SQL Editor:
// ALTER TABLE public.subscriptions
//   ADD CONSTRAINT uq_stripe_payment_intent UNIQUE (stripe_payment_intent)
//     WHERE stripe_payment_intent IS NOT NULL;
// This prevents race condition where two concurrent webhooks create duplicate subscriptions.

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
import { PLANS, getTeamPerSeat } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const VALID_PLANS = ['t1', 't2', 't3', 'team', 'exam_addon']

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
    return new Response('Unauthorized', { status: 401 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    console.log('WEBHOOK checkout.session.completed', {
      user_id: session.metadata?.user_id,
      customer_email: session.customer_details?.email,
      customer: session.customer,
      payment_intent: session.payment_intent,
      amount: session.amount_total,
      plan: session.metadata?.plan,
    })

    // Only process paid sessions
    if (session.payment_status !== 'paid') {
      return new Response('Skipped — not paid', { status: 200 })
    }

    let userId = session.metadata?.user_id
    const plan   = session.metadata?.plan
    const seats  = parseInt(session.metadata?.seats || '1')

    if (!plan) {
      console.error('Webhook missing plan metadata:', session.metadata)
      return new Response('Missing metadata', { status: 400 })
    }

    const supabase = createServiceClient()

    // Fallback: if user_id missing from metadata, look up by email
    if (!userId) {
      const customerEmail = session.customer_details?.email || session.customer_email
      if (customerEmail) {
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('email', customerEmail.toLowerCase())
          .maybeSingle()
        if (existing?.user_id) {
          userId = existing.user_id
          console.log('Webhook: resolved user_id from email fallback', { customerEmail, userId })
        }
      }
    }

    if (!userId) {
      console.error('Webhook: could not resolve user_id', {
        metadata: session.metadata,
        customer_details: session.customer_details,
      })
      return new Response('Missing metadata', { status: 400 })
    }

    // VALIDATION: Plan must be in VALID_PLANS
    if (!VALID_PLANS.includes(plan)) {
      console.error('Invalid plan in webhook:', plan)
      return new Response('Invalid plan', { status: 400 })
    }

    // VALIDATION: Verify amount_total matches expected plan price
    let expectedAmount
    if (plan === 'team') {
      if (seats < 5 || seats >= 11 || isNaN(seats)) {
        console.error('Invalid seat count in webhook:', seats)
        return new Response('Invalid seat count', { status: 400 })
      }
      const tier = getTeamPerSeat(seats)
      expectedAmount = tier.perSeat * seats * 100 // Convert to cents
    } else {
      const planData = PLANS[plan]
      if (!planData) {
        console.error('Plan not found:', plan)
        return new Response('Invalid plan', { status: 400 })
      }
      expectedAmount = planData.amount
    }

    if (session.amount_total !== expectedAmount) {
      console.error('Amount mismatch in webhook:', {
        plan,
        seats,
        expected: expectedAmount,
        actual: session.amount_total,
        customer: session.customer,
      })
      return new Response('Amount mismatch', { status: 400 })
    }

    // Access expiry = December 31 of current year.
    // If purchased after Nov 1, extend to Dec 31 next year.
    const now = new Date()
    const expiry = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    if (now.getMonth() >= 10) {
      expiry.setFullYear(expiry.getFullYear() + 1)
    }

    // IDEMPOTENCY: Explicit pre-check — only skip if this payment_intent already
    // wrote a real (non-free) plan. A null payment_intent row from the auth trigger
    // must NOT be treated as already processed.
    if (session.payment_intent) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('stripe_payment_intent, plan')
        .eq('stripe_payment_intent', session.payment_intent)
        .maybeSingle()

      if (existing && existing.stripe_payment_intent && existing.plan !== 'free') {
        console.log(`Duplicate webhook ignored — payment already processed: ${session.payment_intent}`)
        return new Response('Already processed', { status: 200 })
      }
    }

    // Upsert on user_id — always updates the existing row (including free-plan rows
    // created by the auth trigger) rather than trying to insert a duplicate.
    const { error: upsertErr } = await supabase
      .from('subscriptions')
      .upsert({
        user_id:               userId,
        plan:                  plan,
        status:                'active',
        stripe_customer_id:    session.customer || null,
        stripe_payment_intent: session.payment_intent || null,
        email:                 session.customer_details?.email || session.customer_email || null,
        current_period_end:    expiry.toISOString(),
        seats:                 plan === 'team' ? seats : 1,
        exam_addon:            plan === 'exam_addon' ? true : false,
        is_admin:              false,
        updated_at:            new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('Supabase write error:', upsertErr)
      return new Response('Database error', { status: 500 })
    }

    console.log('✓ Webhook processed:', {
      userId,
      plan,
      seats,
      customer: session.customer,
      paymentIntent: session.payment_intent,
    })
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

    // Try 3: match by email (ONLY if exactly one match to prevent bulk revocation)
    if (!updated && charge.receipt_email) {
      const { data: candidates, error: countErr } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('email', charge.receipt_email.toLowerCase())

      if (!countErr && candidates && candidates.length === 1) {
        const { error, data } = await supabase
          .from('subscriptions')
          .update(revokePayload)
          .eq('user_id', candidates[0].user_id)
          .select()
        if (!error && data?.length > 0) {
          updated = true
          console.log('✓ Refund: matched by email (single user)', charge.receipt_email)
        }
      } else if (candidates && candidates.length > 1) {
        console.warn('⚠ Refund: email match is ambiguous (multiple users), skipping email lookup', {
          email: charge.receipt_email,
          matches: candidates.length,
        })
      }
    }

    if (!updated) {
      console.error('✗ Refund: could not find user to revoke', {
        customer:      charge.customer,
        paymentIntent: charge.payment_intent,
        email:         charge.receipt_email,
      })
      // TODO: Send alert to admin for manual investigation
      // For now, return 200 so Stripe doesn't keep retrying
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
