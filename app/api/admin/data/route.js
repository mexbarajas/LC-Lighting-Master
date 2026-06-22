import { createServiceClient } from '@/lib/supabase/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAdminSession } from '@/lib/admin-middleware'
import { createRateLimiter, getRateLimitHeaders } from '@/lib/rate-limit'

const adminDataLimiter = createRateLimiter(60000, 10)

export async function GET(request) {
  const auth = validateAdminSession(request)
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown'
  const rateLimitInfo = adminDataLimiter(ip)

  if (!rateLimitInfo.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(rateLimitInfo, 10),
      },
    })
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
    .select('id, team_id, email, status')
    .eq('status', 'pending')

  const teamsWithMembers = (teams || []).map(t => {
    const members = (tmembers || []).filter(m => m.team_id === t.id)
    const pending = (tinvites || []).filter(i => i.team_id === t.id)
    return {
      ...t,
      members,
      pendingInvites: pending,
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
