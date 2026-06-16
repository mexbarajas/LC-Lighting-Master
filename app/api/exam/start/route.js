import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { EXAM_QUESTIONS } from '@/lib/exam-data'
import { signSession } from '@/lib/exam-session'

function examAccess(plan, examAddon) {
  return plan === 't1' || plan === 't3' || (plan === 't2' && !!examAddon)
}

export async function POST(request) {
  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, exam_addon')
    .eq('user_id', user.id)
    .single()

  if (!examAccess(sub?.plan, sub?.exam_addon)) {
    return Response.json({ error: 'Exam access required' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch { body = {} }
  const count = Math.max(1, Math.min(200, parseInt(body.count) || 20))

  // Shuffle server-side and slice — correct answers never leave the server
  const shuffled = [...EXAM_QUESTIONS].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, EXAM_QUESTIONS.length))
  const ids = selected.map(q => q.id)

  // Sign a session token — carries question ordering + position, tamper-proof
  const token = signSession({
    uid: user.id,
    ids,
    idx: 0,
    correctCount: 0,
    exp: Date.now() + 4 * 60 * 60 * 1000,  // 4-hour window
  })

  const first = selected[0]
  return Response.json({
    sessionToken: token,
    total: ids.length,
    question: { id: first.id, topic: first.topic, prompt: first.prompt, choices: first.choices },
  })
}
