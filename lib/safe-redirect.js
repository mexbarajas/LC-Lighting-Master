// lib/safe-redirect.js
//
// Validates a user-supplied "next" value so it can only ever point at a path
// on this same site. Prevents open redirects such as:
//   next=//evil.com          (protocol-relative)
//   next=/\evil.com          (browsers treat \ like /)
//   next=@evil.com           (when concatenated as `${origin}${next}`)
//   next=https://evil.com    (absolute URL)
//
// Returns the original value when it is a safe same-site path, otherwise the
// fallback. The value is returned unchanged (query strings are preserved), so
// existing links such as /team/join?token=abc keep working.

const PLACEHOLDER_ORIGIN = 'http://internal.invalid'

export function safeInternalPath(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  if (value.length === 0 || value.length > 2048) return fallback

  // Must be a single-slash relative path.
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback

  // No backslashes or control characters anywhere (CR/LF, tabs, NUL, DEL).
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback

  // Final check: resolving against a placeholder origin must stay on it.
  try {
    const resolved = new URL(value, PLACEHOLDER_ORIGIN)
    if (resolved.origin !== PLACEHOLDER_ORIGIN) return fallback
  } catch {
    return fallback
  }

  return value
}
