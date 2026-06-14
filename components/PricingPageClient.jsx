'use client'

import PricingCard from '@/components/PricingCard'

export default function PricingPageClient({ userEmail, userId }) {
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: '#f8f3ec',
      minHeight: '100vh',
      padding: '64px 24px 80px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#b85835', marginBottom: 14,
          }}>LC · Lighting Master</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 42, letterSpacing: '-0.025em',
            color: '#16120e', margin: '0 0 16px', lineHeight: 1.1,
          }}>Choose your access tier</h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15, color: '#8a7a6a',
            maxWidth: 520, margin: '0 auto', lineHeight: 1.65,
          }}>
            One-time payment. Access through December 31, {new Date().getFullYear()}.
            No subscriptions, no recurring charges.
          </p>
        </div>

        <PricingCard userId={userId} userEmail={userEmail} />

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a href="/" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, color: '#8a7a6a',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(22,18,14,0.15)',
          }}>← Back to home</a>
        </div>
      </div>
    </div>
  )
}
