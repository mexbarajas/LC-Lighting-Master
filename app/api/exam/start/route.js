import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MODE_COUNTS = { quick: 20, mid: 50, full: 180 }

export async function POST(req) {
  try {
    // Auth client — uses cookies for session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Service client — created inside handler so env vars are always resolved at runtime
    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('[exam/start] env check:', {
      hasUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey:    !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12),
    })

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
      .from('exam_questions')
      .select('id')
      .order('id')

    console.log('[exam/start] questions query:', {
      count: allQs?.length,
      error: qErr?.message,
      code:  qErr?.code,
    })

    if (qErr) {
      return NextResponse.json(
        { error: 'DB error: ' + qErr.message },
        { status: 500 }
      )
    }
    if (!allQs || allQs.length === 0) {
      return NextResponse.json(
        { error: 'Questions unavailable — table empty or access denied' },
        { status: 500 }
      )
    }

    // Fisher-Yates shuffle — correct answers never leave the server until answer submitted
    const shuffled = [...allQs]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected    = shuffled.slice(0, Math.min(count, shuffled.length))
    const questionIds = selected.map(q => q.id)

    const { data: session_row, error: sessionErr } = await SERVICE
      .from('exam_sessions')
      .insert({
        user_id:             userId,
        mode,
        question_ids:        questionIds,
        answers:             {},
        current_idx:         0,
        started_at:          new Date().toISOString(),
        status:              'active',
        questions_attempted: questionIds.length,
      })
      .select('id')
      .single()

    if (sessionErr || !session_row) {
      console.error('[exam/start] session insert error:', sessionErr)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    const { data: firstQ, error: firstQErr } = await SERVICE
      .from('exam_questions')
      .select('id, topic, prompt, choices')
      .eq('id', questionIds[0])
      .single()

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
