import Stripe from 'stripe'
import { getPriceForTier, getCurrentSeason, TIER_FEATURES } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const { tier, seats = 1, examAddon, userId, userEmail } = await request.json()

  if (!['t1', 't2', 't3', 'team'].includes(tier)) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (tier === 'team' && Number(seats) >= 10) {
    return Response.json({ contactUs: true })
  }

  const basePrice = getPriceForTier(tier, Number(seats))
  const addonPrice = (examAddon && tier === 't2') ? 20000 : 0
  const totalPrice = basePrice + addonPrice

  const tierInfo = TIER_FEATURES[tier] || {}
  let productName = tierInfo.name || tier.toUpperCase()
  if (tier === 'team') productName = `Team Access — ${seats} seat${seats > 1 ? 's' : ''}`
  if (examAddon && tier === 't2') productName += ' + Test Engine Add-on'

  const accessYear = new Date().getFullYear()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: totalPrice,
          product_data: {
            name: `LC · Lighting Master — ${productName}`,
            description: `One-time access through December 31, ${accessYear}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      tier,
      seats: String(seats),
      examAddon: String(!!examAddon),
      userId: userId || '',
      accessYear: String(accessYear),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
  })

  return Response.json({ url: session.url })
}
