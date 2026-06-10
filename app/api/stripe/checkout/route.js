import Stripe from 'stripe'
import { getPriceForTier, getAccessExpiry } from '@/lib/pricing'
import { checkOrigin, originError } from '@/lib/csrf'

export const config = {
  api: { bodyParser: { sizeLimit: '16kb' } },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  if (!checkOrigin(request)) return originError()

  const { tier, seats = 1, examAddon, userId, userEmail } = await request.json()

  if (!['t1', 't2', 't3', 'team'].includes(tier)) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (tier === 'team' && Number(seats) >= 10) {
    return Response.json({ contactUs: true })
  }

  const priceInfo = getPriceForTier(tier, Number(seats), Boolean(examAddon))
  if (!priceInfo) {
    return Response.json({ contactUs: true })
  }

  const { amountCents, label } = priceInfo

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: { name: label },
        },
        quantity: 1,
      },
    ],
    metadata: {
      tier,
      seats: String(seats),
      examAddon: String(Boolean(examAddon)),
      userId: userId || '',
      accessYear: String(new Date().getFullYear()),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
  })

  return Response.json({ url: session.url })
}
