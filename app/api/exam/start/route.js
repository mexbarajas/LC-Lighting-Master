import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MODE_COUNTS = { quick: 20, mid: 50, full: 180 }

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

    // Subscription check
    const { data: sub } = await SERVICE
      .from('subscriptions')
      .select('plan, status, exam_addon')
      .eq('user_id', userId)
      .single()

    const hasPlan  = sub && ['t2', 't3'].includes(sub.plan) && sub.status === 'active'
    const hasAddon = sub && sub.exam_addon === true && sub.status === 'active'
    if (!hasPlan && !hasAddon) {
      return NextResponse.json({ error: 'Exam access required' }, { status: 403 })
    }

    // Max attempts check
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
    const mode  = ['quick', 'mid', 'full'].includes(body.mode) ? body.mode : 'full'
    const count = MODE_COUNTS[mode]

    // Get all question IDs
    const { data: allQs, error: qErr } = await SERVICE
      .rpc('get_question_ids')

    if (qErr || !allQs?.length) {
      return NextResponse.json({ error: 'Questions unavailable' }, { status: 500 })
    }

    // Fisher-Yates shuffle
    const shuffled = [...allQs]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected    = shuffled.slice(0, Math.min(count, shuffled.length))
    const questionIds = selected.map(q => Number(q.id))

    if (questionIds.some(id => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ error: 'Invalid question IDs' }, { status: 500 })
    }

    // Delete any existing active sessions to prevent stale state
    await SERVICE
      .from('exam_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'active')

    // Create session
    const { data: newSession, error: sessErr } = await SERVICE
      .from('exam_sessions')
      .insert({
        user_id:             userId,
        mode,
        question_ids:        questionIds,
        answers:             {},
        current_idx:         0,
        started_at:          new Date().toISOString(),
        status:              'active',
        questions_attempted: count,
      })
      .select('id, question_ids')
      .single()

    if (sessErr || !newSession) {
      return NextResponse.json(
        { error: 'Failed to create session: ' + sessErr?.message },
        { status: 500 }
      )
    }

    const storedIds = newSession.question_ids
    if (!storedIds?.[0]) {
      return NextResponse.json({ error: 'Session storage failed' }, { status: 500 })
    }

    // Fetch first question using the verified stored ID
    const firstId = Number(storedIds[0])
    const { data: firstQArr } = await SERVICE
      .rpc('get_question_by_id', { p_id: firstId })

    const firstQ = firstQArr?.[0]
    if (!firstQ) {
      return NextResponse.json({ error: 'Could not load first question' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId:    newSession.id,
      mode,
      totalCount:   count,
      idx:          0,
      attemptsUsed: completedCount || 0,
      question: {
        qid:     firstQ.qid,
        topic:   firstQ.topic,
        prompt:  firstQ.prompt,
        choices: firstQ.choices,
      },
    })

  } catch (err) {
    console.error('[exam/start] error:', err)
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 })
  }
}
