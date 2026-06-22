import { verifyAdminToken, parseCookie } from '@/lib/admin-auth'

export function getAdminSessionToken(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  return parseCookie(cookieHeader, 'admin_session')
}

export function validateAdminSession(request) {
  const token = getAdminSessionToken(request)

  if (!token || !verifyAdminToken(token)) {
    return { valid: false, error: 'Unauthorized' }
  }

  return { valid: true, error: null }
}

export function requireAdminAuth(handler) {
  return async function protectedHandler(request, context) {
    const auth = validateAdminSession(request)

    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return handler(request, context)
  }
}
