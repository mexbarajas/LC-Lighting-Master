import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

  return Response.json({
    subscriptions:      subscriptions      || [],
    progress:           progress           || [],
    communityQuestions: communityQuestions || 0,
    feedbackCount:      feedbackCount      || 0,
  })
}
