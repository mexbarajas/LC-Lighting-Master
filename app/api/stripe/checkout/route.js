// TODO (Mario): In Supabase Dashboard → Authentication → Email Templates,
// add these legal links to the footer of the Confirm Signup email:
//   <p style="font-size:11px;color:#8a7a6a;margin:8px 0 0;">
//     <a href="https://lightingmasterlc.com/legal/terms-of-service" style="color:#b85835;text-decoration:none;">Terms</a> ·
//     <a href="https://lightingmasterlc.com/legal/privacy-policy" style="color:#b85835;text-decoration:none;">Privacy</a> ·
//     <a href="https://lightingmasterlc.com/legal/refund-policy" style="color:#b85835;text-decoration:none;">Refund Policy</a>
//   </p>

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS, getTeamPerSeat } from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const VALID_PLANS = ['t1', 't2', 't3', 'team', 'exam_addon']

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

  const { plan, seats } = body
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
  let unitAmount, productName, quantity

  if (plan === 'team') {
    const seatCount = parseInt(seats) || 0
    if (seatCount < 5) {
      return new Response(JSON.stringify({
        error: 'Minimum 5 seats for team license. For individual access see our standard plans.',
      }), { status: 400 })
    }
    if (seatCount >= 11) {
      return new Response(JSON.stringify({
        error: 'For 11+ seats please contact admin@luxartmedia.com for a custom quote.',
      }), { status: 400 })
    }
    const tier = getTeamPerSeat(seatCount)
    unitAmount = tier.perSeat * 100
    productName = `Team License (${tier.label})`
    quantity = seatCount
  } else {
    const planData = PLANS[plan]
    if (!planData) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 })
    }
    unitAmount = planData.amount
    productName = planData.name
    quantity = 1
    // Student discounts applied manually via Stripe coupon codes sent by email
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lightingmasterlc.com'

  // Use a pre-created Stripe Price ID for t1/t2/t3 if available, otherwise fall back
  // to dynamic price_data (used for team plans and exam_addon which have no Price ID)
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
        user_id: user.id,
        plan,
        seats: seats ? String(seats) : '1',
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
