import { createServiceClient } from '@/lib/supabase/service'

const ADMIN_PW = process.env.ADMIN_PASSWORD || 'Admin@2025!'

export async function GET(request) {
  if (request.headers.get('x-admin-password') !== ADMIN_PW) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createServiceClient()

  const [
    { data: subscriptions, error: e1 },
    { data: progress,      error: e2 },
    { count: communityQuestions },
    { count: feedbackCount },
  ] = await Promise.all([
    supabase.from('subscriptions').select('user_id,plan,status,email,stripe_customer_id,seats,updated_at,created_at,exam_addon'),
    supabase.from('progress').select('user_id,lesson_ref,completed_at'),
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
