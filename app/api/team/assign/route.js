import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { MIN_TEAM_SEATS } from '@/lib/pricing'
import crypto from 'crypto'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']
    const isSiteAdmin = SITE_ADMIN_EMAILS.includes(user.email)
    const body = await req.json()
    const bodyTeamId = body.team_id
    const email = body.email
    const normalizedEmail = email?.toLowerCase().trim()
    if (!normalizedEmail) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    let teamId
    if (isSiteAdmin && bodyTeamId) {
      teamId = bodyTeamId
    } else {
      const { data: callerMembership } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!callerMembership || (callerMembership.role !== 'team_admin' && !isSiteAdmin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      teamId = callerMembership.team_id
    }
    const adminClient = createAdminClient()

    // ── Fetch team to check seat availability ─────────────────────────────
    const { data: team } = await adminClient
      .from('teams')
      .select('seat_count, seats_purchased, plan_type, access_expiry')
      .eq('id', teamId)
      .single()

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (new Date(team.access_expiry) < new Date()) {
      return NextResponse.json({ error: 'Team license has expired. Please renew before assigning seats.' }, { status: 403 })
    }

    const maxSeats = team.seats_purchased ?? team.seat_count

    // Count active members + pending invites
    const { count: activeCount } = await adminClient
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active')

    const { count: pendingCount } = await adminClient
      .from('team_invites')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'pending')

    const usedSeats = (activeCount ?? 0) + (pendingCount ?? 0)

    // ── Check: email already active in THIS team ──────────────────────────
    const { data: existingInTeam } = await adminClient
      .from('team_members')
      .select('id, status, email')
      .eq('team_id', teamId)
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingInTeam?.status === 'active') {
      return NextResponse.json({
        error: 'This email already has an active license in your team.',
      }, { status: 409 })
    }

    // ── Check: email pending invite in THIS team ──────────────────────────
    const { data: existingInvite } = await adminClient
      .from('team_invites')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({
        error: 'A pending invite already exists for this email in your team.',
      }, { status: 409 })
    }

    // ── Check: reassignment fee warning ───────────────────────────────────
    // If all seats are full and the email belongs to a DEACTIVATED member
    // (manager is trying to put someone new in a slot that was never freed first),
    // flag it as a reassignment.
    if (usedSeats >= maxSeats) {
      // Is this email a deactivated member of this team?
      const isReassign = existingInTeam?.status === 'deactivated'
      return NextResponse.json({
        error: 'No seats available.',
        seats_full: true,
        can_reassign: isReassign,
        reassignment_fee: 100,
      }, { status: 409 })
    }

    // ── All clear — create the invite ─────────────────────────────────────
    const token = crypto.randomBytes(32).toString('hex')

    const { data: invite, error: inviteErr } = await adminClient
      .from('team_invites')
      .insert({
        team_id:    teamId,
        email:      normalizedEmail,
        token,
        status:     'pending',
        invited_by: user.id,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, token')
      .single()

    if (inviteErr) throw inviteErr

    // Send invite email via Brevo (uses existing contact API pattern)
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/team/join?token=${token}`
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'LC Lighting Master', email: 'admin@luxartmedia.com' },
          to: [{ email: normalizedEmail }],
          subject: 'You have been invited to LC Lighting Master',
          htmlContent: `
            <p>You have been invited to access LC Lighting Master as part of a team license.</p>
            <p>Click the link below to accept your invitation and set up your account:</p>
            <p><a href="${inviteUrl}" style="background:#e8a020;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">Accept Invitation</a></p>
            <p>This link expires in 14 days.</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
          `,
        }),
      })
    } catch (emailErr) {
      console.error('[team/assign] email send failed (non-fatal):', emailErr)
    }

    return NextResponse.json({
      success: true,
      invite_id: invite.id,
      message: `Invitation sent to ${normalizedEmail}`,
    })
  } catch (err) {
    console.error('[team/assign]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
