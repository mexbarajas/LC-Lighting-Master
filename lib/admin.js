import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )}
  }

  const { data: sub, error: dbError } = await supabase
    .from('subscriptions')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (dbError || !sub?.is_admin) {
    return { error: new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )}
  }

  return { user, supabase }
}
