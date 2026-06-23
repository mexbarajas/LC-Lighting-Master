// IMPORTANT: Register these events in Stripe Dashboard:
// Stripe → Developers → Webhooks → your endpoint → Add events:
//   ✅ checkout.session.completed  (already registered)
//   ✅ charge.refunded             (ADD THIS)
//   ✅ charge.dispute.created      (ADD THIS)

// CRITICAL: Run these in Supabase SQL Editor before deploying:
//
// 1. subscriptions table — base columns
// ALTER TABLE public.subscriptions
//   ADD COLUMN IF NOT EXISTS seats integer DEFAULT 1,
//   ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
//   ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
//   ADD COLUMN IF NOT EXISTS email text;
//
// 2. Unique constraint to prevent duplicate webhook processing
// ALTER TABLE public.subscriptions
//   ADD CONSTRAINT uq_stripe_payment_intent UNIQUE (stripe_payment_intent)
//     WHERE stripe_payment_intent IS NOT NULL;
//
// 3. teams table — team plan type + pricing columns
// ALTER TABLE public.teams
//   ADD COLUMN IF NOT EXISTS plan_type text CHECK (plan_type IN ('course_only','course_exam')) DEFAULT 'course_exam',
//   ADD COLUMN IF NOT EXISTS price_per_seat integer,
//   ADD COLUMN IF NOT EXISTS seats_purchased integer,
//   ADD COLUMN IF NOT EXISTS total_team_price integer;
//
// 4. team_members table — per-seat license columns
// ALTER TABLE public.team_members
//   ADD COLUMN IF NOT EXISTS license_type text CHECK (license_type IN ('course_only','course_exam')) DEFAULT 'course_exam',
//   ADD COLUMN IF NOT EXISTS has_exam_access boolean DEFAULT false,
//   ADD COLUMN IF NOT EXISTS exam_access_source text CHECK (exam_access_source IN ('team_purchase','member_add_on','none')) DEFAULT 'none',
//   ADD COLUMN IF NOT EXISTS member_exam_add_on_paid boolean DEFAULT false,
//   ADD COLUMN IF NOT EXISTS member_exam_add_on_payment_id text;
//
// 5. Migration: map existing records to the new model
// UPDATE public.teams SET plan_type = 'course_exam' WHERE plan_type IS NULL;
// UPDATE public.team_members
//   SET license_type = 'course_exam', has_exam_access = true, exam_access_source = 'team_purchase'
//   WHERE license_type IS NULL;
//
// 6. Indexes for lookup performance
// CREATE INDEX IF NOT EXISTS idx_subscriptions_email
//   ON public.subscriptions(email) WHERE email IS NOT NULL;
// CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
//   ON public.subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
// CREATE INDEX IF NOT EXISTS idx_subscriptions_payment
//   ON public.subscriptions(stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;
//
// 7. Auth trigger to auto-create free subscription on signup
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

import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import {
  PLANS,
  TEAM_PLAN_TYPES,
  TEAM_MEMBER_EXAM_ADD_ON_PRICE,
  getTeamPerSeat,
  MIN_TEAM_SEATS,
} from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const VALID_PLANS = ['t1', 't2', 't3', 'team', 'exam_addon', 'team_member_exam_addon']

export async function POST(request) {
  const body = await request.text()
  if (body.length > 65536) {
    return new Response('Payload too large', { status: 413 })
  }
  const sig = request.headers.get('stripe-signature')

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
      user_id:        session.metadata?.user_id,
      customer_email: session.customer_details?.email,
      customer:       session.customer,
      payment_intent: session.payment_intent,
      amount:         session.amount_total,
      plan:           session.metadata?.plan,
      plan_type:      session.metadata?.plan_type,
    })

    if (session.payment_status !== 'paid') {
      return new Response('Skipped — not paid', { status: 200 })
    }

    let userId    = session.metadata?.user_id
    const plan    = session.metadata?.plan
    const planType = session.metadata?.plan_type || null  // populated for team plans
    const seats   = parseInt(session.metadata?.seats || '1')

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
        metadata:         session.metadata,
        customer_details: session.customer_details,
      })
      return new Response('Missing metadata', { status: 400 })
    }

    if (!VALID_PLANS.includes(plan)) {
      console.error('Invalid plan in webhook:', plan)
      return new Response('Invalid plan', { status: 400 })
    }

    // ── AMOUNT VALIDATION ──────────────────────────────────────
    let expectedAmount
    if (plan === 'team') {
      if (seats < MIN_TEAM_SEATS || seats >= 11 || isNaN(seats)) {
        console.error('Invalid seat count in webhook:', seats)
        return new Response('Invalid seat count', { status: 400 })
      }
      if (planType && TEAM_PLAN_TYPES[planType]) {
        // New pricing model (June 2026+)
        expectedAmount = TEAM_PLAN_TYPES[planType].perSeat * seats * 100
      } else {
        // Legacy: orders without plan_type in metadata — use old $360/seat tier
        const tier = getTeamPerSeat(seats)
        expectedAmount = tier.perSeat * seats * 100
      }
    } else if (plan === 'team_member_exam_addon') {
      expectedAmount = TEAM_MEMBER_EXAM_ADD_ON_PRICE * 100
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
        planType,
        seats,
        expected: expectedAmount,
        actual:   session.amount_total,
        customer: session.customer,
      })
      return new Response('Amount mismatch', { status: 400 })
    }

    // Access expiry = December 31 of current year.
    // If purchased after Nov 1, extend to Dec 31 next year.
    const now    = new Date()
    const expiry = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    if (now.getMonth() >= 10) {
      expiry.setFullYear(expiry.getFullYear() + 1)
    }

    // IDEMPOTENCY: skip if this payment_intent was already processed (non-free plan)
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

    // Determine exam_addon value for the subscription upsert
    let examAddon = false
    if (plan === 'exam_addon' || plan === 'team_member_exam_addon') {
      examAddon = true
    } else if (plan === 'team' && planType && TEAM_PLAN_TYPES[planType]) {
      examAddon = TEAM_PLAN_TYPES[planType].hasExam
    }

    // ── UPSERT SUBSCRIPTION ────────────────────────────────────
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
        exam_addon:            examAddon,
        is_admin:              false,
        updated_at:            new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('Supabase write error:', upsertErr)
      return new Response('Database error', { status: 500 })
    }

    // ── POST-PAYMENT SIDE EFFECTS ──────────────────────────────

    if (plan === 'team') {
      const teamPlan = planType && TEAM_PLAN_TYPES[planType] ? TEAM_PLAN_TYPES[planType] : null
      const hasExam  = teamPlan?.hasExam ?? true
      const perSeat  = teamPlan?.perSeat ?? null

      // Check if user already has a team (e.g. admin refreshing/upgrading)
      const { data: existingMembership } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingMembership) {
        // Update existing team record with new plan_type and pricing
        const { error: teamUpdErr } = await supabase
          .from('teams')
          .update({
            ...(planType ? { plan_type: planType } : {}),
            ...(perSeat  ? { price_per_seat: perSeat, seats_purchased: seats, total_team_price: perSeat * seats } : {}),
            seat_count: seats,
          })
          .eq('id', existingMembership.team_id)
        if (teamUpdErr) console.error('Webhook: team update error:', teamUpdErr)

        // Update all current team members' license info
        if (planType) {
          const { error: membersUpdErr } = await supabase
            .from('team_members')
            .update({
              license_type:       planType,
              has_exam_access:    hasExam,
              exam_access_source: hasExam ? 'team_purchase' : 'none',
            })
            .eq('team_id', existingMembership.team_id)
          if (membersUpdErr) console.error('Webhook: team_members license update error:', membersUpdErr)
        }
      } else {
        // Self-service: create team + set purchaser as team_admin
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('email')
          .eq('user_id', userId)
          .maybeSingle()
        const ownerEmail = subData?.email || session.customer_details?.email || ''
        const domain     = ownerEmail.includes('@') ? ownerEmail.split('@')[1].split('.')[0] : null
        const teamName   = domain
          ? domain.charAt(0).toUpperCase() + domain.slice(1) + ' Team'
          : 'New Team'

        const { data: newTeam, error: teamInsErr } = await supabase
          .from('teams')
          .insert({
            name:              teamName,
            owner_id:          userId,
            tier:              hasExam ? 't3' : 't2',
            plan_type:         planType || 'course_exam',
            seat_count:        seats,
            seats_purchased:   seats,
            price_per_seat:    perSeat,
            total_team_price:  perSeat ? perSeat * seats : null,
            access_expiry:     expiry.toISOString(),
          })
          .select('id')
          .single()

        if (teamInsErr || !newTeam) {
          console.error('Webhook: team create error:', teamInsErr)
        } else {
          const { error: memberInsErr } = await supabase
            .from('team_members')
            .insert({
              team_id:           newTeam.id,
              user_id:           userId,
              role:              'team_admin',
              license_type:      planType || 'course_exam',
              has_exam_access:   hasExam,
              exam_access_source: hasExam ? 'team_purchase' : 'none',
            })
          if (memberInsErr) console.error('Webhook: team_admin member insert error:', memberInsErr)

          // Also update the subscription plan to team_admin
          await supabase
            .from('subscriptions')
            .update({ plan: 'team_admin' })
            .eq('user_id', userId)
        }
      }
    }

    if (plan === 'team_member_exam_addon') {
      // Grant exam access in team_members — this is the authoritative server-side grant
      const { error: addonErr } = await supabase
        .from('team_members')
        .update({
          has_exam_access:             true,
          exam_access_source:          'member_add_on',
          member_exam_add_on_paid:     true,
          member_exam_add_on_payment_id: session.payment_intent || null,
        })
        .eq('user_id', userId)
      if (addonErr) console.error('Webhook: team_member exam addon update error:', addonErr)
    }

    console.log('✓ Webhook processed:', {
      userId,
      plan,
      planType,
      seats,
      customer:      session.customer,
      paymentIntent: session.payment_intent,
    })
  }

  // ── REFUND HANDLER ─────────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge       = event.data.object
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

    const supabase    = createServiceClient()
    let updated       = false
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
          email:   charge.receipt_email,
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

  // ── DISPUTE / CHARGEBACK HANDLER ────────────────────────────
  if (event.type === 'charge.dispute.created') {
    const dispute    = event.data.object
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
