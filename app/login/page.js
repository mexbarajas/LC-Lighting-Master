import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function login(formData) {
  'use server'

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const error = params?.error

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#16120e', color: '#fdfaf6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
        <h1 style={{ color: '#b85835', marginBottom: 8 }}>LC · Lighting Master</h1>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Email
          <input type="email" name="email" required style={{ padding: '8px 12px', background: '#1e180f', border: '1px solid #3a2e1e', color: '#fdfaf6', borderRadius: 4 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Password
          <input type="password" name="password" required style={{ padding: '8px 12px', background: '#1e180f', border: '1px solid #3a2e1e', color: '#fdfaf6', borderRadius: 4 }} />
        </label>
        {error && <p style={{ color: '#e05c3a', fontSize: 13 }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 24px', background: '#b85835', color: '#fdfaf6', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' }}>
          Log in
        </button>
      </form>
    </div>
  )
}
