import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createRateLimiter, getRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

const examFinishLimiter = createRateLimiter(3600000, 5) // 5 finishes per hour per user

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    // Rate limiting: 5 exam finishes per hour per user
    const rateLimitInfo = examFinishLimiter(userId)
    if (!rateLimitInfo.allowed) {
      return NextResponse.json({ error: 'Too many exam submissions. Try again later.' }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitInfo, 5),
      })
    }

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const { sessionId, answers } = body
    // answers = { qid: { answer, correct, timeMs, speedBonus } }

    if (!sessionId || !answers) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Verify session ownership
    const { data: examSession } = await SERVICE
      .from('exam_sessions')
      .select('id, user_id, status, questions_attempted, question_ids, score, correct_count, speed_bonus, topic_breakdown')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Already scored: return the saved result instead of re-scoring. Keeps a
    // retried request (e.g. after a network blip) working, and stops a
    // finished session being replayed with different answers.
    if (examSession.status === 'completed') {
      return NextResponse.json({
        finalScore:     examSession.score,
        correctCount:   examSession.correct_count,
        total:          examSession.questions_attempted,
        speedBonus:     examSession.speed_bonus,
        topicBreakdown: examSession.topic_breakdown,
      })
    }

    if (typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
    }

    const total = examSession.questions_attempted
    // Only questions that belong to this session can be scored.
    const sessionDbIds = Array.isArray(examSession.question_ids)
      ? new Set(examSession.question_ids.map(Number))
      : null
    const MAX_SPEED_BONUS_PER_QUESTION = 250 // matches the client formula
    let correctCount = 0
    let totalSpeedBonus = 0
    const topicBreakdown = {}

    // Re-verify each answer server-side
    const { data: allIds } = await SERVICE.rpc('get_question_ids')
    for (const [qid, a] of Object.entries(answers)) {
      const match = allIds?.find(q => q.qid === qid)
      if (!match) continue
      if (sessionDbIds && sessionDbIds.size > 0 && !sessionDbIds.has(Number(match.id))) continue
      const { data: ansArr } = await SERVICE
        .rpc('get_question_answer', { p_id: Number(match.id) })
      const row = ansArr?.[0]
      if (!row) continue
      const isCorrect = a?.answer === row.correct
      if (isCorrect) {
        correctCount++
        // Client-supplied bonus is clamped to a number in [0, 250] and only
        // counts on a correct answer, as in the client formula.
        const bonus = Number(a?.speedBonus)
        if (Number.isFinite(bonus)) {
          totalSpeedBonus += Math.round(Math.min(Math.max(bonus, 0), MAX_SPEED_BONUS_PER_QUESTION))
        }
      }
      const topic = row.topic
      if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 }
      topicBreakdown[topic].total++
      if (isCorrect) topicBreakdown[topic].correct++
    }

    const finalScore = total > 0 ? Math.min(100, Math.round((correctCount / total) * 100)) : 0

    await SERVICE
      .from('exam_sessions')
      .update({
        answers,
        status:          'completed',
        completed_at:    new Date().toISOString(),
        correct_count:   correctCount,
        score:           finalScore,
        speed_bonus:     totalSpeedBonus,
        topic_breakdown: topicBreakdown,
        current_idx:     total,
      })
      .eq('id', sessionId)
      .neq('status', 'completed') // guards against a concurrent double-finish

    return NextResponse.json({
      finalScore,
      correctCount,
      total,
      speedBonus: totalSpeedBonus,
      topicBreakdown,
    })

  } catch (err) {
    console.error('[exam/finish] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
