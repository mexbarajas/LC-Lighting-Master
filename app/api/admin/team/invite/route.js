import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function POST(req) {
  try {
    // ── Auth: must be a logged-in admin ─────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Parse body ───────────────────────────────────────────────────────
    let body
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

    // Accept both team_id and teamId for compatibility
    const teamId = body.team_id ?? body.teamId
    const email  = body.email?.toLowerCase().trim()

    if (!teamId) return NextResponse.json({ error: 'team_id is required' }, { status: 400 })
    if (!email)  return NextResponse.json({ error: 'email is required' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Verify team exists ───────────────────────────────────────────────
    const { data: team, error: teamErr } = await admin
      .from('teams')
      .select('id, seat_count, seats_purchased, plan_type, access_expiry')
      .eq('id', teamId)
      .single()

    if (teamErr || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // ── Check seat availability ──────────────────────────────────────────
    const maxSeats = team.seats_purchased ?? team.seat_count

    const { count: activeCount } = await admin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active')

    const { count: pendingCount } = await admin
      .from('team_invites')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'pending')

    if ((activeCount ?? 0) + (pendingCount ?? 0) >= maxSeats) {
      return NextResponse.json({ error: 'No seats available. Deactivate a member first.' }, { status: 409 })
    }

    // ── Check for duplicate invite ───────────────────────────────────────
    const { data: existing } = await admin
      .from('team_invites')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'A pending invite already exists for this email.' }, { status: 409 })
    }

    // ── Check if already an active member ────────────────────────────────
    const { data: existingMember } = await admin
      .from('team_members')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'This email already has an active license on this team.' }, { status: 409 })
    }

    // ── Create invite ────────────────────────────────────────────────────
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: invite, error: inviteErr } = await admin
      .from('team_invites')
      .insert({
        team_id:    teamId,
        email,
        token,
        status:     'pending',
        invited_by: user.id,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (inviteErr) {
      console.error('[admin/team/invite] insert error:', inviteErr)
      return NextResponse.json({ error: 'Failed to create invite: ' + inviteErr.message }, { status: 500 })
    }

    // ── Send email via Brevo ─────────────────────────────────────────────
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/team/join?token=${token}`
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender:      { name: 'LC Lighting Master', email: 'admin@luxartmedia.com' },
          to:          [{ email }],
          subject:     'You have been invited to LC Lighting Master',
          htmlContent: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
              <h2 style="font-size:22px;color:#16120e;margin:0 0 16px">You have been invited to LC Lighting Master</h2>
              <p style="color:#6b5f52;line-height:1.6;margin:0 0 24px">
                You have been added to a team license. Click below to activate your account and start your LC exam preparation.
              </p>
              <a href="${inviteUrl}" style="display:inline-block;background:#e8a020;color:#fff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">
                Accept Invitation →
              </a>
              <p style="color:#b8a898;font-size:12px;margin:24px 0 0">This link expires in 14 days. If you did not expect this email, you can safely ignore it.</p>
            </div>
          `,
        }),
      })
    } catch (emailErr) {
      // Non-fatal — invite is created, email just didn't send
      console.error('[admin/team/invite] email send failed:', emailErr)
    }

    return NextResponse.json({
      success:   true,
      invite_id: invite.id,
      message:   `Invitation sent to ${email}`,
    })

  } catch (err) {
    console.error('[admin/team/invite] unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
