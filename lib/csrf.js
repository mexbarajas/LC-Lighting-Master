const ALLOWED_ORIGINS = [
  'https://lightingmasterlc.com',
  'https://www.lightingmasterlc.com',
  'https://master-lighting.vercel.app',
  process.env.NEXT_PUBLIC_APP_URL,
]

export function checkOrigin(request) {
  const origin = request.headers.get('origin')

  // Allow same-origin requests (no origin header)
  if (!origin) return true

  return ALLOWED_ORIGINS.some(allowed => allowed && origin.startsWith(allowed))
}

export function originError() {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  )
}
