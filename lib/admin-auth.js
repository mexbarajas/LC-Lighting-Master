import { createHmac, timingSafeEqual } from 'crypto'

const getSecret = () =>
  process.env.ADMIN_JWT_SECRET ||
  (process.env.ADMIN_PASSWORD || 'unset') + '_lc_admin_v1'

export function generateAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600 // 8 hours
  const payload = `admin:${exp}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(payload).toString('base64url') + '.' + sig
}

export function verifyAdminToken(token) {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let payload
  try { payload = Buffer.from(b64, 'base64url').toString() } catch { return false }
  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
  try {
    const aBuf = Buffer.from(sig, 'hex')
    const bBuf = Buffer.from(expected, 'hex')
    if (aBuf.length !== bBuf.length) return false
    if (!timingSafeEqual(aBuf, bBuf)) return false
  } catch { return false }
  const parts = payload.split(':')
  return parts.length === 2 && Math.floor(Date.now() / 1000) < parseInt(parts[1])
}

export function parseCookie(header, name) {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = (header || '').match(new RegExp(`(?:^|;\\s*)${safe}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}
