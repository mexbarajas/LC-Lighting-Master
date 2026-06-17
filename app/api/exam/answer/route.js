import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { sessionId, qid, answer, timeMs } = body

    console.log('[answer] incoming:', {
      sessionId,
      qid,
      answer: typeof answer === 'string' ? answer.slice(0, 20) : answer,
      timeMs,
    })

    if (!sessionId || !qid) {
      return NextResponse.json({ error: 'Missing sessionId or qid' }, { status: 400 })
    }

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: examSession, error: sessionErr } = await SERVICE
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionErr || !examSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (examSession.status === 'completed') {
      console.log('[answer] session already completed:', sessionId)
      return NextResponse.json({
        error: 'Session already completed',
        sessionId,
        status: examSession.status,
      }, { status: 400 })
    }

    const idx         = examSession.current_idx
    const questionIds = examSession.question_ids
    if (idx >= questionIds.length) {
      return NextResponse.json({ error: 'Session already complete' }, { status: 400 })
    }
    if (questionIds[idx] !== qid) {
      console.log('[answer] question mismatch:', {
        expected: questionIds[idx],
        received: qid,
        currentIdx: idx,
      })
      return NextResponse.json({
        error: 'Question mismatch',
        expected: questionIds[idx],
        received: qid,
      }, { status: 400 })
    }

    const { data: qArr, error: qErr } = await SERVICE
      .rpc('get_question_answer', { p_id: qid })

    console.log('[answer] question fetch:', { qid, found: qArr?.length, error: qErr?.message })

    const questionRow = qArr?.[0]
    if (!questionRow) {
      return NextResponse.json({ error: 'Question not found: ' + qid }, { status: 404 })
    }

    const isCorrect  = answer === questionRow.correct
    const elapsed    = typeof timeMs === 'number' ? timeMs : 30000
    const speedBonus = isCorrect && elapsed < 30000
      ? Math.round(Math.max(0, (30000 - elapsed) / 30000) * 250)
      : 0

    const updatedAnswers = {
      ...(examSession.answers || {}),
      [qid]: { answer, correct: isCorrect, timeMs: elapsed, speedBonus },
    }

    const nextIdx = idx + 1
    const isLast  = nextIdx >= questionIds.length

    const topic     = questionRow.topic
    const breakdown = { ...(examSession.topic_breakdown || {}) }
    if (!breakdown[topic]) breakdown[topic] = { correct: 0, total: 0 }
    breakdown[topic].total++
    if (isCorrect) breakdown[topic].correct++

    let finalScore   = null
    let correctCount = null
    if (isLast) {
      correctCount = Object.values(updatedAnswers).filter(a => a.correct).length
      finalScore   = Math.round((correctCount / questionIds.length) * 100)
    }

    const { error: updateErr } = await SERVICE
      .from('exam_sessions')
      .update({
        answers:         updatedAnswers,
        current_idx:     nextIdx,
        topic_breakdown: breakdown,
        status:          isLast ? 'completed' : 'active',
        completed_at:    isLast ? new Date().toISOString() : null,
        correct_count:   isLast ? correctCount : null,
        score:           isLast ? finalScore : null,
      })
      .eq('id', sessionId)

    if (updateErr) {
      console.error('[exam/answer] update error:', updateErr)
    }

    let nextQuestion = null
    if (!isLast) {
      const nextQId = questionIds[nextIdx]
      const { data: nextQArr, error: nextErr } = await SERVICE
        .rpc('get_question_by_id', { p_id: nextQId })
      const nextQ = nextQArr?.[0]
      if (!nextQ) {
        console.error('[answer] next question not found:', nextQId, nextErr?.message)
      }

      if (nextQ) {
        nextQuestion = {
          qid:     nextQ.id,
          topic:   nextQ.topic,
          prompt:  nextQ.prompt,
          choices: typeof nextQ.choices === 'string'
            ? JSON.parse(nextQ.choices)
            : nextQ.choices,
        }
      }
    }

    return NextResponse.json({
      correct:        isCorrect,
      correctAnswer:  questionRow.correct,
      explanation:    questionRow.explanation,
      speedBonus,
      nextQuestion,
      nextIdx:        isLast ? null : nextIdx,
      isLast,
      finalScore:     isLast ? finalScore : null,
      correctCount:   isLast ? correctCount : null,
      totalCount:     questionIds.length,
      topicBreakdown: isLast ? breakdown : null,
    })

  } catch (err) {
    console.error('[exam/answer] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
