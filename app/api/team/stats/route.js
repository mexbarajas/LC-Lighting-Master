import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find the team this user manages or belongs to
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a team member' }, { status: 403 })

    const { data: stats, error } = await supabase
      .rpc('team_stats', { p_team_id: membership.team_id })

    if (error) throw error

    // Also fetch pending invites list
    const { data: invites } = await supabase
      .from('team_invites')
      .select('id, email, status, invited_at, expires_at')
      .eq('team_id', membership.team_id)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false })

    return NextResponse.json({
      team_id: membership.team_id,
      role: membership.role,
      stats,
      pending_invites: invites ?? [],
    })
  } catch (err) {
    console.error('[team/stats]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
