import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id
    const email  = user.email

    let body
    try { body = await req.json() } catch { body = {} }
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : ''

    // Service client — created inside handler so env vars are always resolved at runtime
    const SERVICE = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: insertErr } = await SERVICE
      .from('exam_retake_requests')
      .insert({
        user_id:    userId,
        email,
        reason,
        status:     'pending',
        created_at: new Date().toISOString(),
      })

    if (insertErr) {
      console.error('[exam/retake] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    // Send admin notification email via Brevo if API key is configured
    if (process.env.BREVO_API_KEY) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key':      process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender:      { name: 'LC Lighting Master', email: 'noreply@lightingmasterlc.com' },
          to:          [{ email: process.env.ADMIN_EMAIL || 'admin@luxartmedia.com', name: 'Admin' }],
          subject:     `Exam Retake Request — ${email}`,
          htmlContent: `
            <h2>Exam Retake Request</h2>
            <p><strong>User:</strong> ${email}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <hr/>
            <p>To approve: go to Supabase &rarr; exam_retake_requests table and
            update status to "approved", then clear completed exam_sessions rows
            for this user to reset their attempt count.</p>
          `,
        }),
      }).catch(e => console.error('[exam/retake] email send failed:', e))
    }

    return NextResponse.json({ submitted: true })

  } catch (err) {
    console.error('[exam/retake] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
