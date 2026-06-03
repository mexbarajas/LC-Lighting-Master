import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#16120e', color: '#fdfaf6', minHeight: '100vh' }}>
      <h1 style={{ color: '#b85835' }}>✅ LC · Lighting Master</h1>
      <p>Infrastructure shell live.</p>
      <p>Authenticated as: <strong>{user.email}</strong></p>
    </div>
  )
}
