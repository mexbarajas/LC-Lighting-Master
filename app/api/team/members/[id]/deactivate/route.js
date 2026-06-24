import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function POST(req, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    const isSiteAdmin = SITE_ADMIN_EMAILS.includes(user.email)

    // ── Load the target member ───────────────────────────────────────────
    const { data: target } = await adminClient
      .from('team_members')
      .select('id, user_id, status, team_id, role')
      .eq('id', id)
      .single()

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // ── Authorization: site admin OR team_admin of the same team OR team owner ─
    let authorized = isSiteAdmin

    if (!authorized) {
      // Is the caller a team_admin member of this team?
      const { data: callerMembership } = await adminClient
        .from('team_members')
        .select('role, team_id')
        .eq('user_id', user.id)
        .eq('team_id', target.team_id)
        .maybeSingle()

      if (callerMembership?.role === 'team_admin') authorized = true

      // Is the caller the team owner?
      if (!authorized) {
        const { data: team } = await adminClient
          .from('teams')
          .select('owner_id')
          .eq('id', target.team_id)
          .single()
        if (team?.owner_id === user.id) authorized = true
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Guards ────────────────────────────────────────────────────────────
    if (target.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot deactivate yourself.' }, { status: 400 })
    }
    if (target.status === 'deactivated') {
      return NextResponse.json({ error: 'This member is already deactivated.' }, { status: 400 })
    }

    // ── Deactivate the member ─────────────────────────────────────────────
    const { error: updErr } = await adminClient
      .from('team_members')
      .update({ status: 'deactivated', deactivated_at: new Date().toISOString() })
      .eq('id', id)

    if (updErr) {
      console.error('[team/deactivate] update error:', updErr)
      return NextResponse.json({ error: 'Failed to deactivate member.' }, { status: 500 })
    }

    // ── Revert their subscription to free ─────────────────────────────────
    await adminClient
      .from('subscriptions')
      .upsert(
        { user_id: target.user_id, plan: 'free', exam_addon: false, status: 'active' },
        { onConflict: 'user_id' }
      )

    console.log(`[team/deactivate] member ${id} deactivated by ${user.email}`)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[team/members/[id]/deactivate] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
