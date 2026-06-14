import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isStudentEmail, getPriceForTier, studentPrice, getTeamPerSeat } from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const VALID_PLANS = ['t1', 't2', 't3', 'team']

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
    const seatCount = Math.floor(Number(seats))
    if (!Number.isInteger(seatCount) || seatCount < 2 || seatCount > 10) {
      return new Response(JSON.stringify({
        error: seatCount > 10
          ? 'For 11+ seats please contact admin@luxartmedia.com'
          : 'Minimum 2 seats for team license',
      }), { status: 400 })
    }
    const tier = getTeamPerSeat(seatCount)
    unitAmount = tier.perSeat * 100
    productName = `Team License (${tier.label})`
    quantity = seatCount
  } else {
    const priceInfo = getPriceForTier(plan)
    const isStudent = isStudentEmail(email)
    unitAmount = isStudent ? studentPrice(priceInfo.amountCents) : priceInfo.amountCents
    productName = priceInfo.label + (isStudent ? ' — Student 40% off' : '')
    quantity = 1
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lightingmasterlc.com'

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
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: { name: productName },
        },
        quantity,
      }],
      success_url: `${appUrl}/dashboard?purchase=success&plan=${plan}`,
      cancel_url:  `${appUrl}/pricing?cancelled=true`,
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
