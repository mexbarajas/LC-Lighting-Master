import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminSession } from '@/lib/admin-middleware'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const auth = validateAdminSession(req)
    if (!auth.valid) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body
    try { body = await req.json() } catch { body = {} }
    const { teamId, memberUserId, inviteId } = body
    if (!teamId) return new Response('Missing teamId', { status: 400 })

    const admin = createAdminClient()

    if (inviteId) {
      const { error } = await admin
        .from('team_invites')
        .delete()
        .eq('id', inviteId)
        .eq('team_id', teamId)
      if (error) {
        console.error('[admin/team/revoke] invite delete error:', error)
        return new Response('Could not cancel invite', { status: 500 })
      }
    } else if (memberUserId) {
      const { error: memberErr } = await admin
        .from('team_members')
        .delete()
        .eq('user_id', memberUserId)
        .eq('team_id', teamId)
      if (memberErr) {
        console.error('[admin/team/revoke] member delete error:', memberErr)
        return new Response('Could not remove member', { status: 500 })
      }
      await admin
        .from('subscriptions')
        .update({ plan: 'free' })
        .eq('user_id', memberUserId)
    } else {
      return new Response('Missing memberUserId or inviteId', { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/team/revoke] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
