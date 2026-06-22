export function validateEmailHeaderField(value) {
  if (typeof value !== 'string') return false

  if (value.includes('\r') || value.includes('\n') || value.includes('\0')) {
    return false
  }

  return true
}

export function sanitizeEmailHeaderField(value, maxLength = 100) {
  if (typeof value !== 'string') return ''

  let sanitized = value.trim().slice(0, maxLength)

  sanitized = sanitized.replace(/[\r\n\0]/g, '')

  return sanitized
}
