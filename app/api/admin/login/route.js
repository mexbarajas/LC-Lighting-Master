import { generateAdminToken, verifyPassword } from '@/lib/admin-auth'

// Simple in-memory rate limiting (ip -> {count, resetTime})
const loginAttempts = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (!attempt || attempt.resetTime < now) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 900000 }) // 15 min window
    return true
  }

  if (attempt.count >= 5) {
    return false // Blocked after 5 attempts
  }

  attempt.count++
  return true
}

export async function POST(request) {
  let body
  try {
    const text = await request.text()
    if (text.length > 4096) return new Response('Too large', { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many login attempts. Try again in 15 minutes.' }), { status: 429 })
  }

  const { email, password } = body || {}
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPwHash = process.env.ADMIN_PASSWORD_HASH
  const adminJwtSecret = process.env.ADMIN_JWT_SECRET

  if (!adminEmail || !adminPwHash || !adminJwtSecret) {
    console.error('Admin env vars not properly configured')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 })
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    await new Promise(r => setTimeout(r, 600 + Math.floor(Math.random() * 400)))
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
  }

  const emailMatch = email.trim().toLowerCase() === adminEmail.toLowerCase()
  const passwordMatch = await verifyPassword(password, adminPwHash)

  if (!emailMatch || !passwordMatch) {
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
