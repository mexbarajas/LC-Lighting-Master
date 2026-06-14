import Stripe from 'stripe'
import { getPriceForTier, getTeamPerSeat, isStudentEmail, studentPrice } from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'
import { createClient } from '@/lib/supabase/server'

export const config = {
  api: { bodyParser: { sizeLimit: '16kb' } },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  if (!checkOrigin(request)) return originError()

  const { tier, seats = 1, examAddon, userId } = await request.json()

  if (!['t1', 't2', 't3', 'team'].includes(tier)) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const seatCount = Number(seats)

  // Email from server session only — never trusted from request body
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const serverEmail = user?.email ?? null

  if (tier === 'team') {
    const teamTier = getTeamPerSeat(seatCount)
    if (teamTier.contact) {
      return Response.json({ error: 'Contact us for 11+ seats' }, { status: 400 })
    }
    const perSeatCents = teamTier.perSeat * 100
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: serverEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: perSeatCents,
          product_data: { name: 'LC · Lighting Master — Team Access' },
        },
        quantity: seatCount,
      }],
      metadata: {
        tier: 'team',
        seats: String(seatCount),
        examAddon: 'false',
        userId: userId || '',
        accessYear: String(new Date().getFullYear()),
        studentDiscount: 'false',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    })
    return Response.json({ url: session.url })
  }

  // Individual tiers (t1/t2/t3)
  const priceInfo = getPriceForTier(tier, 1, Boolean(examAddon))
  if (!priceInfo) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 })
  }

  let { amountCents, label } = priceInfo
  let discountApplied = false

  if (isStudentEmail(serverEmail)) {
    amountCents = studentPrice(amountCents)
    label = label + ' — Student 40% off'
    discountApplied = true
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: serverEmail || undefined,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amountCents,
        product_data: { name: label },
      },
      quantity: 1,
    }],
    metadata: {
      tier,
      seats: '1',
      examAddon: String(Boolean(examAddon)),
      userId: userId || '',
      accessYear: String(new Date().getFullYear()),
      studentDiscount: String(discountApplied),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
  })

  return Response.json({ url: session.url })
}
