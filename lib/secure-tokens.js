import { randomBytes, createHash, timingSafeEqual } from 'crypto'

export function generateSecureToken(length = 32) {
  return randomBytes(length).toString('hex')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export async function validateTokenMatch(providedToken, storedHash) {
  if (!providedToken || !storedHash) return false

  try {
    const providedHash = createHash('sha256').update(providedToken).digest('hex')

    const providedBuf = Buffer.from(providedHash, 'hex')
    const storedBuf = Buffer.from(storedHash, 'hex')

    return timingSafeEqual(providedBuf, storedBuf)
  } catch {
    return false
  }
}
