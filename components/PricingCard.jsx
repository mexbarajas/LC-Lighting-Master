'use client'

import { useState, useCallback } from 'react'
import { getCurrentSeason, getPriceForTier, getTeamPerSeat, TEAM_TIERS, studentPrice } from '@/lib/pricing'

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

export default function PricingCard({ userId, userEmail, isStudent, onContactUs }) {
  const season = getCurrentSeason()
  const [examAddon, setExamAddon] = useState(false)
  const [teamSeats, setTeamSeats] = useState(4)
  const [loading, setLoading] = useState(null)
  const [contactModal, setContactModal] = useState(false)

  const t1Price = getPriceForTier('t1')
  const t2Price = getPriceForTier('t2', 1, examAddon)
  const t3Price = getPriceForTier('t3')
  const teamInfo = getPriceForTier('team', teamSeats) // null for 11+ seats

  const t3IndividualTotal = t3Price.amountCents * teamSeats
  const teamSavings = teamInfo ? t3IndividualTotal - teamInfo.amountCents : null
  const activeTier = getTeamPerSeat(teamSeats)

  const handleCheckout = useCallback(async (tier, seats, addOn) => {
    if (loading) return
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, seats, examAddon: addOn, userId, userEmail }),
      })
      const { url, contactUs } = await res.json()
      if (contactUs) { setContactModal(true); return }
      if (url) window.location.href = url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }, [loading, userId, userEmail])

  // T1 badge by season
  const t1Badge = season.season === 'peak'
    ? { label: 'October prep', color: C.amber, bg: C.amberDim }
    : season.season === 'earlyBird'
    ? { label: 'Early prep', color: C.forest, bg: C.forestDim }
    : { label: 'Year-round', color: C.inkMute, bg: C.rule }

  return (
    <div style={{ fontFamily: FONT.body }}>

      {/* Season banner */}
      {season.banner && (
        <div style={{
          background: C.accentDim, border: `1px solid ${C.ruleStrong}`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent,
            flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.accent, fontWeight: 700 }}>{season.label}</span>
          <span style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkSoft }}>{season.banner}</span>
        </div>
      )}

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
            <Badge {...t1Badge} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 17,
            color: C.ink, marginBottom: 14 }}>Test Engine</div>
          <div style={{ marginBottom: 4 }}>
            {isStudent && (
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.inkMute,
                textDecoration: 'line-through', marginRight: 6 }}>
                {fmt(t1Price.amountCents)}
              </span>
            )}
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
              color: isStudent ? C.forest : C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {isStudent ? fmt(studentPrice(t1Price.amountCents)) : fmt(t1Price.amountCents)}
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginLeft: 6 }}>one-time</span>
            {isStudent && (
              <span style={{ fontFamily: FONT.mono, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '2px 7px', borderRadius: 99, marginLeft: 8,
                color: C.forest, background: C.forestDim }}>STUDENT —40%</span>
            )}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.inkMute, marginBottom: 14 }}>
            Access until Dec 31, {new Date().getFullYear()}
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            Already studied? Use our LC practice engine as your final accuracy check before exam day.
          </p>
          <div style={{ marginBottom: 18 }}>
            {['129 LC practice questions', '13 topic breakdown',
              '25-sec timed exam engine', 'Speed bonuses & streaks', 'Unlimited attempts']
              .map((f, i) => <FeatureRow key={i} item={f} dark={false} />)}
          </div>
          <button onClick={() => handleCheckout('t1', 1, false)}
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
            {loading === 't1' ? 'Redirecting…' : `Get Test Engine — ${fmt(isStudent ? studentPrice(t1Price.amountCents) : t1Price.amountCents)} →`}
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
            color: C.ink, marginBottom: 14 }}>Full Course</div>
          <div style={{ marginBottom: 4 }}>
            {isStudent ? (
              <>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.inkMute,
                  textDecoration: 'line-through', marginRight: 6 }}>
                  {fmt(t2Price.amountCents)}
                </span>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
                  color: C.forest, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(studentPrice(t2Price.amountCents))}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginLeft: 6 }}>one-time</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 99, marginLeft: 8,
                  color: C.forest, background: C.forestDim }}>STUDENT —40%</span>
              </>
            ) : (
              <>
                {season.season === 'earlyBird' && (
                  <span style={{ fontFamily: FONT.mono, fontSize: 12,
                    color: C.inkMute, textDecoration: 'line-through', marginRight: 6 }}>
                    {fmt(49500 + (examAddon ? 20000 : 0))}
                  </span>
                )}
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
                  color: season.season === 'earlyBird' ? C.forest : C.ink,
                  letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(t2Price.amountCents)}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginLeft: 6 }}>one-time</span>
              </>
            )}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.inkMute, marginBottom: 14 }}>
            Access until Dec 31, {new Date().getFullYear()}
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            All 12 modules structured around the LC exam blueprint. Certificate + 24 CEU hours.
          </p>
          <div style={{ marginBottom: 14 }}>
            {['All 12 modules · 74 lessons', 'Audio narration every lesson',
              'Bookmarks & notes hub', 'Certificate of completion', '24 CEU credit hours']
              .map((f, i) => <FeatureRow key={i} item={f} dark={false} />)}
          </div>
          {/* Exam add-on toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: examAddon ? C.accentDim : C.creamWarm,
            border: `1px solid ${examAddon ? C.accent : C.rule}`,
            borderRadius: 8, cursor: 'pointer', marginBottom: 14,
            transition: 'all 0.15s',
          }}>
            <input type="checkbox" checked={examAddon} onChange={e => setExamAddon(e.target.checked)}
              style={{ accentColor: C.accent, width: 14, height: 14, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 12,
                color: C.ink }}>+$200 — Add Exam Engine</div>
              <div style={{ fontFamily: FONT.body, fontSize: 10.5, color: C.inkMute, marginTop: 1 }}>
                129 practice questions, unlimited attempts
              </div>
            </div>
          </label>
          <button onClick={() => handleCheckout('t2', 1, examAddon)}
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
            {loading === 't2' ? 'Redirecting…' : `Enroll in Full Course — ${fmt(isStudent ? studentPrice(t2Price.amountCents) : t2Price.amountCents)} →`}
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
            color: '#fff', marginBottom: 14 }}>Course + Exam</div>
          <div style={{ marginBottom: 4 }}>
            {isStudent ? (
              <>
                <span style={{ fontFamily: FONT.mono, fontSize: 12,
                  color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', marginRight: 6 }}>
                  {fmt(t3Price.amountCents)}
                </span>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
                  color: '#7ecb9e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(studentPrice(t3Price.amountCents))}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10,
                  color: 'rgba(255,255,255,0.38)', marginLeft: 6 }}>one-time</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 99, marginLeft: 8,
                  color: '#7ecb9e', background: 'rgba(126,203,158,0.12)' }}>STUDENT —40%</span>
              </>
            ) : (
              <>
                {season.season === 'earlyBird' && (
                  <span style={{ fontFamily: FONT.mono, fontSize: 12,
                    color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', marginRight: 6 }}>
                    {fmt(69500)}
                  </span>
                )}
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36,
                  color: season.season === 'earlyBird' ? '#7ecb9e' : '#fff',
                  letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(t3Price.amountCents)}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10,
                  color: 'rgba(255,255,255,0.38)', marginLeft: 6 }}>one-time</span>
              </>
            )}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11,
            color: 'rgba(255,255,255,0.38)', marginBottom: 8 }}>
            Price: $595–$695 depending on season
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11,
            color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>
            Access until Dec 31, {new Date().getFullYear()}
          </div>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: 'rgba(255,255,255,0.55)',
            margin: '0 0 14px', lineHeight: 1.65, flex: 1 }}>
            The complete package — all 12 modules plus the LC practice exam bundled together.
          </p>
          <div style={{ marginBottom: 18 }}>
            {['Everything in Full Course', 'Exam engine bundled',
              '129 LC practice questions', 'Unlimited exam attempts',
              'Topic accuracy analytics', 'Priority support']
              .map((f, i) => <FeatureRow key={i} item={f} dark={true} />)}
          </div>
          <button onClick={() => handleCheckout('t3', 1, false)}
            disabled={loading === 't3'}
            style={{
              width: '100%', padding: '12px', borderRadius: 99,
              border: 'none', background: C.accent, color: '#fff',
              fontFamily: FONT.display, fontWeight: 700, fontSize: 13,
              cursor: loading === 't3' ? 'wait' : 'pointer',
              transition: 'opacity 0.15s', opacity: loading === 't3' ? 0.55 : 1,
            }}>
            {loading === 't3' ? 'Redirecting…' : `Enroll + Exam Prep — ${fmt(isStudent ? studentPrice(t3Price.amountCents) : t3Price.amountCents)} →`}
          </button>
        </div>
      </div>

      {/* Student discount banner — always visible */}
      <div style={{
        background: isStudent ? C.forestDim : C.creamWarm,
        border: `1px solid ${isStudent ? C.forest : C.rule}`,
        borderRadius: 10, padding: '18px 20px', marginBottom: 24,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.forest, fontWeight: 700, marginBottom: 6 }}>
          🎓 Student Discount
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 15,
          color: C.ink, marginBottom: 6 }}>
          Studying lighting in school? Take 40% off.
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkMute,
          lineHeight: 1.6, marginBottom: isStudent ? 8 : 14 }}>
          Sign up with your .edu email address and the discount applies automatically at checkout — no code needed.
          Valid on all individual plans.
        </div>
        {isStudent ? (
          <div style={{ fontFamily: FONT.body, fontSize: 12, color: C.forest }}>
            ✓ Student discount active — your .edu address qualifies for 40% off.
          </div>
        ) : (
          <a href="/login" style={{
            fontFamily: FONT.display, fontWeight: 700, fontSize: 12,
            color: C.forest, textDecoration: 'none',
            borderBottom: `1px solid ${C.forest}`, paddingBottom: 1,
          }}>
            Create account with your .edu email →
          </a>
        )}
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
          Enroll your studio. Includes all Tier 3 content for each seat.
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
              onClick={() => setTeamSeats(s => Math.max(2, s - 1))}
              style={{ width: 36, height: 36, border: 'none', background: C.cream,
                cursor: 'pointer', fontFamily: FONT.display, fontSize: 16, color: C.inkSoft }}>
              −
            </button>
            <input type="number" min={2} max={50} value={teamSeats}
              onChange={e => setTeamSeats(Math.max(2, Math.round(Number(e.target.value) || 2)))}
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
          {teamInfo && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkMute, marginBottom: 2 }}>
                {teamSeats} seats × ${activeTier.perSeat} =
              </div>
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 24,
                color: C.ink, letterSpacing: '-0.02em' }}>
                ${teamSeats * activeTier.perSeat}
              </span>
            </div>
          )}
        </div>

        {teamInfo && teamSavings > 0 && (
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: C.forest,
            marginBottom: 14, background: C.forestDim, borderRadius: 6,
            padding: '5px 10px', display: 'inline-block' }}>
            Save {fmt(teamSavings)} vs individual T3 pricing for {teamSeats} people
          </div>
        )}

        {!activeTier.contact ? (
          <button onClick={() => handleCheckout('team', teamSeats, false)}
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
              11+ seats — enterprise rates available.
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

      {/* Contact modal */}
      {contactModal && (
        <div onClick={() => setContactModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(22,18,14,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.cream, borderRadius: 16, padding: '32px 36px',
              maxWidth: 400, width: '90%', textAlign: 'center',
              border: `1px solid ${C.rule}` }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 20,
              color: C.ink, marginBottom: 10 }}>Enterprise pricing</div>
            <p style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMute,
              lineHeight: 1.6, marginBottom: 20 }}>
              For 10+ seats, contact us for volume pricing and custom onboarding.
            </p>
            <a href="mailto:admin@luxartmedia.com"
              style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 99,
                background: C.accent, color: '#fff', fontFamily: FONT.display,
                fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              admin@luxartmedia.com →
            </a>
            <button onClick={() => setContactModal(false)}
              style={{ display: 'block', margin: '14px auto 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: FONT.body, fontSize: 12, color: C.inkMute }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
