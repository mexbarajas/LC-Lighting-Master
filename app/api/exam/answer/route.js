import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('[answer] no session:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id
    console.log('[answer] userId:', userId)

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { sessionId, qid, answer, timeMs } = body
    console.log('[answer] body:', { sessionId, qid, answer: typeof answer === 'string' ? answer.slice(0, 30) : answer, timeMs })

    // Load exam session
    const { data: examSession, error: sessErr } = await SERVICE
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    console.log('[answer] examSession:', {
      found:        !!examSession,
      error:        sessErr?.message,
      status:       examSession?.status,
      current_idx:  examSession?.current_idx,
      q_ids_length: examSession?.question_ids?.length,
    })

    if (!examSession) {
      return NextResponse.json(
        { error: 'Session not found', sessErr: sessErr?.message },
        { status: 404 }
      )
    }
    if (examSession.status === 'completed') {
      console.log('[answer] session already completed:', sessionId)
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    const idx         = examSession.current_idx
    const questionIds = examSession.question_ids
    const currentQId  = parseInt(questionIds[idx], 10)
    console.log('[answer] currentQId:', currentQId, 'type:', typeof currentQId)
    console.log('[answer] idx:', idx, 'currentQId:', currentQId, 'qid sent:', qid)

    // Fetch correct answer via RPC
    const { data: qArr, error: qErr } = await SERVICE
      .rpc('get_question_answer', { p_id: currentQId })

    console.log('[answer] question fetch:', {
      currentQId,
      found:       qArr?.length,
      id_from_db:  qArr?.[0]?.id,
      error:       qErr?.message,
    })

    const questionRow = qArr?.[0]
    if (!questionRow) {
      return NextResponse.json(
        { error: 'Question not found', currentQId, qErr: qErr?.message },
        { status: 404 }
      )
    }

    // Validate client qid matches the session's current question (type-safe string comparison)
    console.log('[answer] qid check:', {
      currentQId:  currentQId,
      from_client: qid,
      match:       String(currentQId) === String(qid),
    })

    if (String(currentQId) !== String(qid)) {
      return NextResponse.json({
        error:    'Question mismatch',
        expected: currentQId,
        received: qid,
        hint:     'Client may be out of sync with server session',
      }, { status: 400 })
    }

    // Grade answer
    const isCorrect  = answer === questionRow.correct
    const elapsed    = typeof timeMs === 'number' ? timeMs : 30000
    const speedBonus = isCorrect && elapsed < 30000
      ? Math.round(Math.max(0, (30000 - elapsed) / 30000) * 250)
      : 0

    // Update answers map
    const updatedAnswers = {
      ...(examSession.answers || {}),
      [qid]: { answer, correct: isCorrect, timeMs: elapsed, speedBonus },
    }

    const nextIdx = idx + 1
    const isLast  = nextIdx >= questionIds.length

    // Topic breakdown
    const topicBreakdown = { ...(examSession.topic_breakdown || {}) }
    const topic = questionRow.topic
    if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 }
    topicBreakdown[topic].total++
    if (isCorrect) topicBreakdown[topic].correct++

    // Final score if last question
    let finalScore   = null
    let correctCount = 0
    if (isLast) {
      Object.values(updatedAnswers).forEach(a => { if (a.correct) correctCount++ })
      finalScore = Math.round((correctCount / questionIds.length) * 100)
    }

    // Update session
    const { error: updateErr } = await SERVICE
      .from('exam_sessions')
      .update({
        answers:         updatedAnswers,
        current_idx:     nextIdx,
        topic_breakdown: topicBreakdown,
        status:          isLast ? 'completed' : 'active',
        completed_at:    isLast ? new Date().toISOString() : null,
        correct_count:   isLast ? correctCount : null,
        score:           isLast ? finalScore : null,
      })
      .eq('id', sessionId)

    console.log('[answer] update result:', { error: updateErr?.message })

    // Fetch next question
    let nextQuestion = null
    if (!isLast) {
      const nextQId = parseInt(questionIds[nextIdx], 10)
      const { data: nextQArr, error: nextErr } = await SERVICE
        .rpc('get_question_by_id', { p_id: nextQId })
      const nextQ = nextQArr?.[0] || null
      console.log('[answer] next question:', { nextQId, found: !!nextQ, error: nextErr?.message })
      if (!nextQ) {
        console.error('[answer] failed to fetch next question:', nextQId, nextErr?.message)
        return NextResponse.json(
          { error: 'Failed to load next question', nextQId, detail: nextErr?.message },
          { status: 500 }
        )
      }
      nextQuestion = {
        qid:     nextQ.id,
        topic:   nextQ.topic,
        prompt:  nextQ.prompt,
        choices: typeof nextQ.choices === 'string'
          ? JSON.parse(nextQ.choices)
          : nextQ.choices,
      }
    }

    console.log('[answer] success, isCorrect:', isCorrect, 'isLast:', isLast)

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
      topicBreakdown: isLast ? topicBreakdown : null,
    })

  } catch (err) {
    console.error('[answer] uncaught error:', err.message, err.stack)
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    )
  }
}
