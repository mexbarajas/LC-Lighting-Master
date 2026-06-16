import crypto from 'crypto'

function secret() {
  return 'lc-exam-v1:' + process.env.SUPABASE_SERVICE_ROLE_KEY
}

export function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const data = token.slice(0, dot)
  const sig  = token.slice(dot + 1)
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  try {
    const a = Buffer.from(sig,      'ascii')
    const b = Buffer.from(expected, 'ascii')
    if (a.length !== b.length) return null
    if (!crypto.timingSafeEqual(a, b)) return null
  } catch { return null }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch { return null }
}
