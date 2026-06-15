import { createServiceClient } from '@/lib/supabase/service'
import { verifyAdminToken, parseCookie } from '@/lib/admin-auth'

export async function GET(request) {
  const token = parseCookie(request.headers.get('cookie'), 'admin_session')
  if (!verifyAdminToken(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServiceClient()

  const [
    { data: subscriptions, error: e1 },
    { data: progress,      error: e2 },
    { count: communityQuestions },
    { count: feedbackCount },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*'),
    supabase.from('progress').select('*'),
    supabase.from('community_questions').select('*', { count: 'exact', head: true }),
    supabase.from('feedback').select('*', { count: 'exact', head: true }),
  ])

  if (e1 || e2) {
    console.error('Admin data API error:', e1 || e2)
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 })
  }

  return Response.json({
    subscriptions:       subscriptions       || [],
    progress:            progress            || [],
    communityQuestions:  communityQuestions  || 0,
    feedbackCount:       feedbackCount       || 0,
  })
}
