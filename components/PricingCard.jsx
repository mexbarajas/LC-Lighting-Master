'use client'

import { useState, useCallback } from 'react'
import { PLANS, TEAM_TIERS, getTeamPerSeat } from '@/lib/pricing'

const C = {
  ink: '#16120e',
  inkSoft: '#352c22',
  inkMute: '#8a7a6a',
  accent: '#b85835',
  accentDim: 'rgba(184,88,53,0.08)',
  cream: '#fdfaf6',
  creamWarm: '#f5ede0',
  forest: '#2d4a3e',
  forestDim: 'rgba(45,74,62,0.08)',
  amber: '#b88a00',
  amberDim: 'rgba(184,138,0,0.10)',
  rule: 'rgba(22,18,14,0.12)',
  ruleStrong: 'rgba(22,18,14,0.20)',
}

const FONT = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
  body: "'Inter', sans-serif",
}

function fmt(cents) {
  return `$${Math.round(cents / 100)}`
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontFamily: FONT.mono, fontSize: 8, fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 99,
      color, background: bg,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

function FeatureRow({ item, dark }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '5px 0',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : C.rule}`,
    }}>
      <span style={{ color: dark ? 'rgba(255,255,255,0.35)' : C.forest, fontSize: 11, flexShrink: 0 }}>✓</span>
      <span style={{ fontFamily: FONT.display, fontSize: 11.5, lineHeight: 1.5,
        color: dark ? 'rgba(255,255,255,0.75)' : C.inkSoft }}>{item}</span>
    </div>
  )
}

export default function PricingCard({ userId, userEmail, onContactUs }) {
  const [teamSeats, setTeamSeats] = useState(5)
  const [loading, setLoading] = useState(null)

  const t1 = PLANS.t1
  const t2 = PLANS.t2
  const t3 = PLANS.t3

  const activeTier = getTeamPerSeat(teamSeats)
  const teamTotal = activeTier && !activeTier.contact ? activeTier.perSeat * teamSeats : null
  const teamSavings = teamTotal ? (t3.amount / 100) * teamSeats - teamTotal : null

  const handleCheckout = useCallback(async (plan, seats = 1) => {
    if (loading) return
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, seats }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout failed. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }, [loading])

  return (
    <div style={{ fontFamily: FONT.body }}>

      {/* 3-column grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        border: `1px solid ${C.rule}`, borderRadius: 12, overflow: 'hidden',
        marginBottom: 24,
      }}>

        {/* ── T1 ── */}
        <div style={{
          background: C.cream, padding: '26px 22px',
          borderRight: `1px solid ${C.rule}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            marginBottom: 4, gap: 8 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: C.inkMute }}>Tier 1</span>
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 17,
            color: C.ink, marginBottom: 14 }}>{t1.name}</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
              color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(t1.amount)}
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginLeft: 6 }}>one-time</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.inkMute, marginBottom: 14 }}>
            One-time payment · Access through Dec 31
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            Already studied? Use our LC practice engine as your final accuracy check before exam day.
          </p>
          <div style={{ marginBottom: 18 }}>
            {['180 LC practice questions', '13 topic breakdown',
              '25-sec timed exam', 'Speed bonuses & streaks',
              'Per-topic accuracy report', 'Unlimited attempts']
              .map((f, i) => <FeatureRow key={i} item={f} dark={false} />)}
          </div>
          <button onClick={() => handleCheckout('t1')}
            disabled={loading === 't1'}
            style={{
              width: '100%', padding: '12px', borderRadius: 99,
              border: `1px solid ${C.ruleStrong}`, background: 'none',
              color: C.inkSoft, fontFamily: FONT.display, fontWeight: 700,
              fontSize: 13, cursor: loading === 't1' ? 'wait' : 'pointer',
              transition: 'all 0.15s', opacity: loading === 't1' ? 0.55 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.inkSoft; e.currentTarget.style.borderColor = C.ruleStrong }}>
            {loading === 't1' ? 'Redirecting…' : 'Get LC Preparation Test →'}
          </button>
        </div>

        {/* ── T2 ── */}
        <div style={{
          background: C.cream, padding: '26px 22px',
          borderRight: `1px solid ${C.rule}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            marginBottom: 4, gap: 8 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: C.inkMute }}>Tier 2</span>
            <Badge label="Most popular" color="#fff" bg={C.accent} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 17,
            color: C.ink, marginBottom: 14 }}>{t2.name}</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
              color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(t2.amount)}
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginLeft: 6 }}>one-time</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.inkMute, marginBottom: 14 }}>
            One-time payment · Access through Dec 31
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            All 12 modules structured around the LC exam blueprint. Certificate + 24 CEU hours.
          </p>
          <div style={{ marginBottom: 8 }}>
            {['All 12 modules · 74 lessons', 'Audio narration every lesson',
              'Bookmarks & notes hub', 'Certificate of completion', '24 CEU credit hours']
              .map((f, i) => <FeatureRow key={i} item={f} dark={false} />)}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 10.5, color: C.inkMute,
            fontStyle: 'italic', marginBottom: 14 }}>
            + Or get both bundled in Tier 3 — $595 (save $50)
          </div>
          <button onClick={() => handleCheckout('t2')}
            disabled={loading === 't2'}
            style={{
              width: '100%', padding: '12px', borderRadius: 99,
              border: `1px solid ${C.ruleStrong}`, background: 'none',
              color: C.inkSoft, fontFamily: FONT.display, fontWeight: 700,
              fontSize: 13, cursor: loading === 't2' ? 'wait' : 'pointer',
              transition: 'all 0.15s', opacity: loading === 't2' ? 0.55 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.inkSoft; e.currentTarget.style.borderColor = C.ruleStrong }}>
            {loading === 't2' ? 'Redirecting…' : 'Start Full Course →'}
          </button>
        </div>

        {/* ── T3 ── */}
        <div style={{
          background: C.ink, padding: '26px 22px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            marginBottom: 4, gap: 8 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}>Tier 3</span>
            <Badge label="Best value" color="#fff" bg={C.accent} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 17,
            color: '#fff', marginBottom: 14 }}>{t3.name}</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
              color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(t3.amount)}
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10,
              color: 'rgba(255,255,255,0.38)', marginLeft: 6 }}>one-time</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11,
            color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>
            One-time payment · Access through Dec 31
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: 'rgba(255,255,255,0.55)',
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            The complete package — all 12 modules plus the LC practice exam bundled together.
          </p>
          <div style={{ marginBottom: 18 }}>
            {['Everything in Full Course', 'LC Preparation Test included',
              '50 LC practice questions', 'Unlimited exam attempts',
              'Topic accuracy analytics', 'Priority support']
              .map((f, i) => <FeatureRow key={i} item={f} dark={true} />)}
          </div>
          <button onClick={() => handleCheckout('t3')}
            disabled={loading === 't3'}
            style={{
              width: '100%', padding: '12px', borderRadius: 99,
              border: 'none', background: C.accent, color: '#fff',
              fontFamily: FONT.display, fontWeight: 700, fontSize: 13,
              cursor: loading === 't3' ? 'wait' : 'pointer',
              transition: 'opacity 0.15s', opacity: loading === 't3' ? 0.55 : 1,
            }}>
            {loading === 't3' ? 'Redirecting…' : 'Start Course + Exam →'}
          </button>
        </div>
      </div>

      <p style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMute,
        textAlign: 'center', margin: '16px 0 24px', lineHeight: 1.6 }}>
        All plans include a <strong style={{ color: C.inkSoft }}>free trial</strong> — Module 01 in full + 10 LC practice questions. No card required.
      </p>

      {/* Student discount — request flow */}
      <div style={{
        background: C.forestDim,
        border: `1px solid rgba(45,74,62,0.25)`,
        borderRadius: 10, padding: '24px 28px', marginBottom: 24,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.forest, fontWeight: 700, marginBottom: 10 }}>
          🎓 Student Discount
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 15,
          color: C.ink, marginBottom: 8 }}>
          Are you a lighting student?
        </div>
        <p style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMute,
          lineHeight: 1.75, margin: '0 0 18px', maxWidth: 520 }}>
          We offer a 25% student discount for enrolled students in lighting design, architecture,
          electrical engineering, or related programs. Send us your student ID or enrollment
          verification and we'll send you a discount code.
        </p>
        <a
          href="mailto:admin@luxartmedia.com?subject=Student%20Discount%20Request&body=Name:%0ASchool:%0AProgram:%0AExpected%20graduation:"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: FONT.display, fontWeight: 700, fontSize: 13,
            background: C.forest, color: '#fff', borderRadius: 99,
            padding: '11px 22px', textDecoration: 'none',
          }}>
          Request student discount →
        </a>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkMute,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12 }}>
          Individual plans only · Verified by enrollment documentation
        </div>
      </div>

      {/* ── Team section ── */}
      <div style={{
        background: C.creamWarm, border: `1px solid ${C.rule}`,
        borderRadius: 12, padding: '24px 26px',
      }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 15,
          color: C.ink, marginBottom: 4 }}>Team Access</div>
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
          margin: '0 0 16px', lineHeight: 1.6 }}>
          Enroll your studio. Includes all Tier 3 content for each seat. Minimum 5 seats.
        </p>

        {/* Tier table */}
        <div style={{ marginBottom: 18, border: `1px solid ${C.rule}`,
          borderRadius: 8, overflow: 'hidden' }}>
          {TEAM_TIERS.map((t, i) => {
            const isActive = teamSeats >= t.minSeats &&
              (t.maxSeats === null || teamSeats <= t.maxSeats)
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 14px',
                background: isActive ? C.accentDim : i % 2 === 0 ? C.cream : C.creamWarm,
                borderBottom: i < TEAM_TIERS.length - 1 ? `1px solid ${C.rule}` : 'none',
                transition: 'background 0.15s',
              }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 10,
                  letterSpacing: '0.12em', color: C.inkMute }}>{t.label}</span>
                {t.contact ? (
                  <a href="mailto:admin@luxartmedia.com?subject=Team%20License%20Quote"
                    style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 12,
                      color: C.accent, textDecoration: 'none' }}>
                    Contact us →
                  </a>
                ) : (
                  <span style={{ fontFamily: FONT.display, fontWeight: 700,
                    fontSize: 13, color: C.ink }}>${t.perSeat} / seat</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Seat stepper + total */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            border: `1px solid ${C.ruleStrong}`, borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setTeamSeats(s => Math.max(5, s - 1))}
              style={{ width: 36, height: 36, border: 'none', background: C.cream,
                cursor: 'pointer', fontFamily: FONT.display, fontSize: 16, color: C.inkSoft }}>
              −
            </button>
            <input type="number" min={5} max={50} value={teamSeats}
              onChange={e => setTeamSeats(Math.max(5, Math.round(Number(e.target.value) || 5)))}
              style={{ width: 48, height: 36, border: 'none',
                borderLeft: `1px solid ${C.rule}`, borderRight: `1px solid ${C.rule}`,
                textAlign: 'center', fontFamily: FONT.display, fontWeight: 700,
                fontSize: 14, color: C.ink, background: C.cream }} />
            <button
              onClick={() => setTeamSeats(s => s + 1)}
              style={{ width: 36, height: 36, border: 'none', background: C.cream,
                cursor: 'pointer', fontFamily: FONT.display, fontSize: 16, color: C.inkSoft }}>
              +
            </button>
          </div>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: C.inkMute }}>seats</span>
          {teamTotal && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginBottom: 2 }}>
                {teamSeats} seats × ${activeTier.perSeat} =
              </div>
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 24,
                color: C.ink, letterSpacing: '-0.02em' }}>
                ${teamTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <p style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkMute,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Minimum 5 seats · For 11+ seats contact admin@luxartmedia.com for a custom quote
        </p>

        {teamTotal && teamSavings > 0 && (
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.forest,
            marginBottom: 14, background: C.forestDim, borderRadius: 6,
            padding: '5px 10px', display: 'inline-block' }}>
            Save {fmt(teamSavings * 100)} vs individual T3 pricing for {teamSeats} people
          </div>
        )}

        {activeTier && !activeTier.contact ? (
          <button onClick={() => handleCheckout('team', teamSeats)}
            disabled={loading === 'team'}
            style={{
              padding: '11px 28px', borderRadius: 99,
              border: `1px solid ${C.ruleStrong}`, background: 'none',
              color: C.inkSoft, fontFamily: FONT.display, fontWeight: 700,
              fontSize: 13, cursor: loading === 'team' ? 'wait' : 'pointer',
              transition: 'all 0.15s', opacity: loading === 'team' ? 0.55 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.ink }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.inkSoft; e.currentTarget.style.borderColor = C.ruleStrong }}>
            {loading === 'team' ? 'Redirecting…' : `Get Team License — ${teamSeats} seats →`}
          </button>
        ) : (
          <div>
            <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMute, marginBottom: 10 }}>
              11+ seats — contact us for volume pricing and custom onboarding.
            </div>
            <a href="mailto:admin@luxartmedia.com?subject=Team%20License%20Quote"
              style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 99,
                background: C.ink, color: '#fff', fontFamily: FONT.display,
                fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              Contact us →
            </a>
          </div>
        )}
      </div>

      {/* Trust row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 18, flexWrap: 'wrap', marginTop: 22 }}>
        {['🔒 Secure checkout via Stripe', 'No recurring charges',
          `Access expires Dec 31, ${new Date().getFullYear()}`]
          .map((t, i) => (
            <span key={i} style={{ fontFamily: FONT.body, fontSize: 11, color: C.inkMute }}>
              {i > 0 && <span style={{ marginRight: 18, color: C.rule }}>·</span>}{t}
            </span>
          ))}
      </div>
    </div>
  )
}
