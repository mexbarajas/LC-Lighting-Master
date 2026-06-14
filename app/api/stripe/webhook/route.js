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

    let error
    if (plan === 'exam_addon') {
      // Add exam access to existing subscription without changing the plan
      ;({ error } = await supabase
        .from('subscriptions')
        .update({
          exam_addon:            true,
          stripe_payment_intent: session.payment_intent || null,
          updated_at:            new Date().toISOString(),
        })
        .eq('user_id', userId))
      if (!error) console.log(`✓ exam_addon activated for user ${userId}`)
    } else {
      ;({ error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id:               userId,
          plan:                  plan,
          status:                'active',
          email:                 session.customer_email || null,
          stripe_customer_id:    session.customer || null,
          stripe_payment_intent: session.payment_intent || null,
          current_period_end:    expiry.toISOString(),
          seats:                 plan === 'team' ? seats : 1,
          updated_at:            new Date().toISOString(),
        }, { onConflict: 'user_id' }))
      if (!error) console.log(`✓ Plan ${plan} activated for user ${userId}, expires ${expiry.toISOString()}`)
    }

    if (error) {
      console.error('Supabase write error:', error)
      return new Response('Database error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
