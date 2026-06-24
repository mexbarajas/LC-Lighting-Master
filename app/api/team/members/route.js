import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function GET(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isSiteAdmin = SITE_ADMIN_EMAILS.includes(user.email)
    const url = new URL(req.url)
    const requestedTeamId = url.searchParams.get('team_id')

    let teamId = null

    if (isSiteAdmin && requestedTeamId) {
      teamId = requestedTeamId
    } else {
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!membership || (membership.role !== 'team_admin' && !isSiteAdmin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      teamId = membership.team_id
    }

    const adminClient = createAdminClient()

    // Query the member progress directly (admin client bypasses RLS/auth.uid())
    const { data: members, error } = await adminClient
      .from('team_members')
      .select('id, user_id, email, display_name, role, status, license_type, has_exam_access, exam_access_source, member_exam_add_on_paid, joined_at, deactivated_at')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    // Enrich with progress + exam stats per member
    const enriched = await Promise.all((members ?? []).map(async (m) => {
      const { count: lessonsCompleted } = await adminClient
        .from('progress').select('lesson_ref', { count: 'exact', head: true })
        .eq('user_id', m.user_id)

      const { data: examRows } = await adminClient
        .from('exam_sessions')
        .select('correct_count, completed_at, status')
        .eq('user_id', m.user_id)
        .eq('status', 'completed')

      const examAttempts = examRows?.length ?? 0
      const bestScore = examRows?.length ? Math.max(...examRows.map(e => e.correct_count ?? 0)) : null
      const lastExamAt = examRows?.length ? examRows.map(e => e.completed_at).sort().reverse()[0] : null

      return {
        member_id:               m.id,
        member_user_id:          m.user_id,
        email:                   m.email,
        display_name:            m.display_name,
        role:                    m.role,
        status:                  m.status,
        license_type:            m.license_type,
        has_exam_access:         m.has_exam_access,
        exam_access_source:      m.exam_access_source,
        member_exam_add_on_paid: m.member_exam_add_on_paid,
        joined_at:               m.joined_at,
        deactivated_at:          m.deactivated_at,
        lessons_completed:       lessonsCompleted ?? 0,
        exam_attempts:           examAttempts,
        best_score:              bestScore,
        last_exam_at:            lastExamAt,
      }
    }))

    return NextResponse.json({ members: enriched })
  } catch (err) {
    console.error('[team/members]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
