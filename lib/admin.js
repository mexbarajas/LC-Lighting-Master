import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return { error: new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )}
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single()

  if (!sub?.is_admin) {
    return { error: new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )}
  }

  return { user: session.user, supabase }
}
