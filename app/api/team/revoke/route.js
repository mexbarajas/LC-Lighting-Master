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
    const { inviteId, memberUserId } = body

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

    if (inviteId) {
      const { error } = await admin
        .from('team_invites')
        .delete()
        .eq('id', inviteId)
        .eq('team_id', teamId)
      if (error) {
        console.error('[team/revoke] invite delete error:', error)
        return new Response('Could not cancel invite', { status: 500 })
      }
    } else if (memberUserId) {
      if (memberUserId === user.id) return new Response('Cannot remove yourself', { status: 400 })
      const { error } = await admin
        .from('team_members')
        .delete()
        .eq('user_id', memberUserId)
        .eq('team_id', teamId)
      if (error) {
        console.error('[team/revoke] member delete error:', error)
        return new Response('Could not remove member', { status: 500 })
      }
    } else {
      return new Response('Missing inviteId or memberUserId', { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[team/revoke] error:', err)
    return new Response('Server error', { status: 500 })
  }
}
