// app/api/team-checkout/route.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import {
  MIN_TEAM_SEATS,
  TEAM_COURSE_ONLY_PRICE,
  TEAM_COURSE_EXAM_PRICE,
  teamOrderTotal,
  TEAM_PLANS,
} from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try {
              toSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { seats, plan_type } = body;

    if (!Number.isInteger(seats) || seats < MIN_TEAM_SEATS) {
      return NextResponse.json(
        { error: `Minimum team size is ${MIN_TEAM_SEATS} seats.` },
        { status: 400 }
      );
    }

    if (!['course_only', 'course_exam'].includes(plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan_type. Must be "course_only" or "course_exam".' },
        { status: 400 }
      );
    }

    const pricePerSeat = plan_type === 'course_only'
      ? TEAM_COURSE_ONLY_PRICE
      : TEAM_COURSE_EXAM_PRICE;

    const total    = teamOrderTotal(seats, plan_type);
    const planMeta = TEAM_PLANS[plan_type];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `LC Lighting Master — Team License (${planMeta.label})`,
              description: `${seats} seat${seats > 1 ? 's' : ''} × $${pricePerSeat}/seat — ${planMeta.description}`,
            },
            unit_amount: total * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type:           'team_purchase',
        user_id:        user.id,
        seats:          String(seats),
        plan_type,
        price_per_seat: String(pricePerSeat),
        total:          String(total),
      },
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?team_purchase=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?team_purchase=cancelled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error('[team-checkout] error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
