import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { escapeHtml } from '@/lib/html-escape'
import { sanitizeEmailHeaderField } from '@/lib/email-validation'
import { createRateLimiter, getRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const teamInviteLimiter = createRateLimiter(3600000, 10) // 10 invites per hour per team

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    let body
    try { body = await req.json() } catch { body = {} }
    const { email } = body
    if (!email || !EMAIL_REGEX.test(email)) return new Response('Invalid email', { status: 400 })

    const admin = createAdminClient()

    const { data: membership } = await admin
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || membership.role !== 'team_admin') {
      return new Response('Forbidden', { status: 403 })
    }

    const teamId = membership.team_id

    // Rate limiting: 10 invites per hour per team
    const rateLimitInfo = teamInviteLimiter(teamId)
    if (!rateLimitInfo.allowed) {
      return new Response(JSON.stringify({ error: 'Too many invites sent. Try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitInfo, 10),
        },
      })
    }

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
      return new Response('No seats available', { status: 409 })
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
      console.error('[team/invite] insert error:', insertErr)
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
<p style="color:#3D5C50;line-height:1.6;margin:0 0 12px">You've been invited to join <strong>${sanitizedTeamName}</strong> on <strong>LC · Lighting Master</strong> — the professional lighting certification course.</p>
<p style="color:#3D5C50;line-height:1.6;margin:0 0 24px">Click below to accept your invitation and create your account (or log in if you already have one).</p>
<a href="${joinUrl}" style="display:inline-block;background:#C65A3A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-bottom:24px">Accept Invitation →</a>
<p style="color:#7A9688;font-size:13px;margin:0 0 8px">This invitation expires in 7 days. If you didn't expect this, you can ignore it.</p>
<p style="color:#7A9688;font-size:12px;word-break:break-all;margin:0">Or copy this link: ${joinUrl}</p>
</div>`,
        }),
      })
      if (!emailRes.ok) {
        console.error('[team/invite] Brevo error:', await emailRes.text())
      }
    }

    return NextResponse.json({ ok: true, inviteId: invite.id })
  } catch (err) {
    console.error('[team/invite] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
