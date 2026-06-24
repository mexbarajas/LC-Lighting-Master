import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function GET(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isSiteAdmin = SITE_ADMIN_EMAILS.includes(user.email)
    const url = new URL(req.url)
    const requestedTeamId = url.searchParams.get('team_id')

    let teamId = null
    let role = null

    if (isSiteAdmin && requestedTeamId) {
      // Admin viewing a specific team
      teamId = requestedTeamId
      role = 'site_admin'
    } else {
      // Team manager (or admin with no team_id) — resolve their own team
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!membership) return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
      teamId = membership.team_id
      role = membership.role
    }

    const adminClient = createAdminClient()

    // Build stats directly (avoid RPC auth.uid() mismatch when admin views other teams)
    const { data: team } = await adminClient
      .from('teams')
      .select('seat_count, seats_purchased, plan_type, access_expiry, price_per_seat, total_team_price')
      .eq('id', teamId)
      .single()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    const seats = team.seats_purchased ?? team.seat_count

    const { count: activeCount } = await adminClient
      .from('team_members').select('id', { count: 'exact', head: true })
      .eq('team_id', teamId).eq('status', 'active')
    const { count: deactivatedCount } = await adminClient
      .from('team_members').select('id', { count: 'exact', head: true })
      .eq('team_id', teamId).eq('status', 'deactivated')
    const { count: pendingCount } = await adminClient
      .from('team_invites').select('id', { count: 'exact', head: true })
      .eq('team_id', teamId).eq('status', 'pending')

    const { data: invites } = await adminClient
      .from('team_invites')
      .select('id, email, status, invited_at, expires_at')
      .eq('team_id', teamId).eq('status', 'pending')
      .order('invited_at', { ascending: false })

    const stats = {
      seats_purchased:  seats,
      active_licenses:  activeCount ?? 0,
      pending_invites:  pendingCount ?? 0,
      deactivated:      deactivatedCount ?? 0,
      available_seats:  seats - (activeCount ?? 0) - (pendingCount ?? 0),
      plan_type:        team.plan_type,
      access_expiry:    team.access_expiry,
      price_per_seat:   team.price_per_seat,
      total_team_price: team.total_team_price,
    }

    return NextResponse.json({
      team_id: teamId,
      role,
      stats,
      pending_invites: invites ?? [],
    })
  } catch (err) {
    console.error('[team/stats]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
