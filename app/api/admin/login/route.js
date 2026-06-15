import { generateAdminToken } from '@/lib/admin-auth'

export async function POST(request) {
  let body
  try {
    const text = await request.text()
    if (text.length > 4096) return new Response('Too large', { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { email, password } = body || {}
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPw = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPw) {
    console.error('Admin env vars not configured')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 })
  }

  const match =
    typeof email === 'string' &&
    typeof password === 'string' &&
    email.trim().toLowerCase() === adminEmail.toLowerCase() &&
    password === adminPw

  if (!match) {
    await new Promise(r => setTimeout(r, 600 + Math.floor(Math.random() * 400)))
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
  }

  const token = generateAdminToken()
  const isProd = process.env.NODE_ENV === 'production'

  const cookieParts = [
    `admin_session=${encodeURIComponent(token)}`,
    'HttpOnly',
    isProd ? 'Secure' : null,
    'SameSite=Strict',
    'Path=/',
    'Max-Age=28800',
  ].filter(Boolean).join('; ')

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieParts,
    },
  })
}
