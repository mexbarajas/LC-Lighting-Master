'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const params = useSearchParams()
  const tokenHash = params.get('token_hash')
  const urlError  = params.get('error_description') || params.get('error')
  const [pw, setPw]     = useState('')
  const [pw2, setPw2]   = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setErr('')
    if (!tokenHash) { setErr('This link is missing its token — request a new reset email.'); return }
    if (pw.length < 10) { setErr('Password must be at least 10 characters.'); return }
    if (pw !== pw2)     { setErr('Passwords do not match.'); return }
    setBusy(true)
    try {
      const supabase = createClient()
      // Verify ONLY now, on the user's click — not on page load.
      const { error: vErr } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
      if (vErr) throw new Error('This link is invalid or has expired. Please request a new one.')
      const { error: uErr } = await supabase.auth.updateUser({ password: pw })
      if (uErr) throw uErr
      setDone(true)
    } catch (e) {
      setErr(e?.message || 'Could not reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4">
      <div className="w-full max-w-sm bg-white border border-[#e4d9ca] rounded-lg p-8">
        <p className="text-xs font-mono tracking-[0.22em] uppercase text-[#8a7a6a] mb-3">LC · Lighting Master</p>
        {done ? (
          <>
            <h1 className="text-lg font-semibold text-[#2a6048] mb-2">Password updated</h1>
            <a href="/login" className="mt-2 inline-block px-5 py-2.5 rounded bg-[#2a6048] text-white text-sm font-semibold">Go to sign in</a>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-[#16120e] mb-1">Set a new password</h1>
            <p className="text-sm text-[#8a7a6a] mb-5">Choose a password you haven't used before.</p>
            {urlError && <p className="text-xs text-[#b85835] mb-3">This link has expired — request a new reset email and open it right away.</p>}
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (10+ characters)"
              className="w-full px-3 py-2.5 mb-3 text-sm border border-[#cfc3b0] rounded" />
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password"
              className="w-full px-3 py-2.5 mb-3 text-sm border border-[#cfc3b0] rounded" />
            {err && <p className="text-xs text-[#b85835] mb-3">{err}</p>}
            <button onClick={submit} disabled={busy}
              className="w-full py-2.5 rounded bg-[#2a6048] text-white text-sm font-semibold disabled:opacity-50">
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <p className="text-sm text-[#8a7a6a] font-mono">Loading…</p>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
