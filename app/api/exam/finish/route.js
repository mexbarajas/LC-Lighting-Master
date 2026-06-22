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
      .select('id, user_id, status, questions_attempted')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const total = examSession.questions_attempted
    let correctCount = 0
    let totalSpeedBonus = 0
    const topicBreakdown = {}

    // Re-verify each answer server-side
    const { data: allIds } = await SERVICE.rpc('get_question_ids')
    for (const [qid, a] of Object.entries(answers)) {
      const match = allIds?.find(q => q.qid === qid)
      if (!match) continue
      const { data: ansArr } = await SERVICE
        .rpc('get_question_answer', { p_id: Number(match.id) })
      const row = ansArr?.[0]
      if (!row) continue
      const isCorrect = a.answer === row.correct
      if (isCorrect) correctCount++
      totalSpeedBonus += (a.speedBonus || 0)
      const topic = row.topic
      if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 }
      topicBreakdown[topic].total++
      if (isCorrect) topicBreakdown[topic].correct++
    }

    const finalScore = Math.round((correctCount / total) * 100)

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
