const ALLOWED_HOSTNAMES = [
  'lightingmasterlc.com',
  'www.lightingmasterlc.com',
  'master-lighting.vercel.app',
].filter(Boolean)

// Add NEXT_PUBLIC_APP_URL hostname if set
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    ALLOWED_HOSTNAMES.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname)
  } catch {}
}

export function checkOrigin(request) {
  const origin = request.headers.get('origin')
  // SECURITY: Reject requests without Origin header
  // This prevents CSRF attacks via curl or requests without origin
  if (!origin) return false

  let hostname
  try {
    hostname = new URL(origin).hostname
  } catch {
    return false
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  // Exact hostname match only — prevents startsWith subdomain bypass
  return ALLOWED_HOSTNAMES.includes(hostname)
}

export function originError() {
  return new Response(
    JSON.stringify({ error: 'Forbidden — origin not allowed' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  )
}
