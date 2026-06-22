import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminSession } from '@/lib/admin-middleware'
import { escapeHtml } from '@/lib/html-escape'
import { sanitizeEmailHeaderField } from '@/lib/email-validation'
import { NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req) {
  try {
    const auth = validateAdminSession(req)
    if (!auth.valid) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body
    try { body = await req.json() } catch { body = {} }
    const { teamId, email } = body
    if (!teamId) return new Response('Missing teamId', { status: 400 })
    if (!email || !EMAIL_REGEX.test(email)) return new Response('Invalid email', { status: 400 })

    const admin = createAdminClient()

    const { data: team } = await admin
      .from('teams')
      .select('id, name, seat_count')
      .eq('id', teamId)
      .single()
    if (!team) return new Response('Team not found', { status: 404 })

    const { count: memberCount } = await admin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)

    const { count: inviteCount } = await admin
      .from('team_invites')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'pending')

    if ((memberCount || 0) + (inviteCount || 0) >= team.seat_count) {
      return new Response('No seats available on this team', { status: 409 })
    }

    const { data: existing } = await admin
      .from('team_invites')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()
    if (existing) return new Response('Invite already sent to this email', { status: 409 })

    const { data: invite, error: insertErr } = await admin
      .from('team_invites')
      .insert({
        team_id: teamId,
        email: email.toLowerCase(),
        status: 'pending',
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (insertErr || !invite) {
      console.error('[admin/team/invite] insert error:', insertErr)
      return new Response('Could not create invite', { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lightingmasterlc.com'
    const joinUrl = `${siteUrl}/team/join?token=${invite.id}`
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'admin@luxartmedia.com'
    const brevoKey = process.env.BREVO_API_KEY

    if (brevoKey) {
      const sanitizedTeamName = escapeHtml(team.name)
      const sanitizedSubject = sanitizeEmailHeaderField(`You've been invited to join ${team.name} on LC Lighting Master`, 200)
      const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'LC Lighting Master', email: senderEmail },
          to: [{ email }],
          subject: sanitizedSubject,
          htmlContent: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
<h2 style="color:#2F4A3F;margin:0 0 16px">You're invited!</h2>
<p style="color:#3D5C50;line-height:1.6;margin:0 0 12px">You've been invited to join <strong>${sanitizedTeamName}</strong> on <strong>LC · Lighting Master</strong>.</p>
<a href="${joinUrl}" style="display:inline-block;background:#C65A3A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-bottom:24px">Accept Invitation →</a>
<p style="color:#7A9688;font-size:12px;word-break:break-all;margin:0">Or copy: ${joinUrl}</p>
</div>`,
        }),
      })
      if (!emailRes.ok) console.error('[admin/team/invite] Brevo error:', await emailRes.text())
    }

    return NextResponse.json({ ok: true, inviteId: invite.id })
  } catch (err) {
    console.error('[admin/team/invite] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
