'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const C = {
  ink:     '#2F4A3F',
  inkMute: '#7A9688',
  cream:   '#F2E6DA',
  paper:   '#FAF5F0',
  accent:  '#C65A3A',
  forest:  '#3B7A57',
  rule:    '#D8CBBF',
}

export default function TeamJoinClient() {
  const params  = useSearchParams()
  const router  = useRouter()
  const token   = params.get('token')
  const supabase = createClient()

  const [state,   setState]   = useState('checking') // checking | accepting | success | error | need_auth
  const [message, setMessage] = useState('')
  const acceptedRef = useRef(false)

  // Acceptance logic — runs whenever we have a logged-in user + token
  async function attemptAccept() {
    if (acceptedRef.current) return  // prevent double-call
    acceptedRef.current = true
    setState('accepting')
    try {
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      let d = {}
      try { d = await res.json() } catch { d = {} }

      if (res.ok && d.success) {
        setState('success')
        setMessage('Your team license is now active. Redirecting…')
        setTimeout(() => router.push('/'), 1800)
        return
      }
      if (d.already_accepted || d.already_member) {
        setState('success')
        setMessage('You already have access. Redirecting…')
        setTimeout(() => router.push('/'), 1500)
        return
      }
      setState('error')
      setMessage(d.error || 'Could not accept invitation.')
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Invalid invitation link — no token found.')
      return
    }

    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (user) {
        // Already logged in (existing or newly-confirmed account) — accept immediately
        attemptAccept()
      } else {
        // Not logged in — redirect to login preserving the token as return URL
        setState('need_auth')
        const returnUrl = encodeURIComponent(`/team/join?token=${token}`)
        router.push(`/login?next=${returnUrl}&invite=1`)
      }
    }

    init()

    // Re-run accept if the user logs in in another tab or completes auth flow
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && token && !cancelled) {
        attemptAccept()
      }
    })

    return () => {
      cancelled = true
      authListener?.subscription?.unsubscribe?.()
    }
  }, [token])

  const containerStyle = {
    minHeight: '100vh', background: C.cream,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }
  const cardStyle = {
    maxWidth: 460, width: '100%', background: C.paper,
    border: `1px solid ${C.rule}`, borderRadius: 16, padding: '40px 36px', textAlign: 'center',
  }
  const tagStyle = {
    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: C.accent, marginBottom: 16,
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={tagStyle}>Team Invitation</div>

        {(state === 'checking' || state === 'accepting') && (
          <>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>
              Activating your access…
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.inkMute }}>
              One moment while we link your account to the team license.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: C.forest, margin: '0 0 12px' }}>
              You&apos;re in!
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.inkMute }}>{message}</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#cc3344', margin: '0 0 12px' }}>
              Couldn&apos;t activate
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.inkMute, margin: '0 0 20px' }}>{message}</p>
            <a href="/" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Back to LC Lighting Master</a>
          </>
        )}

        {state === 'need_auth' && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: C.inkMute }}>
            Redirecting you to sign in…
          </p>
        )}
      </div>
    </div>
  )
}
