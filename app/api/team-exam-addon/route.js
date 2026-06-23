// app/api/team-exam-addon/route.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(_req) {
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

    const { data: member, error: memberErr } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        license_type,
        has_exam_access,
        member_exam_add_on_paid,
        status,
        teams ( access_expiry )
      `)
      .eq('user_id', user.id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json(
        { error: 'You must be an active team member to purchase this add-on.' },
        { status: 403 }
      );
    }

    if (member.status === 'deactivated') {
      return NextResponse.json(
        { error: 'Your team license has been deactivated. Contact your team manager.' },
        { status: 403 }
      );
    }

    if (member.status === 'pending') {
      return NextResponse.json(
        { error: 'Your team license is pending activation. Please accept your team invite first.' },
        { status: 403 }
      );
    }

    if (member.license_type !== 'course_only') {
      return NextResponse.json(
        { error: 'Your team license already includes exam access.' },
        { status: 400 }
      );
    }

    if (member.has_exam_access || member.member_exam_add_on_paid) {
      return NextResponse.json(
        { error: 'You already have exam access on this account.' },
        { status: 400 }
      );
    }

    const teamExpiry = member.teams?.access_expiry;
    if (!teamExpiry || new Date(teamExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Your team license has expired. Contact your team manager to renew.' },
        { status: 403 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_TEAM_EXAM_ADDON,
          quantity: 1,
        },
      ],
      metadata: {
        type:           'team_exam_addon',
        user_id:        user.id,
        team_member_id: member.id,
        team_id:        member.team_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?exam_addon=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/app?exam_addon=cancelled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error('[team-exam-addon] error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
