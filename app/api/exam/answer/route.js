import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { EXAM_BY_ID } from '@/lib/exam-data'
import { verifySession, signSession } from '@/lib/exam-session'

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
  const { sessionToken, questionId, answer } = body
  if (!sessionToken || !questionId) {
    return Response.json({ error: 'Missing sessionToken or questionId' }, { status: 400 })
  }

  // Verify HMAC token — ensures question order hasn't been tampered with
  const payload = verifySession(sessionToken)
  if (!payload) return Response.json({ error: 'Invalid or expired session' }, { status: 401 })
  if (payload.uid !== user.id) return Response.json({ error: 'Session mismatch' }, { status: 403 })

  const { ids, idx, correctCount } = payload
  if (idx >= ids.length) return Response.json({ error: 'Session already complete' }, { status: 400 })
  if (questionId !== ids[idx]) return Response.json({ error: 'Question mismatch' }, { status: 400 })

  const q = EXAM_BY_ID[questionId]
  if (!q) return Response.json({ error: 'Question not found' }, { status: 404 })

  const isCorrect = answer === q.correct
  const newIdx = idx + 1
  const newCorrectCount = correctCount + (isCorrect ? 1 : 0)
  const isComplete = newIdx >= ids.length

  // Issue next token with incremented position
  let nextToken = null
  let nextQuestion = null
  if (!isComplete) {
    const nq = EXAM_BY_ID[ids[newIdx]]
    nextQuestion = { id: nq.id, topic: nq.topic, prompt: nq.prompt, choices: nq.choices }
    nextToken = signSession({
      uid: user.id,
      ids,
      idx: newIdx,
      correctCount: newCorrectCount,
      exp: Date.now() + 4 * 60 * 60 * 1000,
    })
  }

  // Save completed session to exam_sessions for CertPage
  if (isComplete) {
    const supabase = createServiceClient()
    const { score: clientScore, topicBreakdown } = body
    await supabase.from('exam_sessions').insert({
      user_id:             user.id,
      score:               clientScore || 0,
      questions_attempted: ids.length,
      correct_count:       newCorrectCount,
      topic_breakdown:     topicBreakdown || {},
    })
  }

  return Response.json({
    correct:       isCorrect,
    correctAnswer: q.correct,
    explanation:   q.explanation,
    nextQuestion,
    sessionToken:  nextToken,
  })
}
