import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { tier, seats, examAddon, userId, accessYear } = session.metadata

    if (!userId) {
      return Response.json({ error: 'Missing userId in metadata' }, { status: 400 })
    }

    const year = Number(accessYear) || new Date().getFullYear()
    const periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59))

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan: tier,
          status: 'active',
          stripe_customer_id: session.customer,
          stripe_session_id: session.id,
          exam_addon: examAddon === 'true',
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Supabase upsert error:', error)
      return Response.json({ error: 'DB write failed' }, { status: 500 })
    }
  }

  return Response.json({ received: true })
}
