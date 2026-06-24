'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const C = {
  ink: '#2F4A3F',
  inkMute: '#7A9688',
  cream: '#F2E6DA',
  paper: '#FAF5F0',
  accent: '#C65A3A',
  forest: '#3B7A57',
  rule: '#D8CBBF',
}

function JoinPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token     = params.get('token')
  const confirmed = params.get('confirmed') === 'true'

  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'done' | 'error'>('loading')
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function acceptInvite() {
    setStatus('accepting')
    try {
      const res = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        setStatus('done')
        setTimeout(() => router.push('/'), 2500)
      } else {
        let msg = 'Something went wrong. Please try again.'
        try { const d = await res.json(); msg = d.error || msg } catch {}
        setStatus('error')
        setErrorMsg(msg)
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('No invite token found. Check your email link.'); return }
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { email: u.email ?? '' } : null)
      if (u && confirmed) {
        // User just confirmed their email — auto-accept without requiring button click
        acceptInvite()
      } else {
        setStatus('ready')
      }
    })
  }, [token, confirmed])

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    background: C.paper,
    border: `1px solid ${C.rule}`,
    borderRadius: 16,
    padding: '40px 36px',
    maxWidth: 460,
    width: '100%',
    textAlign: 'center',
  }

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: C.inkMute }}>Checking your invite…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: C.ink, margin: '0 0 12px', fontSize: 20 }}>Invite problem</h2>
          <p style={{ color: C.inkMute, margin: '0 0 24px', lineHeight: 1.6 }}>{errorMsg}</p>
          <a href="/" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>← Back to LC Lighting Master</a>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ color: C.forest, margin: '0 0 12px', fontSize: 22 }}>You're in!</h2>
          <p style={{ color: C.inkMute, margin: '0 0 8px' }}>Your team access is active. Redirecting…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: C.ink, margin: '0 0 12px', fontSize: 22 }}>Team Invitation</h2>
          <p style={{ color: C.inkMute, margin: '0 0 24px', lineHeight: 1.6 }}>
            You need to sign in or create an account before accepting this invite. Use the email address the invite was sent to.
          </p>
          <a
            href={`/?joinToken=${encodeURIComponent(token ?? '')}`}
            style={{
              display: 'inline-block',
              background: C.accent,
              color: '#fff',
              textDecoration: 'none',
              padding: '13px 28px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 16,
            }}
          >
            Sign in / Create account →
          </a>
          <p style={{ color: C.inkMute, fontSize: 13, margin: 0 }}>
            After signing in, return to this page to accept your invitation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
        <h2 style={{ color: C.ink, margin: '0 0 8px', fontSize: 22 }}>Accept Team Invitation</h2>
        <p style={{ color: C.inkMute, margin: '0 0 24px', lineHeight: 1.6 }}>
          Signed in as <strong style={{ color: C.ink }}>{user.email}</strong>.<br />
          Click below to join your team on LC · Lighting Master.
        </p>
        <button
          onClick={acceptInvite}
          disabled={status === 'accepting'}
          style={{
            display: 'block',
            width: '100%',
            background: status === 'accepting' ? C.rule : C.accent,
            color: status === 'accepting' ? C.inkMute : '#fff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
            cursor: status === 'accepting' ? 'default' : 'pointer',
            marginBottom: 16,
          }}
        >
          {status === 'accepting' ? 'Joining…' : 'Accept Invitation →'}
        </button>
        <p style={{ color: C.inkMute, fontSize: 12, margin: 0 }}>
          Wrong account?{' '}
          <button
            onClick={() => supabase.auth.signOut().then(() => setUser(null))}
            style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12, padding: 0 }}
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F2E6DA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7A9688', fontFamily: 'system-ui' }}>Loading…</p>
      </div>
    }>
      <JoinPageInner />
    </Suspense>
  )
}
