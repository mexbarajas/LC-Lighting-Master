import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'admin@luxartmedia.com'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 })
  }

  const service = createServiceClient()

  const [
    { data: subscriptions, error: e1 },
    { data: progress,      error: e2 },
    { count: communityQuestions },
    { count: feedbackCount },
  ] = await Promise.all([
    service.from('subscriptions').select('*'),
    service.from('progress').select('*'),
    service.from('community_questions').select('*', { count: 'exact', head: true }),
    service.from('feedback').select('*', { count: 'exact', head: true }),
  ])

  if (e1 || e2) {
    console.error('Admin data API error:', e1 || e2)
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 })
  }

  const admin = createAdminClient()
  const { data: teams } = await admin
    .from('teams')
    .select('id, owner_id, tier, seat_count, access_expiry, created_at')
    .order('created_at', { ascending: false })
  const { data: tmembers } = await admin
    .from('team_members')
    .select('team_id, user_id, role, display_name, email')
  const { data: tinvites } = await admin
    .from('team_invites')
    .select('team_id, email, status')
    .eq('status', 'pending')

  const teamsWithMembers = (teams || []).map(t => {
    const members = (tmembers || []).filter(m => m.team_id === t.id)
    const pending = (tinvites || []).filter(i => i.team_id === t.id)
    return {
      ...t,
      members,
      pendingCount: pending.length,
      seatsUsed: members.length + pending.length,
    }
  })

  return Response.json({
    subscriptions:      subscriptions      || [],
    progress:           progress           || [],
    communityQuestions: communityQuestions || 0,
    feedbackCount:      feedbackCount      || 0,
    teams:              teamsWithMembers,
  })
}
