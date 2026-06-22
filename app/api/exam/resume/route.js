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

    // Find most recent active session
    const { data: examSession } = await SERVICE
      .from('exam_sessions')
      .select('id, user_id, status, mode, question_ids, answers, current_idx, started_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (!examSession) {
      return NextResponse.json({ resumable: false })
    }

    // Check 7-day expiry
    const startedAt = new Date(examSession.started_at).getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - startedAt > sevenDays) {
      await SERVICE
        .from('exam_sessions')
        .update({ status: 'abandoned' })
        .eq('id', examSession.id)
      return NextResponse.json({ resumable: false, expired: true })
    }

    // Re-fetch the exact questions in the stored order
    const questionIds = examSession.question_ids || []
    const questions = []
    for (const dbId of questionIds) {
      const { data: qArr } = await SERVICE.rpc('get_question_by_id', { p_id: Number(dbId) })
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
      return NextResponse.json({ resumable: false })
    }

    const answeredCount = Object.keys(examSession.answers || {}).length

    return NextResponse.json({
      resumable:    true,
      sessionId:    examSession.id,
      mode:         examSession.mode,
      questions,
      answers:      examSession.answers || {},
      currentIdx:   examSession.current_idx || 0,
      answeredCount,
      totalCount:   questions.length,
    })

  } catch (err) {
    console.error('[exam/resume] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
