const rateLimitStore = new Map()

export function createRateLimiter(windowMs = 60000, maxRequests = 10) {
  return function checkRateLimit(identifier) {
    const now = Date.now()
    let record = rateLimitStore.get(identifier)

    if (!record || record.resetTime < now) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return { allowed: true, remaining: maxRequests - 1 }
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return { allowed: false, remaining: 0, retryAfter }
    }

    record.count++
    return { allowed: true, remaining: maxRequests - record.count }
  }
}

export function getRateLimitHeaders(rateLimitInfo, maxRequests) {
  const headers = {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, rateLimitInfo.remaining)),
  }

  if (rateLimitInfo.retryAfter) {
    headers['Retry-After'] = String(rateLimitInfo.retryAfter)
  }

  return headers
}
