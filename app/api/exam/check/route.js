import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const { qid, answer } = body
    if (!qid) return NextResponse.json({ error: 'Missing qid' }, { status: 400 })

    // Look up correct answer by qid
    const { data: allIds } = await SERVICE.rpc('get_question_ids')
    const match = allIds?.find(q => q.qid === qid)
    if (!match) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

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
    console.error('[exam/check] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
