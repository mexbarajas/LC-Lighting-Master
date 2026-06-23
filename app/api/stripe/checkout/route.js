// TODO (Mario): In Supabase Dashboard → Authentication → Email Templates,
// add these legal links to the footer of the Confirm Signup email:
//   <p style="font-size:11px;color:#8a7a6a;margin:8px 0 0;">
//     <a href="https://lightingmasterlc.com/legal/terms-of-service" style="color:#b85835;text-decoration:none;">Terms</a> ·
//     <a href="https://lightingmasterlc.com/legal/privacy-policy" style="color:#b85835;text-decoration:none;">Privacy</a> ·
//     <a href="https://lightingmasterlc.com/legal/refund-policy" style="color:#b85835;text-decoration:none;">Refund Policy</a>
//   </p>

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PLANS,
  TEAM_PLAN_TYPES,
  TEAM_MEMBER_EXAM_ADD_ON_PRICE,
  MIN_TEAM_SEATS,
} from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const VALID_PLANS = ['t1', 't2', 't3', 'team', 'exam_addon', 'team_member_exam_addon']

// Stripe Price IDs for individual plans — set in Vercel env vars
const PRICE_IDS = {
  t1: process.env.STRIPE_PRICE_T1,
  t2: process.env.STRIPE_PRICE_T2,
  t3: process.env.STRIPE_PRICE_T3,
}

export async function POST(request) {
  if (!checkOrigin(request)) return originError()

  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 415 })
  }

  let body
  try {
    const text = await request.text()
    if (text.length > 16000) return new Response(JSON.stringify({ error: 'Request too large' }), { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { plan, seats, planType } = body
  if (!plan || !VALID_PLANS.includes(plan)) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 })
  }

  // Authenticate user
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  const user = session.user
  const email = user.email || ''

  // Build line item
  let unitAmount, productName, quantity, extraMetadata = {}

  if (plan === 'team') {
    // ── TEAM PLAN CHECKOUT ──────────────────────────────────────
    if (!TEAM_PLAN_TYPES[planType]) {
      return new Response(JSON.stringify({
        error: 'Choose a team plan type: course_only ($349/seat) or course_exam ($450/seat).',
      }), { status: 400 })
    }
    const seatCount = parseInt(seats) || 0
    if (seatCount < MIN_TEAM_SEATS) {
      return new Response(JSON.stringify({
        error: `Minimum ${MIN_TEAM_SEATS} seats for team license. For individual access see our standard plans.`,
      }), { status: 400 })
    }
    if (seatCount >= 11) {
      return new Response(JSON.stringify({
        error: 'For 11+ seats please contact admin@luxartmedia.com for a custom quote.',
      }), { status: 400 })
    }
    unitAmount    = TEAM_PLAN_TYPES[planType].perSeat * 100
    productName   = `Team License — ${TEAM_PLAN_TYPES[planType].name}`
    quantity      = seatCount
    extraMetadata = { plan_type: planType }

  } else if (plan === 'team_member_exam_addon') {
    // ── TEAM MEMBER EXAM ADD-ON ($99) ───────────────────────────
    // Server-side eligibility: active team member with course_only license, no exam access yet
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from('team_members')
      .select('team_id, license_type, has_exam_access, member_exam_add_on_paid')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Not a team member.' }), { status: 403 })
    }
    if (membership.license_type !== 'course_only') {
      return new Response(JSON.stringify({ error: 'Exam access is already included in your team license.' }), { status: 400 })
    }
    if (membership.has_exam_access || membership.member_exam_add_on_paid) {
      return new Response(JSON.stringify({ error: 'You already have exam access.' }), { status: 400 })
    }

    // Verify the team is still active
    const { data: team } = await admin
      .from('teams')
      .select('access_expiry')
      .eq('id', membership.team_id)
      .maybeSingle()
    if (!team || new Date(team.access_expiry) < new Date()) {
      return new Response(JSON.stringify({ error: 'Your team license is inactive or expired.' }), { status: 403 })
    }

    unitAmount  = TEAM_MEMBER_EXAM_ADD_ON_PRICE * 100
    productName = 'Team Member Exam Add-On'
    quantity    = 1

  } else {
    // ── INDIVIDUAL PLANS ────────────────────────────────────────
    const planData = PLANS[plan]
    if (!planData) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 })
    }
    unitAmount  = planData.amount
    productName = planData.name
    quantity    = 1
    // Student discounts applied manually via Stripe coupon codes sent by email
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lightingmasterlc.com'

  // Use a pre-created Stripe Price ID for t1/t2/t3 if available, otherwise fall back
  // to dynamic price_data (used for team plans, exam_addon, team_member_exam_addon)
  const priceId = PRICE_IDS[plan]
  const lineItem = priceId
    ? { price: priceId, quantity }
    : { price_data: { currency: 'usd', unit_amount: unitAmount, product_data: { name: productName } }, quantity }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      metadata: {
        user_id:  user.id,
        plan,
        seats:    seats ? String(seats) : '1',
        ...extraMetadata,
      },
      line_items: [lineItem],
      success_url: `${appUrl}/?purchase=success&plan=${plan}`,
      cancel_url:  `${appUrl}/?cancelled=true`,
    })

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    // Log internally without exposing Stripe internals to the client
    console.error('Stripe checkout error:', err.type || err.code || 'unknown')
    return new Response(
      JSON.stringify({ error: 'Checkout unavailable. Please try again or contact support.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
