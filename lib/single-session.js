import { createClient } from '@supabase/supabase-js'

// One active login per account (stops password sharing).
//
// The active login is the Supabase session id inside the access token. Each browser,
// and each private/incognito window, gets its own session id; tabs of the same browser
// share one. subscriptions.session_token holds the id of the account's active login.

export function sessionIdFromAccessToken(accessToken) {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    return JSON.parse(atob(padded)).session_id || null
  } catch {
    return null
  }
}

// Call right after a successful sign-in, with the session it returned.
// Makes this login the active one and ends every other login of the account.
export async function claimSingleSession(supabase, session) {
  const sessionId = session?.access_token && sessionIdFromAccessToken(session.access_token)
  if (!sessionId) return null
  // A client bound to this login's own token, so the write works the same in the
  // browser and on the server, even before the new sign-in cookies are readable.
  const asThisLogin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'lc-single-session' },
  })
  const { error } = await asThisLogin
    .from('subscriptions')
    .update({ session_token: sessionId, session_created_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
  if (error) console.error('[single-session] could not record active login:', error.message)
  // Revokes the other logins on the auth server, so they cannot refresh their tokens.
  // admin.signOut only needs this login's own token; it does not touch local cookies.
  await asThisLogin.auth.admin.signOut(session.access_token, 'others')
  return sessionId
}

// Returns false when another login has taken over: this browser is then signed out.
// Returns true when this login is the active one (claiming it if none is recorded).
export async function checkSingleSession(supabase, session) {
  if (!session) return true
  const sessionId = sessionIdFromAccessToken(session.access_token)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('session_token')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (!sub || !sessionId) return true
  if (!sub.session_token) {
    await claimSingleSession(supabase, session)
    return true
  }
  if (sub.session_token === sessionId) return true
  await supabase.auth.signOut({ scope: 'local' })
  return false
}
