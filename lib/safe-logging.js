export function safeLogError(context, error, shouldLogStack = false) {
  if (!error) return

  const isDev = process.env.NODE_ENV === 'development'

  const sanitized = {
    context,
    message: error.message || String(error),
    code: error.code,
  }

  if (isDev && shouldLogStack) {
    sanitized.stack = error.stack
  }

  console.error(JSON.stringify(sanitized))
}

export function safeLogInfo(context, data = {}) {
  console.log(JSON.stringify({ context, ...data }))
}

export function sanitizeErrorMessage(error) {
  if (!error) return 'Unknown error'

  const message = error.message || String(error)

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) return message

  const sensitivePatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    /(sk_[a-z0-9_]{20,})/gi,
    /(pk_[a-z0-9_]{20,})/gi,
  ]

  let sanitized = message
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  })

  return sanitized || 'Database error'
}

export async function logWebhookEvent(eventType, metadata = {}) {
  const isDev = process.env.NODE_ENV === 'development'
  const logData = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...metadata,
  }

  if (!isDev) {
    delete logData.stack
    delete logData.email
    delete logData.customer
  }

  console.log(JSON.stringify(logData))
}
