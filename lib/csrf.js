const ALLOWED_ORIGINS = [
  'https://lightingmasterlc.com',
  'https://www.lightingmasterlc.com',
  'https://master-lighting.vercel.app',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean)

export function checkOrigin(request) {
  if (process.env.NODE_ENV === 'development') return true
  const origin = request.headers.get('origin')
  if (!origin) return true
  if (origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')) return true
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))
}

export function originError() {
  return new Response(
    JSON.stringify({ error: 'Forbidden — origin not allowed' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  )
}
