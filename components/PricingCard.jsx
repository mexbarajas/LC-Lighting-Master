'use client'

import { useState } from 'react'
import { getPriceForTier, getCurrentSeason, TIER_FEATURES } from '@/lib/pricing'

const C = {
  ink:"#16120e", inkSoft:"#352c22", inkMute:"#8a7a6a",
  cream:"#f8f3ec", paper:"#fdfaf6", creamWarm:"#f0e8db",
  rule:"#e4d9ca", ruleStrong:"#cfc3b0",
  accent:"#b85835", accentLight:"rgba(184,88,53,0.08)",
  forest:"#2a6048", forestLight:"rgba(42,96,72,0.08)",
  tan:"#c8a97e",
}
const F = { display:"'Space Grotesk',sans-serif", mono:"'JetBrains Mono',monospace", body:"'Inter',sans-serif" }

function fmt(cents){ return `$${(cents/100).toFixed(0)}` }

export default function PricingCard({ user, onCheckout }) {
  const season = getCurrentSeason()
  const [teamSeats, setTeamSeats] = useState(3)
  const [loading, setLoading] = useState(null)

  async function handleBuy(tier, extraData = {}) {
    if (loading) return
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user?.id, userEmail: user?.email, ...extraData }),
      })
      const data = await res.json()
      if (data.contactUs) {
        alert('Contact us at team@lightingmaster.com for enterprise pricing.')
        return
      }
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  const tiers = [
    { id:'t1', ...TIER_FEATURES.t1, price: getPriceForTier('t1'), dark:false },
    { id:'t2', ...TIER_FEATURES.t2, price: getPriceForTier('t2'), wasPrice: season.season==='earlyBird' ? 49500 : null, dark:false, highlight: season.season==='earlyBird' },
    { id:'t3', ...TIER_FEATURES.t3, price: getPriceForTier('t3'), wasPrice: season.season==='earlyBird' ? 69500 : null, dark:true,  highlight: true },
  ]

  return (
    <div style={{ fontFamily: F.body }}>
      {season.banner && (
        <div style={{ background: '#fff8f3', border: `1px solid ${C.ruleStrong}`, borderRadius: 8,
          padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0, display:'inline-block' }}/>
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, fontWeight: 700 }}>{season.label}</span>
          <span style={{ fontFamily: F.body, fontSize: 13, color: C.inkSoft }}>{season.banner}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1,
        border: `1px solid ${C.rule}`, borderRadius: 12, overflow: 'hidden' }}>
        {tiers.map((tier, i) => (
          <div key={tier.id} style={{ background: tier.dark ? C.ink : C.paper,
            padding: '28px 22px', borderRight: i < tiers.length - 1 ? `1px solid ${C.rule}` : 'none',
            display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {tier.highlight && (
              <span style={{ position: 'absolute', top: 14, right: 14,
                background: tier.dark ? C.accent : C.forest,
                color: '#fff', fontFamily: F.mono, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: 99 }}>
                {tier.dark ? 'Best value' : season.label}
              </span>
            )}

            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: tier.dark ? C.tan : C.inkMute, marginBottom: 4 }}>{tier.tag}</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: tier.dark ? '#fff' : C.ink,
              marginBottom: 12, paddingRight: tier.highlight ? 56 : 0 }}>{tier.name}</div>

            <div style={{ marginBottom: 4 }}>
              {tier.wasPrice && (
                <span style={{ fontFamily: F.mono, fontSize: 12, color: tier.dark ? 'rgba(249,244,237,0.35)' : C.inkMute,
                  textDecoration: 'line-through', marginRight: 6 }}>{fmt(tier.wasPrice)}</span>
              )}
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36,
                color: tier.dark ? '#fff' : (tier.wasPrice ? C.forest : C.ink),
                letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(tier.price)}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: tier.dark ? 'rgba(249,244,237,0.45)' : C.inkMute, marginLeft: 6 }}>one-time</span>
            </div>

            <div style={{ fontFamily: F.body, fontSize: 11, color: tier.dark ? 'rgba(249,244,237,0.38)' : C.inkMute, marginBottom: 12 }}>
              Access until Dec 31, {new Date().getFullYear()}
            </div>

            <p style={{ fontFamily: F.body, fontSize: 12, color: tier.dark ? 'rgba(249,244,237,0.6)' : C.inkMute,
              margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>{tier.desc}</p>

            <div style={{ marginBottom: 18 }}>
              {tier.features.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0',
                  borderBottom: j < tier.features.length - 1 ? `1px solid ${tier.dark ? 'rgba(249,244,237,0.07)' : C.rule}` : 'none' }}>
                  <span style={{ color: tier.dark ? 'rgba(249,244,237,0.4)' : C.forest, fontSize: 11, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: F.display, fontSize: 11, color: tier.dark ? 'rgba(249,244,237,0.75)' : C.inkSoft, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
              {tier.addon && (
                <div style={{ marginTop: 8, fontFamily: F.body, fontSize: 10.5,
                  color: tier.dark ? 'rgba(249,244,237,0.38)' : C.inkMute, fontStyle: 'italic' }}>{tier.addon}</div>
              )}
            </div>

            <button
              onClick={() => handleBuy(tier.id)}
              disabled={loading === tier.id}
              style={{ width: '100%', padding: '12px', borderRadius: 99,
                border: tier.dark ? 'none' : `1px solid ${C.ruleStrong}`,
                background: tier.dark ? C.accent : 'none',
                color: tier.dark ? '#fff' : C.inkSoft,
                fontFamily: F.display, fontWeight: 700, fontSize: 13,
                cursor: loading === tier.id ? 'wait' : 'pointer', transition: 'all 0.15s',
                opacity: loading === tier.id ? 0.6 : 1 }}>
              {loading === tier.id ? 'Redirecting…' : `Get ${tier.name} — ${fmt(tier.price)} →`}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: '20px 22px', background: C.creamWarm,
        border: `1px solid ${C.rule}`, borderRadius: 12 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>
          Team access
        </div>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute, margin: '0 0 14px', lineHeight: 1.6 }}>
          Enroll your studio. Volume pricing applies at 6+ seats. 10+ seats — contact us for enterprise rates.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <label style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute }}>
            Seats: {teamSeats}
          </label>
          <input type="range" min={2} max={9} value={teamSeats} onChange={e => setTeamSeats(Number(e.target.value))}
            style={{ flex: 1, maxWidth: 200, accentColor: C.accent }} />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: C.ink }}>
            {fmt(getPriceForTier('team', teamSeats))}
          </span>
          <span style={{ fontFamily: F.body, fontSize: 11, color: C.inkMute }}>
            ({fmt(getPriceForTier('team', teamSeats) / teamSeats)}/seat)
          </span>
        </div>
        <button
          onClick={() => handleBuy('team', { seats: teamSeats })}
          disabled={loading === 'team'}
          style={{ padding: '10px 24px', borderRadius: 99, border: `1px solid ${C.ruleStrong}`,
            background: 'none', color: C.inkSoft, fontFamily: F.display, fontWeight: 700, fontSize: 13,
            cursor: loading === 'team' ? 'wait' : 'pointer', transition: 'all 0.15s',
            opacity: loading === 'team' ? 0.6 : 1 }}>
          {loading === 'team' ? 'Redirecting…' : `Get team access — ${teamSeats} seats →`}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexWrap: 'wrap', marginTop: 20 }}>
        <span style={{ fontFamily: F.body, fontSize: 11, color: C.inkMute }}>🔒 Secure checkout via Stripe</span>
        <span style={{ color: C.rule }}>·</span>
        <span style={{ fontFamily: F.body, fontSize: 11, color: C.inkMute }}>No recurring charges</span>
        <span style={{ color: C.rule }}>·</span>
        <span style={{ fontFamily: F.body, fontSize: 11, color: C.inkMute }}>Access expires Dec 31, {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
