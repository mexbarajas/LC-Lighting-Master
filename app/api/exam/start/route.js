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

    // Max attempts
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
    const { data: allIds, error: idErr } = await SERVICE.rpc('get_question_ids')
    if (idErr || !allIds?.length) {
      return NextResponse.json({ error: 'Questions unavailable' }, { status: 500 })
    }

    // Fisher-Yates shuffle
    const shuffled = [...allIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected    = shuffled.slice(0, Math.min(count, shuffled.length))
    const questionIds = selected.map(q => Number(q.id))

    // Fetch ALL selected questions (no correct answers)
    const questions = []
    for (const dbId of questionIds) {
      const { data: qArr } = await SERVICE.rpc('get_question_by_id', { p_id: dbId })
      const raw = qArr?.[0]
      if (raw) {
        questions.push({
          qid:     raw.qid,
          topic:   raw.topic,
          prompt:  raw.prompt,
          choices: raw.choices,
        })
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Could not load questions' }, { status: 500 })
    }

    const orderedQids = questions.map(q => q.qid)

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
        questions_attempted: questions.length,
      })
      .select('id')
      .single()

    if (sessErr || !newSession) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId:    newSession.id,
      mode,
      attemptsUsed: completedCount || 0,
      questions,
      orderedQids,
    })

  } catch (err) {
    console.error('[exam/start] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
