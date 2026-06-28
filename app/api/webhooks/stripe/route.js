// app/api/webhooks/stripe/route.js
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buildPriceToPlanMap } from '@/lib/pricing';

let _stripe, _supabase;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return _supabase;
}

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session       = event.data.object;
  const paymentIntent = session.payment_intent;
  const metadata      = session.metadata || {};

  console.log('[webhook] checkout.session.completed | type:', metadata.type || 'individual');

  try {
    if (metadata.type === 'team_purchase') {
      return await handleTeamPurchase(session, paymentIntent, metadata);
    }
    if (metadata.type === 'team_exam_addon') {
      return await handleTeamExamAddon(session, paymentIntent, metadata);
    }
    return await handleIndividualPlan(session, paymentIntent);
  } catch (err) {
    console.error('[webhook] unhandled error:', err);
    return NextResponse.json({ received: true, warning: 'handler threw' });
  }
}

async function handleTeamPurchase(session, paymentIntent, metadata) {
  const { user_id, seats: seatsStr, plan_type, price_per_seat: ppsStr, total: totalStr } = metadata;

  const seats        = parseInt(seatsStr, 10);
  const pricePerSeat = parseInt(ppsStr, 10);
  const total        = parseInt(totalStr, 10);

  if (!user_id || !seats || !plan_type || !pricePerSeat) {
    console.error('[webhook/team_purchase] missing metadata fields:', metadata);
    return NextResponse.json({ error: 'Incomplete metadata' }, { status: 400 });
  }

  const { data: existing } = await getSupabase()
    .from('teams')
    .select('id')
    .eq('stripe_ref', paymentIntent)
    .maybeSingle();

  if (existing) {
    console.log('[webhook/team_purchase] already processed, skipping. PI:', paymentIntent);
    return NextResponse.json({ received: true });
  }

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const accessExpiry = expiry.toISOString().split('T')[0];

  const { data: team, error: teamErr } = await getSupabase()
    .from('teams')
    .insert({
      owner_id:         user_id,
      tier:             'team',
      seat_count:       seats,
      seats_purchased:  seats,
      plan_type,
      price_per_seat:   pricePerSeat,
      total_team_price: total,
      stripe_ref:       paymentIntent,
      access_expiry:    accessExpiry,
    })
    .select('id')
    .single();

  if (teamErr) {
    console.error('[webhook/team_purchase] team insert error:', teamErr);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }

  const hasExamAccess = plan_type === 'course_exam';

  const { error: memberErr } = await getSupabase()
    .from('team_members')
    .insert({
      team_id:            team.id,
      user_id:            user_id,
      role:               'team_admin',
      license_type:       plan_type,
      has_exam_access:    hasExamAccess,
      exam_access_source: hasExamAccess ? 'team_purchase' : 'none',
      status:             'active',
    });

  if (memberErr) {
    console.error('[webhook/team_purchase] team_member insert error (non-fatal):', memberErr);
  }

  console.log(
    `[webhook/team_purchase] team ${team.id} created | ${seats} seats | ${plan_type} | manager: ${user_id}`
  );
  return NextResponse.json({ received: true });
}

async function handleTeamExamAddon(session, paymentIntent, metadata) {
  const { user_id, team_member_id, team_id } = metadata;

  if (!user_id || !team_member_id || !team_id) {
    console.error('[webhook/team_exam_addon] missing metadata fields:', metadata);
    return NextResponse.json({ error: 'Incomplete metadata' }, { status: 400 });
  }

  const { data: existing } = await getSupabase()
    .from('team_members')
    .select('member_exam_add_on_paid, member_exam_add_on_payment_id')
    .eq('id', team_member_id)
    .maybeSingle();

  if (
    existing?.member_exam_add_on_paid &&
    existing?.member_exam_add_on_payment_id === paymentIntent
  ) {
    console.log('[webhook/team_exam_addon] already processed, skipping. PI:', paymentIntent);
    return NextResponse.json({ received: true });
  }

  const { data: member, error: memberErr } = await getSupabase()
    .from('team_members')
    .select('license_type, has_exam_access, status')
    .eq('id', team_member_id)
    .eq('user_id', user_id)
    .eq('team_id', team_id)
    .single();

  if (memberErr || !member) {
    console.error('[webhook/team_exam_addon] member not found:', { team_member_id, user_id, team_id });
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (member.status === 'deactivated') {
    console.error('[webhook/team_exam_addon] member is deactivated:', team_member_id);
    return NextResponse.json({ error: 'Member deactivated; manual review required' }, { status: 400 });
  }

  if (member.license_type !== 'course_only' || member.has_exam_access) {
    console.error('[webhook/team_exam_addon] member already has exam or wrong license:', member);
    return NextResponse.json({ error: 'Member already has exam access; manual review required' }, { status: 400 });
  }

  const { error: updateErr } = await getSupabase()
    .from('team_members')
    .update({
      has_exam_access:               true,
      exam_access_source:            'member_add_on',
      member_exam_add_on_paid:       true,
      member_exam_add_on_payment_id: paymentIntent,
    })
    .eq('id', team_member_id)
    .eq('user_id', user_id);

  if (updateErr) {
    console.error('[webhook/team_exam_addon] update error:', updateErr);
    return NextResponse.json({ error: 'Failed to grant exam access' }, { status: 500 });
  }

  console.log(
    `[webhook/team_exam_addon] exam access granted | member: ${team_member_id} | PI: ${paymentIntent}`
  );
  return NextResponse.json({ received: true });
}

async function handleIndividualPlan(session, paymentIntent) {
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.error('[webhook/individual] no user_id in session metadata');
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const { data: existing } = await getSupabase()
    .from('subscriptions')
    .select('stripe_payment_intent, plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.stripe_payment_intent === paymentIntent && existing?.plan !== 'free') {
    console.log('[webhook/individual] already processed, skipping. PI:', paymentIntent);
    return NextResponse.json({ received: true });
  }

  let plan = session.metadata?.plan || null;

  if (!plan) {
    try {
      const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 5 });
      const priceId   = lineItems.data?.[0]?.price?.id;
      const priceMap  = buildPriceToPlanMap();
      plan = priceMap[priceId] || null;
    } catch (lineErr) {
      console.error('[webhook/individual] failed to fetch line items:', lineErr);
    }
  }

  if (!plan) {
    console.error('[webhook/individual] could not resolve plan from session:', session.id);
    return NextResponse.json({ error: 'Unknown price — cannot resolve plan' }, { status: 400 });
  }

  const examAddon = ['t2', 't3'].includes(plan);

  const { error: upsertErr } = await getSupabase()
    .from('subscriptions')
    .upsert(
      {
        user_id:               userId,
        plan,
        status:                'active',
        exam_addon:            examAddon,
        stripe_payment_intent: paymentIntent,
        updated_at:            new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertErr) {
    console.error('[webhook/individual] upsert error:', upsertErr);
    return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
  }

  console.log(`[webhook/individual] plan '${plan}' activated for user: ${userId}`);
  return NextResponse.json({ received: true });
}
