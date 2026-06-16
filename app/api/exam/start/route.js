// Run this SQL in Supabase SQL Editor before deploying:
//
// 1. Create exam_questions table (no public SELECT — service role only):
// CREATE TABLE public.exam_questions (
//   id text PRIMARY KEY,
//   topic text NOT NULL,
//   prompt text NOT NULL,
//   choices jsonb NOT NULL,
//   correct text NOT NULL,
//   explanation text NOT NULL,
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
//
// 2. Add session-tracking columns to exam_sessions:
// ALTER TABLE public.exam_sessions
//   ADD COLUMN IF NOT EXISTS question_ids jsonb,
//   ADD COLUMN IF NOT EXISTS current_idx integer DEFAULT 0,
//   ADD COLUMN IF NOT EXISTS answers_log jsonb DEFAULT '[]'::jsonb,
//   ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
//
// 3. Seed exam_questions with:
//    supabase/exam-questions-seed.sql

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function examAccess(plan, examAddon) {
  return plan === 't1' || plan === 't3' || (plan === 't2' && !!examAddon)
}

export async function POST(request) {
  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, exam_addon')
    .eq('user_id', user.id)
    .single()

  if (!examAccess(sub?.plan, sub?.exam_addon)) {
    return Response.json({ error: 'Exam access required' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch { body = {} }
  const count = Math.max(1, Math.min(200, parseInt(body.count) || 20))

  const { data: allIds, error: qError } = await supabase
    .from('exam_questions')
    .select('id')

  if (qError || !allIds?.length) {
    return Response.json({ error: 'Questions unavailable' }, { status: 503 })
  }

  const shuffled = [...allIds].sort(() => Math.random() - 0.5)
  const questionIds = shuffled.slice(0, Math.min(count, allIds.length)).map(q => q.id)

  const { data: firstQ, error: fqError } = await supabase
    .from('exam_questions')
    .select('id, topic, prompt, choices')
    .eq('id', questionIds[0])
    .single()

  if (fqError || !firstQ) {
    return Response.json({ error: 'Failed to load first question' }, { status: 500 })
  }

  const { data: session, error: sError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id:             user.id,
      question_ids:        questionIds,
      current_idx:         0,
      answers_log:         [],
      status:              'active',
      score:               0,
      questions_attempted: questionIds.length,
      correct_count:       0,
      topic_breakdown:     {},
    })
    .select('id')
    .single()

  if (sError || !session) {
    console.error('Failed to create exam session:', sError)
    return Response.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return Response.json({
    sessionId: session.id,
    total:     questionIds.length,
    question:  firstQ,
  })
}
