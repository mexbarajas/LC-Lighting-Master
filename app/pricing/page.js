'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const PricingCard = dynamic(() => import('@/components/PricingCard'), { ssr: false })

const C = {
  ink: '#16120e', inkSoft: '#352c22', inkMute: '#8a7a6a',
  cream: '#f8f3ec', accent: '#b85835', rule: '#e4d9ca',
}
const F = { display: "'Space Grotesk',sans-serif", body: "'Inter',sans-serif" }

export default function PricingPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser({ id: session.user.id, email: session.user.email })
    })
  }, [])

  return (
    <div style={{ fontFamily: F.body, background: C.cream, minHeight: '100vh', padding: '60px 24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>LC · Lighting Master</div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 40, letterSpacing: '-0.025em',
            color: C.ink, margin: '0 0 16px', lineHeight: 1.1 }}>Choose your access tier</h1>
          <p style={{ fontFamily: F.body, fontSize: 15, color: C.inkMute, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            One-time payment. Access through December 31, {new Date().getFullYear()}. No subscriptions, no recurring charges.
          </p>
        </div>
        <PricingCard user={user} />
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a href="/" style={{ fontFamily: F.display, fontSize: 13, color: C.inkMute, textDecoration: 'none',
            borderBottom: `1px solid ${C.rule}` }}>← Back to home</a>
        </div>
      </div>
    </div>
  )
}
