import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    let body
    try { body = await req.json() } catch { body = {} }
    const { token } = body
    if (!token) return new Response('Missing token', { status: 400 })

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('team_invites')
      .select('id, team_id, email, status, expires_at')
      .eq('id', token)
      .maybeSingle()

    if (!invite) return new Response('Invite not found', { status: 404 })
    if (invite.status !== 'pending') return new Response('Invite already used or cancelled', { status: 409 })
    if (new Date(invite.expires_at) < new Date()) return new Response('Invite expired', { status: 410 })

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return new Response(
        `This invite was sent to ${invite.email}. Please sign in with that email address.`,
        { status: 403 }
      )
    }

    const { data: existingMember } = await admin
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) return new Response('Already a team member', { status: 409 })

    const { error: memberErr } = await admin
      .from('team_members')
      .insert({ team_id: invite.team_id, user_id: user.id, role: 'team_member' })

    if (memberErr) {
      console.error('[team/accept] insert error:', memberErr)
      return new Response('Could not join team', { status: 500 })
    }

    await admin
      .from('subscriptions')
      .upsert(
        { user_id: user.id, plan: 'team_member', status: 'active' },
        { onConflict: 'user_id' }
      )

    await admin
      .from('team_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    return NextResponse.json({ ok: true, teamId: invite.team_id })
  } catch (err) {
    console.error('[team/accept] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
