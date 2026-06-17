import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MODE_COUNTS = { quick: 20, mid: 50, full: 180 }

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: sub } = await SERVICE
      .from('subscriptions')
      .select('plan, status, exam_addon')
      .eq('user_id', userId)
      .single()

    const hasPlan    = sub && ['t2','t3'].includes(sub.plan) && sub.status === 'active'
    const hasAddon   = sub && sub.exam_addon === true && sub.status === 'active'
    const hasT1Addon = sub && sub.plan === 't1' && sub.exam_addon === true && sub.status === 'active'
    if (!hasPlan && !hasAddon && !hasT1Addon) {
      return NextResponse.json({ error: 'Exam access required' }, { status: 403 })
    }

    const { count: completedCount } = await SERVICE
      .from('exam_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if ((completedCount || 0) >= 5) {
      return NextResponse.json({ error: 'MAX_ATTEMPTS', attempts: completedCount }, { status: 403 })
    }

    let body
    try { body = await req.json() } catch { body = {} }
    const mode  = ['quick','mid','full'].includes(body.mode) ? body.mode : 'full'
    const count = MODE_COUNTS[mode]

    const { data: allQs, error: qErr } = await SERVICE
      .rpc('get_question_ids')

    console.log('[start] sample IDs from DB:',
      allQs?.slice(0, 3).map(q => ({ id: q.id, type: typeof q.id })))

    if (qErr) {
      return NextResponse.json({ error: 'DB error: ' + qErr.message }, { status: 500 })
    }
    if (!allQs || allQs.length === 0) {
      return NextResponse.json({ error: 'Questions unavailable' }, { status: 500 })
    }

    // Fisher-Yates shuffle — correct answers never leave the server until answer submitted
    const shuffled = [...allQs]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected    = shuffled.slice(0, Math.min(count, shuffled.length))
    const questionIds = selected.map(q => Number(q.id))
    console.log('[start] questionIds:', questionIds.slice(0, 5))

    if (questionIds.some(id => !id || isNaN(id))) {
      console.error('[start] Invalid question IDs:', questionIds.slice(0, 5))
      return NextResponse.json({ error: 'Invalid question data' }, { status: 500 })
    }

    const { data: session_row, error: sessionErr } = await SERVICE
      .from('exam_sessions')
      .insert({
        user_id:             userId,
        mode,
        question_ids:        JSON.parse(JSON.stringify(questionIds)),
        answers:             {},
        current_idx:         0,
        started_at:          new Date().toISOString(),
        status:              'active',
        questions_attempted: questionIds.length,
      })
      .select('id')
      .single()

    if (sessionErr) {
      console.error('[start] session insert error:', sessionErr)
      return NextResponse.json(
        { error: 'Failed to create session: ' + sessionErr.message },
        { status: 500 }
      )
    }
    console.log('[start] session created:', session_row.id)

    // Verify question_ids stored correctly
    const { data: verify } = await SERVICE
      .from('exam_sessions')
      .select('question_ids')
      .eq('id', session_row.id)
      .single()
    console.log('[start] stored question_ids sample:', verify?.question_ids?.slice(0, 3))

    const { data: firstQArr, error: firstQErr } = await SERVICE
      .rpc('get_question_by_id', { p_id: parseInt(questionIds[0], 10) })
    const firstQ = firstQArr?.[0]

    if (firstQErr || !firstQ) {
      return NextResponse.json({ error: 'Failed to load first question' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId:    session_row.id,
      mode,
      totalCount:   questionIds.length,
      idx:          0,
      attemptsUsed: completedCount || 0,
      question: {
        qid:     firstQ.id,
        topic:   firstQ.topic,
        prompt:  firstQ.prompt,
        choices: typeof firstQ.choices === 'string'
          ? JSON.parse(firstQ.choices)
          : firstQ.choices,
      },
    })

  } catch (err) {
    console.error('[exam/start] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
