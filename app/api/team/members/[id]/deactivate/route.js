import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerMembership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (!callerMembership || callerMembership.role !== 'team_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Verify target member belongs to same team and is not the caller
    const { data: target } = await adminClient
      .from('team_members')
      .select('id, user_id, status, team_id, role')
      .eq('id', params.id)
      .eq('team_id', callerMembership.team_id)
      .single()

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.user_id === user.id) return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
    if (target.status === 'deactivated') return NextResponse.json({ error: 'Already deactivated' }, { status: 400 })

    const { error } = await adminClient
      .from('team_members')
      .update({
        status: 'deactivated',
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) throw error

    console.log(`[team/deactivate] member ${params.id} deactivated by ${user.id}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[team/members/[id]/deactivate]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
