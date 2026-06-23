import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'team_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: members, error } = await supabase
      .rpc('team_member_progress', { p_team_id: membership.team_id })

    if (error) throw error

    return NextResponse.json({ members: members ?? [] })
  } catch (err) {
    console.error('[team/members]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
