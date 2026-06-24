import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'You must be logged in to accept an invitation.' }, { status: 401 })
    }

    let body
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

    const { token } = body
    if (!token) return NextResponse.json({ error: 'Missing invite token' }, { status: 400 })

    const admin = createAdminClient()

    // ── Find the invite ──────────────────────────────────────────────────
    const { data: invite, error: inviteErr } = await admin
      .from('team_invites')
      .select('id, team_id, email, status, expires_at')
      .eq('token', token)
      .single()

    if (inviteErr || !invite) {
      return NextResponse.json({ error: 'Invitation not found. It may have been revoked.' }, { status: 404 })
    }
    if (invite.status === 'accepted') {
      return NextResponse.json({ error: 'This invitation has already been accepted.', already_accepted: true }, { status: 409 })
    }
    if (invite.status === 'revoked') {
      return NextResponse.json({ error: 'This invitation has been revoked. Contact your team manager.' }, { status: 410 })
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired. Contact your team manager to resend.' }, { status: 410 })
    }

    // ── Verify email matches ─────────────────────────────────────────────
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({
        error: `This invitation was sent to ${invite.email}. Please log in with that email address.`,
      }, { status: 403 })
    }

    // ── Check if already a team member ───────────────────────────────────
    const { data: existing } = await admin
      .from('team_members')
      .select('id, status')
      .eq('team_id', invite.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.status === 'active') {
      // Already a member — just mark invite accepted and return success
      await admin
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id)
      return NextResponse.json({ success: true, already_member: true })
    }

    // ── Get team plan to set license_type ────────────────────────────────
    const { data: team } = await admin
      .from('teams')
      .select('plan_type, access_expiry')
      .eq('id', invite.team_id)
      .single()

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
    }
    if (new Date(team.access_expiry) < new Date()) {
      return NextResponse.json({ error: 'This team license has expired.' }, { status: 410 })
    }

    const planType      = team.plan_type ?? 'course_exam'
    const hasExamAccess = planType === 'course_exam'

    // ── Create team_members record ────────────────────────────────────────
    const { error: memberErr } = await admin
      .from('team_members')
      .insert({
        team_id:            invite.team_id,
        user_id:            user.id,
        email:              user.email,
        display_name:       user.user_metadata?.full_name ?? user.email.split('@')[0],
        role:               'team_member',
        license_type:       planType,
        has_exam_access:    hasExamAccess,
        exam_access_source: hasExamAccess ? 'team_purchase' : 'none',
        status:             'active',
      })

    if (memberErr) {
      console.error('[team/accept] team_members insert error:', memberErr)
      return NextResponse.json({ error: 'Failed to activate license: ' + memberErr.message }, { status: 500 })
    }

    // ── Mark invite as accepted ───────────────────────────────────────────
    await admin
      .from('team_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    console.log(`[team/accept] user ${user.id} (${user.email}) joined team ${invite.team_id}`)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[team/accept] unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
