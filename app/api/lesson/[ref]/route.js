import { LC_DATA, LC_VISUALS } from '@/lib/content/lesson-data'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Module 1 lessons are free; all others require a paid plan
function isRefLocked(lessonRef, plan, status) {
  if (status === 'refunded' || status === 'disputed') return true
  if (plan === 't2' || plan === 't3') return false
  if (plan === 't1') return true
  const moduleNum = parseInt((lessonRef || '').split('.')[0])
  return moduleNum !== 1
}

export async function GET(request, { params }) {
  const { ref } = await params

  // Validate ref format (e.g. "1.1", "12.6")
  if (!ref || !/^\d{1,2}\.\d{1,2}$/.test(ref)) {
    return new Response(JSON.stringify({ error: 'Invalid lesson ref' }), { status: 400 })
  }

  // Auth — get the current Supabase user from session cookie
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Load subscription from service role (bypasses RLS)
  const service = createServiceClient()
  const { data: sub } = await service
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan || 'free'
  const status = sub?.status || 'free'

  if (isRefLocked(ref, plan, status)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 })
  }

  const content = LC_DATA[ref]
  const visual = LC_VISUALS[ref] || null

  if (!content) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  return Response.json({
    body:   content.body   || [],
    lp:     content.lp     || [],
    tts:    content.tts    || '',
    visual,
  })
}
