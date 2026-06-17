import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let body
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { sessionId, answer, timeMs } = body
    // NOTE: qid from client is intentionally ignored — server uses current_idx as source of truth

    // Load session
    const { data: examSession, error: sessErr } = await SERVICE
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!examSession) {
      return NextResponse.json(
        { error: 'Session not found', detail: sessErr?.message },
        { status: 404 }
      )
    }
    if (examSession.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    const idx         = examSession.current_idx
    const questionIds = examSession.question_ids
    const currentDbId = Number(questionIds[idx])

    if (!currentDbId || isNaN(currentDbId)) {
      return NextResponse.json(
        { error: 'Invalid session state', idx, rawId: questionIds[idx] },
        { status: 500 }
      )
    }

    // Fetch correct answer from DB — server is source of truth
    const { data: qArr, error: qErr } = await SERVICE
      .rpc('get_question_answer', { p_id: currentDbId })

    if (qErr || !qArr?.length) {
      return NextResponse.json(
        { error: 'Question not found', dbId: currentDbId, detail: qErr?.message },
        { status: 500 }
      )
    }

    const questionRow = qArr[0]

    // Grade answer
    const isCorrect  = answer === questionRow.correct
    const elapsed    = typeof timeMs === 'number' ? timeMs : 30000
    const speedBonus = isCorrect && elapsed < 30000
      ? Math.round(Math.max(0, (30000 - elapsed) / 30000) * 250)
      : 0

    // Use the server-known qid as the answer map key
    const serverQid = questionRow.qid
    const updatedAnswers = {
      ...(examSession.answers || {}),
      [serverQid]: { answer, correct: isCorrect, timeMs: elapsed, speedBonus },
    }

    const nextIdx = idx + 1
    const isLast  = nextIdx >= questionIds.length

    // Topic breakdown
    const topicBreakdown = { ...(examSession.topic_breakdown || {}) }
    const topic = questionRow.topic
    if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 }
    topicBreakdown[topic].total++
    if (isCorrect) topicBreakdown[topic].correct++

    // Final score
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

    if (updateErr) {
      console.error('[exam/answer] update error:', updateErr)
    }

    // Fetch next question
    let nextQuestion = null
    if (!isLast) {
      const nextDbId = Number(questionIds[nextIdx])
      const { data: nextQArr } = await SERVICE
        .rpc('get_question_by_id', { p_id: nextDbId })
      nextQuestion = nextQArr?.[0] || null
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
      topicBreakdown: isLast ? topicBreakdown : null,
    })

  } catch (err) {
    console.error('[exam/answer] error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}
