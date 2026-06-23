import { createServiceClient } from '@/lib/supabase/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createRateLimiter, getRateLimitHeaders } from '@/lib/rate-limit'

const ADMIN_EMAIL = 'admin@luxartmedia.com'
const adminDataLimiter = createRateLimiter(60000, 10)

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
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
    service.from('progress').select('user_id,lesson_ref,completed_at'),
    service.from('community_questions').select('*', { count: 'exact', head: true }),
    service.from('feedback').select('*', { count: 'exact', head: true }),
  ])

  if (e1 || e2) {
    console.error('Admin data API error:', e1 || e2)
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 })
  }

  const adminClient = createAdminClient()

  // ── Team data ────────────────────────────────────────────────────────
  const { data: allTeams } = await adminClient
    .from('teams')
    .select(`
      id, owner_id, tier, seat_count, seats_purchased, plan_type,
      price_per_seat, total_team_price, access_expiry, stripe_ref, created_at,
      team_members (
        id, user_id, email, display_name, role, status, license_type,
        has_exam_access, exam_access_source, member_exam_add_on_paid,
        joined_at, deactivated_at
      ),
      team_invites (
        id, email, status, invited_at, expires_at
      )
    `)
    .order('created_at', { ascending: false })

  return Response.json({
    subscriptions:      subscriptions      || [],
    progress:           progress           || [],
    communityQuestions: communityQuestions || 0,
    feedbackCount:      feedbackCount      || 0,
    teams:              allTeams ?? [],
  })
}
