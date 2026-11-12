// app/api/notify/new-user/route.js
//
// Called by a Supabase database trigger (via pg_net) every time a new account is
// created. Emails the admin so a new signup never goes unnoticed.
//
// Security: the caller must send the shared secret in the `x-notify-secret` header.
// Without NOTIFY_WEBHOOK_SECRET configured the route is disabled (503), so it can
// never be used as an open email relay.

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { escapeHtml } from '@/lib/html-escape'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'admin@luxartmedia.com'

function secretsMatch(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on different lengths, so compare lengths first.
  return a.length === b.length && timingSafeEqual(a, b)
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(req) {
  const expected = process.env.NOTIFY_WEBHOOK_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!secretsMatch(req.headers.get('x-notify-secret'), expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = clean(body?.email, 320)
  const provider = clean(body?.provider, 50) || 'email'
  const createdAt = clean(body?.created_at, 40)
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[notify/new-user] BREVO_API_KEY not set — notification not sent')
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: {
        name: 'LC Lighting Master',
        email: process.env.BREVO_SENDER_EMAIL || ADMIN_EMAIL,
      },
      to: [{ email: ADMIN_EMAIL, name: 'Luxart Admin' }],
      subject: `New user: ${email.replace(/[\r\n]/g, ' ')}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#16120e">New user signed up</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px;width:100px">Email</td><td style="padding:8px 0;font-size:13px">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Sign-in</td><td style="padding:8px 0;font-size:13px">${escapeHtml(provider)}</td></tr>
            <tr><td style="padding:8px 0;color:#8a7a6a;font-size:13px">Created</td><td style="padding:8px 0;font-size:13px">${escapeHtml(createdAt)}</td></tr>
          </table>
          <p style="font-size:11px;color:#8a7a6a;margin-top:16px">Sent from LightingMasterLC.com</p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    console.error('[notify/new-user] Brevo error, status:', res.status)
    return NextResponse.json({ error: 'Failed to send' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
