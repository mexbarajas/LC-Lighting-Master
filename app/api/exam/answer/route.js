import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request) {
  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { sessionId, questionId, answer } = body
  if (!sessionId || !questionId) {
    return Response.json({ error: 'Missing sessionId or questionId' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: sess, error: sessError } = await supabase
    .from('exam_sessions')
    .select('id, question_ids, current_idx, answers_log')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (sessError || !sess) {
    return Response.json({ error: 'Session not found or already completed' }, { status: 404 })
  }

  const expectedId = sess.question_ids?.[sess.current_idx]
  if (questionId !== expectedId) {
    return Response.json({ error: 'Question mismatch' }, { status: 400 })
  }

  const { data: q, error: qError } = await supabase
    .from('exam_questions')
    .select('correct, explanation, topic')
    .eq('id', questionId)
    .single()

  if (qError || !q) {
    return Response.json({ error: 'Question not found' }, { status: 404 })
  }

  const isCorrect = answer === q.correct
  const newIdx = sess.current_idx + 1
  const answersLog = [...(sess.answers_log || []), {
    questionId, answer, correct: isCorrect, topic: q.topic,
  }]
  const correctCount = answersLog.filter(a => a.correct).length
  const isComplete = newIdx >= sess.question_ids.length

  const topicBreakdown = answersLog.reduce((acc, a) => {
    if (!acc[a.topic]) acc[a.topic] = { correct: 0, total: 0 }
    acc[a.topic].total++
    if (a.correct) acc[a.topic].correct++
    return acc
  }, {})

  let nextQuestion = null
  if (!isComplete) {
    const nextId = sess.question_ids[newIdx]
    const { data: nq } = await supabase
      .from('exam_questions')
      .select('id, topic, prompt, choices')
      .eq('id', nextId)
      .single()
    nextQuestion = nq || null
  }

  await supabase.from('exam_sessions').update({
    current_idx:     newIdx,
    answers_log:     answersLog,
    correct_count:   correctCount,
    topic_breakdown: topicBreakdown,
    status:          isComplete ? 'completed' : 'active',
  }).eq('id', sess.id)

  return Response.json({
    correct:       isCorrect,
    correctAnswer: q.correct,
    explanation:   q.explanation,
    nextQuestion,
  })
}
