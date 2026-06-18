import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'admin@luxartmedia.com'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return new Response('Forbidden', { status: 403 })
    }

    let body
    try { body = await req.json() } catch { body = {} }
    const { ownerUserId, seatCount } = body
    if (!ownerUserId) return new Response('Missing ownerUserId', { status: 400 })
    if (!seatCount || Number(seatCount) < 5) return new Response('Seat count must be at least 5', { status: 400 })

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('team_members')
      .select('team_id')
      .eq('user_id', ownerUserId)
      .maybeSingle()
    if (existing) return new Response('User is already on a team', { status: 409 })

    const { data: sub } = await admin
      .from('subscriptions')
      .select('email')
      .eq('user_id', ownerUserId)
      .maybeSingle()

    const ownerEmail = sub?.email || ownerUserId.slice(0, 8)
    const teamName = ownerEmail.includes('@')
      ? ownerEmail.split('@')[1].split('.')[0].charAt(0).toUpperCase() +
        ownerEmail.split('@')[1].split('.')[0].slice(1) + ' Team'
      : 'New Team'

    const accessExpiry = new Date(new Date().getFullYear(), 11, 31).toISOString()

    const { data: team, error: teamErr } = await admin
      .from('teams')
      .insert({
        name: teamName,
        owner_id: ownerUserId,
        tier: 't2',
        seat_count: Number(seatCount),
        access_expiry: accessExpiry,
      })
      .select('id')
      .single()

    if (teamErr || !team) {
      console.error('[admin/team/create] team insert error:', teamErr)
      return new Response('Could not create team', { status: 500 })
    }

    const { error: memberErr } = await admin
      .from('team_members')
      .insert({ team_id: team.id, user_id: ownerUserId, role: 'team_admin' })

    if (memberErr) {
      console.error('[admin/team/create] member insert error:', memberErr)
      await admin.from('teams').delete().eq('id', team.id)
      return new Response('Could not add owner to team', { status: 500 })
    }

    await admin
      .from('subscriptions')
      .upsert(
        { user_id: ownerUserId, plan: 'team_admin', status: 'active' },
        { onConflict: 'user_id' }
      )

    return NextResponse.json({ ok: true, teamId: team.id })
  } catch (err) {
    console.error('[admin/team/create] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
