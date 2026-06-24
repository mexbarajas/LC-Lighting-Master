import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function POST(req, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Reactivation is ADMIN-ONLY (not team managers)
    if (!SITE_ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Only site admins can reactivate licenses.' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    // Load the target member
    const { data: target } = await adminClient
      .from('team_members')
      .select('id, user_id, status, team_id, license_type, has_exam_access, exam_access_source')
      .eq('id', id)
      .single()

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.status === 'active') {
      return NextResponse.json({ error: 'This member is already active.' }, { status: 400 })
    }

    // Check seat availability before reactivating
    const { data: team } = await adminClient
      .from('teams')
      .select('seat_count, seats_purchased, access_expiry, plan_type')
      .eq('id', target.team_id)
      .single()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (new Date(team.access_expiry) < new Date()) {
      return NextResponse.json({ error: 'Team license has expired. Renew before reactivating members.' }, { status: 403 })
    }

    const maxSeats = team.seats_purchased ?? team.seat_count

    const { count: activeCount } = await adminClient
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', target.team_id)
      .eq('status', 'active')

    const { count: pendingCount } = await adminClient
      .from('team_invites')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', target.team_id)
      .eq('status', 'pending')

    if ((activeCount ?? 0) + (pendingCount ?? 0) >= maxSeats) {
      return NextResponse.json({
        error: `No seats available (${activeCount}/${maxSeats} used). Deactivate another member or purchase more seats first.`,
      }, { status: 409 })
    }

    // Reactivate the member
    const { error: updErr } = await adminClient
      .from('team_members')
      .update({ status: 'active', deactivated_at: null })
      .eq('id', id)

    if (updErr) {
      console.error('[team/reactivate] update error:', updErr)
      return NextResponse.json({ error: 'Failed to reactivate member.' }, { status: 500 })
    }

    // Restore their subscription access based on the team license
    const restoredPlan = target.license_type === 'course_exam' ? 't3' : 't2'
    const restoredExam = target.license_type === 'course_exam' || target.has_exam_access

    await adminClient
      .from('subscriptions')
      .upsert(
        { user_id: target.user_id, plan: restoredPlan, exam_addon: restoredExam, status: 'active' },
        { onConflict: 'user_id' }
      )

    console.log(`[team/reactivate] member ${id} reactivated by ${user.email}`)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[team/members/[id]/reactivate] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
