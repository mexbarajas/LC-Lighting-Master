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

    const body = await req.json()
    const { sessionId, answers, currentIdx } = body
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    // Verify ownership, only update if still active
    const { data: examSession } = await SERVICE
      .from('exam_sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (examSession.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    await SERVICE
      .from('exam_sessions')
      .update({
        answers:     answers || {},
        current_idx: currentIdx || 0,
      })
      .eq('id', sessionId)

    return NextResponse.json({ saved: true })

  } catch (err) {
    console.error('[exam/save] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
