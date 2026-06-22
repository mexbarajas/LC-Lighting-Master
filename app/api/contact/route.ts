import { NextResponse } from 'next/server'
import { sanitizeEmailInput } from '@/lib/html-escape'
import { sanitizeEmailHeaderField } from '@/lib/email-validation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    let { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'All fields must be strings.' }, { status: 400 })
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 })
    }

    // Sanitize inputs
    name = sanitizeEmailInput(name, 100)
    email = email.trim().toLowerCase()
    subject = sanitizeEmailHeaderField(subject, 200)
    message = sanitizeEmailInput(message, 5000)

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'LC Lighting Master', email: 'admin@luxartmedia.com' },
        to: [{ email: 'admin@luxartmedia.com', name: 'Luxart Admin' }],
        replyTo: { email, name },
        subject: `[Contact Form] ${subject}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#16120e">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px;width:80px">Name</td><td style="padding:8px 0;font-size:13px">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Subject</td><td style="padding:8px 0;font-size:13px">${subject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e4d9ca;margin:16px 0"/>
            <p style="font-size:14px;line-height:1.6;color:#16120e;white-space:pre-wrap">${message}</p>
            <hr style="border:none;border-top:1px solid #e4d9ca;margin:16px 0"/>
            <p style="font-size:11px;color:#8a7a6a">Sent from LightingMasterLC.com contact form</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Brevo error:', err)
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
