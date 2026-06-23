import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller is team_admin of the same team as the target member
    const { data: callerMembership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (!callerMembership || callerMembership.role !== 'team_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Verify the target member belongs to the same team
    const { data: targetMember } = await adminClient
      .from('team_members')
      .select('user_id, email, display_name, team_id, license_type, has_exam_access, status')
      .eq('id', params.id)
      .eq('team_id', callerMembership.team_id)
      .single()

    if (!targetMember) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Fetch exam sessions
    const { data: sessions } = await adminClient
      .from('exam_sessions')
      .select('id, score, correct_count, questions_attempted, mode, status, started_at, completed_at, topic_breakdown, speed_bonus')
      .eq('user_id', targetMember.user_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20)

    // Fetch lesson progress
    const { data: progress } = await adminClient
      .from('progress')
      .select('lesson_ref, completed_at')
      .eq('user_id', targetMember.user_id)
      .order('completed_at', { ascending: false })

    return NextResponse.json({
      member: targetMember,
      exam_sessions: sessions ?? [],
      progress: progress ?? [],
    })
  } catch (err) {
    console.error('[team/members/[id]/scores]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
