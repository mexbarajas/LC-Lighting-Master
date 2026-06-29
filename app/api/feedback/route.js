import { createServiceClient } from '@/lib/supabase/service'
import { sanitizeEmailInput } from '@/lib/html-escape'

const VALID_CATEGORIES = ['bug', 'feature', 'content', 'discount', 'billing', 'other']
const ADMIN_EMAIL = 'admin@luxartmedia.com'

export async function POST(request) {
  let body
  try {
    const text = await request.text()
    if (text.length > 20000) return new Response(JSON.stringify({ error: 'Request too large' }), { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { user_id, category, subject, message, user_email, plan } = body

  if (!VALID_CATEGORIES.includes(category)) {
    return new Response(JSON.stringify({ error: 'Invalid category.' }), { status: 400 })
  }
  if (!subject?.trim() || !message?.trim() || message.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'Subject and message are required.' }), { status: 400 })
  }
  if (!user_email?.trim()) {
    return new Response(JSON.stringify({ error: 'Email is required.' }), { status: 400 })
  }

  const safeSubject = sanitizeEmailInput(subject, 200)
  const safeMessage = sanitizeEmailInput(message, 5000)
  const safeEmail   = user_email.trim().toLowerCase()
  const safePlan    = plan || 'free'

  const supabase = createServiceClient()

  // Insert into feedback table
  const { error: dbError } = await supabase.from('feedback').insert({
    user_id:    user_id || null,
    category,
    subject:    subject.trim(),
    message:    message.trim(),
    user_email: safeEmail,
    plan:       safePlan,
  })

  if (dbError) {
    console.error('Feedback DB insert error:', dbError)
    return new Response(JSON.stringify({ error: 'Failed to save feedback.' }), { status: 500 })
  }

  // Send email notification to admin via Brevo
  if (process.env.BREVO_API_KEY) {
    const categoryLabel = {
      bug: '🐛 Bug report', feature: '💡 Feature request', content: '📚 Content feedback',
      discount: '🎓 Student discount', billing: '💳 Billing question', other: '✉ Other',
    }[category] || category

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender:      { name: 'LC Lighting Master', email: ADMIN_EMAIL },
        to:          [{ email: ADMIN_EMAIL, name: 'Luxart Admin' }],
        replyTo:     { email: safeEmail, name: safeEmail },
        subject:     `[Feedback · ${categoryLabel}] ${subject.trim().slice(0, 120)}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#16120e">New Feedback Submission</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px;width:100px">Category</td><td style="padding:8px 0;font-size:13px">${categoryLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Plan</td><td style="padding:8px 0;font-size:13px">${safePlan}</td></tr>
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Subject</td><td style="padding:8px 0;font-size:13px">${safeSubject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e4d9ca;margin:16px 0"/>
            <p style="font-size:14px;line-height:1.6;color:#16120e;white-space:pre-wrap">${safeMessage}</p>
            <hr style="border:none;border-top:1px solid #e4d9ca;margin:16px 0"/>
            <p style="font-size:11px;color:#8a7a6a">Sent from LightingMasterLC.com feedback form</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Brevo email error (feedback saved to DB):', err)
    }
  } else {
    console.warn('BREVO_API_KEY not set — feedback saved to DB but email not sent')
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
