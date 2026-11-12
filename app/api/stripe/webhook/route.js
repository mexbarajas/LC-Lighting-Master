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
import { escapeHtml } from '@/lib/html-escape'
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

// ── REFUND / CHARGEBACK HELPERS ───────────────────────────────

// Best-effort email to the admin. Never throws and never affects the webhook response.
async function notifyAdmin(subject, lines) {
  try {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) return
    const adminEmail = 'admin@luxartmedia.com'
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: 'LC Lighting Master', email: process.env.BREVO_SENDER_EMAIL || adminEmail },
        to: [{ email: adminEmail, name: 'Luxart Admin' }],
        subject: String(subject).replace(/[\r\n]/g, ' ').slice(0, 200),
        htmlContent: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#16120e">${escapeHtml(String(subject))}</h2>
          ${lines.map(l => `<p style="font-size:14px;line-height:1.5;margin:6px 0">${escapeHtml(String(l))}</p>`).join('')}
          <p style="font-size:11px;color:#8a7a6a;margin-top:16px">Sent from the LightingMasterLC Stripe webhook</p>
        </div>`,
      }),
    })
  } catch (err) {
    console.error('notifyAdmin failed:', err?.message)
  }
}

// Revokes the individual subscription for a refunded / disputed payment.
// Matching order: customer id, payment intent, then email (only if exactly one user has it).
// Returns how the user was matched, or null.
async function revokeSubscription(supabase, { customer, paymentIntent, email }, status) {
  const payload = {
    plan:               'free',
    status,
    current_period_end: null,
    exam_addon:         false,
    updated_at:         new Date().toISOString(),
  }

  if (customer) {
    const { data, error } = await supabase
      .from('subscriptions').update(payload).eq('stripe_customer_id', customer).select()
    if (!error && data?.length > 0) return 'customer'
  }

  if (paymentIntent) {
    const { data, error } = await supabase
      .from('subscriptions').update(payload).eq('stripe_payment_intent', paymentIntent).select()
    if (!error && data?.length > 0) return 'payment_intent'
  }

  if (email) {
    const { data: candidates, error: countErr } = await supabase
      .from('subscriptions').select('user_id').eq('email', email.toLowerCase())
    if (!countErr && candidates && candidates.length === 1) {
      const { error, data } = await supabase
        .from('subscriptions').update(payload).eq('user_id', candidates[0].user_id).select()
      if (!error && data?.length > 0) return 'email'
    } else if (candidates && candidates.length > 1) {
      console.warn('⚠ Revoke: email match is ambiguous (multiple users), skipping email lookup', {
        email, matches: candidates.length,
      })
    }
  }
  return null
}

// A refunded / disputed payment can also have paid for a team or a team-member exam add-on.
// Teams record the payment intent in teams.stripe_ref; add-ons in team_members.member_exam_add_on_payment_id.
async function revokeTeamAccess(supabase, paymentIntent) {
  if (!paymentIntent) return { teams: 0, addons: 0 }
  // Every team access check compares access_expiry with today, so yesterday ends access everywhere.
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const { data: teams, error: teamErr } = await supabase
    .from('teams').update({ access_expiry: yesterday }).eq('stripe_ref', paymentIntent).select('id')
  if (teamErr) console.error('Revoke: team expiry update error:', teamErr)

  const { data: addons, error: addonErr } = await supabase
    .from('team_members')
    .update({ has_exam_access: false, exam_access_source: 'none', member_exam_add_on_paid: false })
    .eq('member_exam_add_on_payment_id', paymentIntent)
    .select('id')
  if (addonErr) console.error('Revoke: team add-on update error:', addonErr)

  return { teams: teams?.length || 0, addons: addons?.length || 0 }
}

async function handleRevocation(kind, status, { customer, paymentIntent, email, amount, currency }) {
  const supabase = createServiceClient()
  const matchedBy = await revokeSubscription(supabase, { customer, paymentIntent, email }, status)
  const team = await revokeTeamAccess(supabase, paymentIntent)
  const handled = !!matchedBy || team.teams > 0 || team.addons > 0

  const money = (typeof amount === 'number')
    ? `${(amount / 100).toFixed(2)} ${(currency || '').toUpperCase()}`.trim()
    : 'unknown amount'
  const details = [
    `Amount: ${money}`,
    `Email: ${email || 'unknown'}`,
    `Payment: ${paymentIntent || 'unknown'}`,
    `Customer: ${customer || 'none'}`,
  ]

  if (handled) {
    console.log(`✓ ${kind}: access revoked`, { matchedBy, ...team, paymentIntent })
    await notifyAdmin(`${kind} processed — access revoked`, [
      ...details,
      `Individual plan revoked: ${matchedBy ? `yes (matched by ${matchedBy.replace('_', ' ')})` : 'no'}`,
      `Teams ended: ${team.teams} · Team exam add-ons removed: ${team.addons}`,
      ...(matchedBy === 'email' ? ['Note: matched by email only — check this is the right purchase.'] : []),
    ])
  } else {
    console.error(`✗ ${kind}: could not find access to revoke`, { customer, paymentIntent, email })
    await notifyAdmin(`ACTION NEEDED: ${kind} could not be matched to a user`, [
      ...details,
      'No account or team matched this payment. Please review it in Stripe and the admin panel.',
    ])
  }
  return handled
}

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
    let plan      = session.metadata?.plan
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

    // Validate team seat count (team plans only)
    if (plan === 'team') {
      if (seats < MIN_TEAM_SEATS || seats >= 11 || isNaN(seats)) {
        console.error('Invalid seat count in webhook:', seats)
        return new Response('Invalid seat count', { status: 400 })
      }
    }

    // Log what was paid for audit purposes
    console.log('Webhook amount info:', {
      plan, seats,
      amount_subtotal: session.amount_subtotal,
      amount_total:    session.amount_total,
    })

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
        .select('stripe_payment_intent, plan, status')
        .eq('stripe_payment_intent', session.payment_intent)
        .maybeSingle()
      // A refunded / disputed payment keeps its payment intent with plan 'free'. A replayed
      // checkout event for it must not grant access again.
      const wasRevoked = existing && (existing.status === 'refunded' || existing.status === 'disputed')
      if (existing && existing.stripe_payment_intent && (existing.plan !== 'free' || wasRevoked)) {
        console.log(`Duplicate webhook ignored — payment already processed: ${session.payment_intent}`)
        return new Response('Already processed', { status: 200 })
      }
    }

    // Cumulative upgrade: T1 + T2 = T3 (purchases stack, never downgrade)
    if (['t1', 't2', 't3'].includes(plan)) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('plan, exam_addon')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingSub) {
        const prev           = existingSub.plan
        const prevHasExam    = ['t1', 't3'].includes(prev) || existingSub.exam_addon === true
        const prevHasCourse  = ['t2', 't3'].includes(prev)
        const newHasExam     = ['t1', 't3'].includes(plan)
        const newHasCourse   = ['t2', 't3'].includes(plan)

        if ((prevHasExam || newHasExam) && (prevHasCourse || newHasCourse)) {
          console.log(`Plan upgrade: ${prev} + ${plan} → t3 (cumulative)`)
          plan = 't3'
        }
      }
    }

    // Determine exam_addon value for the subscription upsert
    let examAddon = false
    if (plan === 'exam_addon' || plan === 'team_member_exam_addon') {
      examAddon = true
    } else if (plan === 'team' && planType && TEAM_PLAN_TYPES[planType]) {
      examAddon = TEAM_PLAN_TYPES[planType].hasExam
    } else if (PLANS[plan]) {
      examAddon = PLANS[plan].includesExam ?? false
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
            ...(session.payment_intent ? { stripe_ref: session.payment_intent } : {}),
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
            stripe_ref:        session.payment_intent || null,
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
      isFullRefund,
      amountRefunded: charge.amount_refunded,
      amount:         charge.amount,
    })

    if (!isFullRefund) {
      return new Response('Partial refund — no action', { status: 200 })
    }

    await handleRevocation('Refund', 'refunded', {
      customer:      charge.customer,
      paymentIntent: charge.payment_intent,
      email:         charge.receipt_email || charge.billing_details?.email || null,
      amount:        charge.amount,
      currency:      charge.currency,
    })
  }

  // ── DISPUTE / CHARGEBACK HANDLER ────────────────────────────
  // A dispute object carries the charge and payment intent ids, not the customer.
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object
    const ref = {
      customer:      dispute.customer || null,
      paymentIntent: dispute.payment_intent || null,
      email:         null,
      amount:        dispute.amount,
      currency:      dispute.currency,
    }

    // Fill in the customer / email from the charge so the email fallback can work too.
    if (dispute.charge) {
      try {
        const charge = await stripe.charges.retrieve(dispute.charge)
        ref.customer      = ref.customer || charge.customer || null
        ref.paymentIntent = ref.paymentIntent || charge.payment_intent || null
        ref.email         = charge.receipt_email || charge.billing_details?.email || null
      } catch (err) {
        console.error('Dispute: could not load charge', dispute.charge, err?.message)
      }
    }

    console.log('Dispute event:', { dispute: dispute.id, paymentIntent: ref.paymentIntent, customer: ref.customer })
    await handleRevocation('Chargeback', 'disputed', ref)
  }

  return new Response('OK', { status: 200 })
}
