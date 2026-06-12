import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isStudentEmail, STUDENT_DISCOUNT, getTeamPerSeat } from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLANS = {
  t1:   { name: 'Practice Exam',  amount: 25000 },
  t2:   { name: 'Full Course',    amount: 39500 },
  t3:   { name: 'Course + Exam',  amount: 59500 },
  team: { name: 'Team License',   amount: null  },
}

export async function POST(request) {
  if (!checkOrigin(request)) return originError()

  let body
  try {
    const text = await request.text()
    if (text.length > 16000) return new Response(JSON.stringify({ error: 'Request too large' }), { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { plan, seats } = body
  if (!plan || !PLANS[plan]) {
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
    const seatCount = parseInt(seats) || 2
    if (seatCount < 2 || seatCount > 10) {
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
    unitAmount = PLANS[plan].amount
    productName = PLANS[plan].name
    quantity = 1
    // Apply student discount server-side only
    if (isStudentEmail(email)) {
      unitAmount = Math.round(unitAmount * (1 - STUDENT_DISCOUNT))
      productName += ' — Student 40% off'
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lightingmasterlc.com'

  console.log('Creating Stripe session:', {
    plan,
    unitAmount,
    productName,
    quantity,
    email,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 12),
  })

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
    console.error('Stripe error:', {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      param: err.param,
      raw: err.raw,
    })
    return new Response(
      JSON.stringify({
        error: 'Checkout session creation failed',
        detail: err.message,
        code: err.code,
        type: err.type,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
