// Upper bound on tracked keys per limiter, so unauthenticated routes keyed by
// IP cannot grow the heap without limit.
const MAX_KEYS = 10000

export function createRateLimiter(windowMs = 60000, maxRequests = 10) {
  // Each limiter owns its own store. A shared store let one route's counter
  // for a user (e.g. exam answer checks) count against another route's limit
  // for the same user (e.g. exam finish), blocking legitimate requests.
  const store = new Map()

  function evict(now) {
    for (const [key, rec] of store) {
      if (rec.resetTime < now) store.delete(key)
    }
    // Everything still unexpired: drop the oldest entries.
    while (store.size >= MAX_KEYS) {
      store.delete(store.keys().next().value)
    }
  }

  return function checkRateLimit(identifier) {
    const now = Date.now()
    let record = store.get(identifier)

    if (!record || record.resetTime < now) {
      if (store.size >= MAX_KEYS) evict(now)
      store.set(identifier, {
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
