import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { safeLogError } from '@/lib/safe-logging'
import { createRateLimiter, getRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

// Generous ceiling: a real student answers one question every few seconds.
const CHECK_LIMIT_PER_MIN = 90
const examCheckLimiter = createRateLimiter(60000, CHECK_LIMIT_PER_MIN)

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitInfo = examCheckLimiter(user.id)
    if (!rateLimitInfo.allowed) {
      return NextResponse.json({ error: 'Too many requests. Slow down.' }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitInfo, CHECK_LIMIT_PER_MIN),
      })
    }

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let body
    try { body = await req.json() } catch { body = null }
    const { qid, answer } = body || {}
    if (!qid || typeof qid !== 'string') return NextResponse.json({ error: 'Missing qid' }, { status: 400 })

    // Security: an answer is only revealed for a question that belongs to the
    // caller's OWN active exam session. Sessions are only created by
    // /api/exam/start, which enforces the paid-access gate, so free accounts
    // cannot enumerate the answer key and nobody can read another user's questions.
    const { data: activeSession } = await SERVICE
      .from('exam_sessions')
      .select('question_ids')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!activeSession) {
      return NextResponse.json({ error: 'No active exam session' }, { status: 403 })
    }
    const sessionDbIds = new Set((activeSession.question_ids || []).map(Number))

    // Look up correct answer by qid
    const { data: allIds } = await SERVICE.rpc('get_question_ids')
    const match = allIds?.find(q => q.qid === qid)
    if (!match) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

    if (!sessionDbIds.has(Number(match.id))) {
      return NextResponse.json({ error: 'Question not in your exam session' }, { status: 403 })
    }

    const { data: ansArr } = await SERVICE
      .rpc('get_question_answer', { p_id: Number(match.id) })
    const row = ansArr?.[0]
    if (!row) return NextResponse.json({ error: 'Answer not found' }, { status: 404 })

    const isCorrect = answer === row.correct

    return NextResponse.json({
      qid:           row.qid,
      correct:       isCorrect,
      correctAnswer: row.correct,
      explanation:   row.explanation,
      topic:         row.topic,
    })

  } catch (err) {
    safeLogError('[exam/check]', err, true)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
