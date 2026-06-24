'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Design tokens (match LcApp.jsx) ──────────────────────────────────────────
const C = {
  ink:      '#16120e',
  inkMute:  '#6b5f52',
  accent:   '#e8a020',
  forest:   '#2a6048',
  paper:    '#fdfaf6',
  cream:    '#f5f0e8',
  rule:     '#e4d9ca',
  red:      '#cc3344',
  blue:     '#1857a0',
}
const F = { display: 'Playfair Display, serif', body: 'Inter, sans-serif', mono: 'JetBrains Mono, monospace' }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => n ?? 0
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100))
const dateStr = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const scoreColor = (s) => s >= 85 ? C.forest : s >= 70 ? C.accent : C.red

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, padding: '20px 24px', minWidth: 140 }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: accent ?? C.ink, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }) {
  const colors = {
    active:      { bg: '#e8f5ee', text: C.forest },
    deactivated: { bg: '#fde8ec', text: C.red },
    pending:     { bg: '#fff7e6', text: '#b86a00' },
  }
  const s = colors[color] ?? colors.active
  return (
    <span style={{ background: s.bg, color: s.text, fontFamily: F.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px', fontWeight: 600 }}>
      {label}
    </span>
  )
}

function ProgressBar({ pct: p }) {
  return (
    <div style={{ background: C.rule, borderRadius: 99, height: 6, width: 120, overflow: 'hidden' }}>
      <div style={{ background: p >= 100 ? C.forest : C.accent, width: `${Math.min(p, 100)}%`, height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
    </div>
  )
}

// ── Warning Modal ─────────────────────────────────────────────────────────────
function ReassignWarningModal({ email, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,18,14,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.paper, borderRadius: 10, padding: 36, maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.red, marginBottom: 12 }}>⚠ License Reassignment Fee</div>
        <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink, margin: '0 0 12px', lineHeight: 1.2 }}>
          Reassigning an active license costs <span style={{ color: C.red }}>$100</span>
        </h2>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, lineHeight: 1.6, margin: '0 0 8px' }}>
          All purchased seats are currently active. Reassigning <strong>{email}</strong> to an occupied seat will deactivate the current holder and charge a $100 reassignment fee.
        </p>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, lineHeight: 1.5, margin: '0 0 24px' }}>
          To avoid this fee, first deactivate a member to free their seat, then invite the new member.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, fontFamily: F.display, fontWeight: 600, fontSize: 14, background: C.cream, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '11px 0', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, fontFamily: F.display, fontWeight: 700, fontSize: 14, background: C.red, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 0', cursor: 'pointer' }}>
            Pay $100 & Reassign
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────
function DeactivateModal({ member, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,18,14,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.paper, borderRadius: 10, padding: 36, maxWidth: 420, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.red, marginBottom: 12 }}>Deactivate License</div>
        <h2 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>
          Remove {member.display_name || member.email}?
        </h2>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, lineHeight: 1.6, margin: '0 0 24px' }}>
          This will immediately revoke their course and exam access. Their seat becomes available to reassign. This action cannot be undone without a $100 reassignment fee if all seats are later filled.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, fontFamily: F.display, fontWeight: 600, fontSize: 14, background: C.cream, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '11px 0', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, fontFamily: F.display, fontWeight: 700, fontSize: 14, background: C.red, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 0', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ onClose, onSuccess, availableSeats, teamId }) {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showReassign, setShowReassign] = useState(false)

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/team/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, ...(teamId ? { team_id: teamId } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.seats_full && data.can_reassign) {
          setShowReassign(true)
          setLoading(false)
          return
        }
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }
      onSuccess(`Invitation sent to ${trimmed}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showReassign) {
    return (
      <ReassignWarningModal
        email={email.trim().toLowerCase()}
        onCancel={() => setShowReassign(false)}
        onConfirm={() => {
          setShowReassign(false)
          // Reassignment requires Stripe payment — redirect to checkout
          // TODO: wire to /api/stripe/checkout with type=reassignment when Stripe product is ready
          alert('Reassignment payment flow coming soon. To avoid the $100 fee, deactivate a member first to free their seat.')
        }}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,18,14,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.paper, borderRadius: 10, padding: 36, maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>Assign License</div>
        <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>Invite a team member</h2>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, margin: '0 0 24px', lineHeight: 1.5 }}>
          {availableSeats > 0
            ? `${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available. They will receive an email with a link to activate their account.`
            : 'All seats are currently in use. Deactivate a member first to free a seat.'}
        </p>
        {availableSeats > 0 && (
          <>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="colleague@company.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', fontFamily: F.body, fontSize: 14, padding: '11px 14px', border: `1px solid ${error ? C.red : C.rule}`, borderRadius: 6, background: C.cream, color: C.ink, boxSizing: 'border-box', marginBottom: error ? 8 : 20, outline: 'none' }}
            />
            {error && <p style={{ fontFamily: F.body, fontSize: 13, color: C.red, margin: '0 0 16px' }}>{error}</p>}
          </>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, fontFamily: F.display, fontWeight: 600, fontSize: 14, background: C.cream, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, padding: '11px 0', cursor: 'pointer' }}>
            Cancel
          </button>
          {availableSeats > 0 && (
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, fontFamily: F.display, fontWeight: 700, fontSize: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 0', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send Invitation →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Member Detail Drawer ──────────────────────────────────────────────────────
function MemberDrawer({ member, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const TOTAL_LESSONS = 72

  useEffect(() => {
    fetch(`/api/team/members/${member.member_id}/scores`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [member.member_id])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,18,14,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
      <div style={{ background: C.paper, width: '100%', maxWidth: 520, height: '100vh', overflowY: 'auto', boxShadow: '-4px 0 32px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 6 }}>Member detail</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.ink }}>{member.display_name || member.email}</div>
            <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, marginTop: 2 }}>{member.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.inkMute, padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: F.body, color: C.inkMute }}>Loading…</div>
        ) : (
          <div style={{ padding: '24px 28px', flex: 1 }}>
            {/* Status + License */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <Badge label={member.status} color={member.status} />
              <Badge label={member.license_type === 'course_exam' ? 'Course + Exam' : 'Course Only'} color="active" />
              {member.has_exam_access && <Badge label="Exam Access" color="active" />}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 }}>Course Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <ProgressBar pct={pct(member.lessons_completed, TOTAL_LESSONS)} />
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: C.ink }}>{pct(member.lessons_completed, TOTAL_LESSONS)}%</span>
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute }}>{fmt(member.lessons_completed)} of {TOTAL_LESSONS} lessons completed</div>
              {member.last_exam_at && (
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, marginTop: 4 }}>Last activity: {dateStr(member.last_exam_at)}</div>
              )}
            </div>

            {/* Exam History */}
            {member.has_exam_access && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 }}>
                  Exam History ({fmt(member.exam_attempts)}/5 attempts used)
                </div>
                {(!detail?.exam_sessions?.length) ? (
                  <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, fontStyle: 'italic' }}>No exam attempts yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detail.exam_sessions.map((s, i) => {
                      const scorePct = pct(s.correct_count, s.questions_attempted)
                      return (
                        <div key={s.id} style={{ background: C.cream, borderRadius: 6, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.ink }}>Attempt {detail.exam_sessions.length - i}</div>
                            <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 2 }}>{dateStr(s.completed_at)} · {s.correct_count}/{s.questions_attempted} correct</div>
                          </div>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: scoreColor(scorePct) }}>{scorePct}%</div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {fmt(member.exam_attempts) >= 5 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#fde8ec', borderRadius: 6, fontFamily: F.body, fontSize: 13, color: C.red }}>
                    This member has used all 5 exam attempts.
                  </div>
                )}
              </div>
            )}

            {/* Lesson Progress List */}
            {detail?.progress?.length > 0 && (
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 }}>Recent Lessons Completed</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {detail.progress.slice(0, 20).map((p) => (
                    <div key={p.lesson_ref} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.body, fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.rule}` }}>
                      <span style={{ color: C.ink }}>Lesson {p.lesson_ref}</span>
                      <span style={{ color: C.inkMute }}>{dateStr(p.completed_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main TeamPortal Component ─────────────────────────────────────────────────
export default function TeamPortal({ teamId = null, isAdminView = false }) {
  const [stats, setStats]               = useState(null)
  const [members, setMembers]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [showAssign, setShowAssign]     = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deactivating, setDeactivating] = useState(false)
  const [toast, setToast]               = useState('')
  const [filter, setFilter]             = useState('all') // all | active | pending | deactivated

  const TOTAL_LESSONS = 72

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const q = teamId ? `?team_id=${teamId}` : ''
      const [statsRes, membersRes] = await Promise.all([
        fetch(`/api/team/stats${q}`),
        fetch(`/api/team/members${q}`),
      ])
      const [statsData, membersData] = await Promise.all([
        statsRes.json(),
        membersRes.json(),
      ])
      if (statsData.stats) setStats(statsData.stats)
      if (membersData.members) setMembers(membersData.members)
      if (statsData.pending_invites) {
        // Merge pending invites as virtual rows for display
        setStats(s => s ? { ...s, pending_invites_list: statsData.pending_invites } : s)
      }
    } catch {
      setError('Failed to load team data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { loadData() }, [loadData])

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      const res = await fetch(`/api/team/members/${deactivateTarget.member_id}/deactivate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to deactivate member.')
      } else {
        showToast(`${deactivateTarget.display_name || deactivateTarget.email} has been deactivated.`)
        setDeactivateTarget(null)
        await loadData()
      }
    } catch {
      showToast('Network error. Please try again.')
    } finally {
      setDeactivating(false)
    }
  }

  const activeMembers      = members.filter(m => m.status === 'active')
  const deactivatedMembers = members.filter(m => m.status === 'deactivated')
  const pendingInvites     = stats?.pending_invites_list ?? []
  const availableSeats     = stats ? (fmt(stats.available_seats)) : 0

  const filteredMembers = filter === 'all'
    ? members
    : filter === 'active'
    ? activeMembers
    : filter === 'deactivated'
    ? deactivatedMembers
    : members

  if (loading) {
    return (
      <div style={{ padding: '60px 36px', textAlign: 'center', fontFamily: F.body, color: C.inkMute }}>
        Loading team portal…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '60px 36px', textAlign: 'center', fontFamily: F.body, color: C.red }}>
        {error}
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: '60px 36px', textAlign: 'center' }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 12 }}>No team found</div>
        <div style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute }}>You are not associated with a team. Contact your administrator.</div>
      </div>
    )
  }

  const planLabel     = stats.plan_type === 'course_only' ? 'Course Only' : 'Course + Exam'
  const seatsTotal    = fmt(stats.seats_purchased)
  const expiryDate    = dateStr(stats.access_expiry)
  const isExpiringSoon = stats.access_expiry && new Date(stats.access_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return (
    <div style={{ padding: '0 36px 60px', maxWidth: 1100 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: '#fff', fontFamily: F.body, fontSize: 14, padding: '12px 24px', borderRadius: 8, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '40px 0 28px', borderBottom: `1px solid ${C.rule}`, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>Team Manager</div>
          <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.1 }}>
            Team <em style={{ fontStyle: 'normal', color: C.accent }}>Portal.</em>
          </h1>
          <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, marginTop: 8 }}>
            {planLabel} · {seatsTotal} seats · Expires {expiryDate}
            {isExpiringSoon && <span style={{ color: C.red, marginLeft: 8 }}>⚠ Expiring soon</span>}
          </div>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '13px 24px', cursor: 'pointer' }}
        >
          + Assign License
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard label="Active Licenses"      value={fmt(stats.active_licenses)}  sub={`of ${seatsTotal} seats`} accent={C.forest} />
        <StatCard label="Pending Activations"  value={pendingInvites.length}        sub="awaiting acceptance" />
        <StatCard label="Available Seats"      value={fmt(stats.available_seats)}   sub="ready to assign"  accent={availableSeats > 0 ? C.blue : C.inkMute} />
        <StatCard label="Deactivated"          value={fmt(stats.deactivated)}       sub="licenses revoked" />
      </div>

      {/* No members yet */}
      {activeMembers.length === 0 && pendingInvites.length === 0 && (
        <div style={{ background: C.paper, border: `1px dashed ${C.rule}`, borderRadius: 8, padding: '40px 36px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 8 }}>No team members yet</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, marginBottom: 20 }}>Start by assigning licenses to your team members.</div>
          <button onClick={() => setShowAssign(true)} style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 22px', cursor: 'pointer' }}>
            Assign First License →
          </button>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 }}>Pending Invitations ({pendingInvites.length})</div>
          <div style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: 'hidden' }}>
            {pendingInvites.map((inv, i) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < pendingInvites.length - 1 ? `1px solid ${C.rule}` : 'none' }}>
                <div>
                  <div style={{ fontFamily: F.body, fontSize: 14, color: C.ink, fontWeight: 500 }}>{inv.email}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 2 }}>Sent {dateStr(inv.invited_at)} · Expires {dateStr(inv.expires_at)}</div>
                </div>
                <Badge label="Pending" color="pending" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Table */}
      {members.length > 0 && (
        <div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['active', 'Active'], ['deactivated', 'Deactivated']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  fontFamily: F.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 99, cursor: 'pointer', border: '1px solid',
                  borderColor: filter === val ? C.accent : C.rule,
                  background: filter === val ? C.accent : 'transparent',
                  color: filter === val ? '#fff' : C.inkMute,
                  fontWeight: 600,
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 120px', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${C.rule}`, background: C.cream }}>
              {['Member', 'License', 'Status', 'Progress', 'Exam Attempts', 'Actions'].map(h => (
                <div key={h} style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, fontWeight: 600 }}>{h}</div>
              ))}
            </div>

            {filteredMembers.length === 0 ? (
              <div style={{ padding: '28px 20px', fontFamily: F.body, fontSize: 14, color: C.inkMute, textAlign: 'center' }}>
                No members in this category.
              </div>
            ) : (
              filteredMembers.map((m, i) => {
                const lessonPct = pct(fmt(m.lessons_completed), TOTAL_LESSONS)
                const isLast    = i === filteredMembers.length - 1
                const attempts  = fmt(m.exam_attempts)
                const attemptsColor = attempts >= 5 ? C.red : attempts >= 4 ? C.accent : C.ink

                return (
                  <div
                    key={m.member_id}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 120px', gap: 0, padding: '14px 20px', borderBottom: isLast ? 'none' : `1px solid ${C.rule}`, alignItems: 'center', background: m.status === 'deactivated' ? '#fafaf8' : 'transparent' }}
                  >
                    {/* Member */}
                    <div>
                      <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 500, color: m.status === 'deactivated' ? C.inkMute : C.ink }}>
                        {m.display_name || '—'}
                      </div>
                      <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute }}>{m.email}</div>
                    </div>

                    {/* License */}
                    <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute }}>
                      {m.license_type === 'course_exam' ? 'Course + Exam' : 'Course Only'}
                      {m.member_exam_add_on_paid && (
                        <div style={{ color: C.forest, fontSize: 11, marginTop: 2 }}>+ $99 add-on</div>
                      )}
                    </div>

                    {/* Status */}
                    <div><Badge label={m.status} color={m.status} /></div>

                    {/* Progress */}
                    <div>
                      <ProgressBar pct={lessonPct} />
                      <div style={{ fontFamily: F.body, fontSize: 11, color: C.inkMute, marginTop: 4 }}>{lessonPct}% · {fmt(m.lessons_completed)}/72</div>
                    </div>

                    {/* Exam Attempts */}
                    <div>
                      {m.has_exam_access ? (
                        <div>
                          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: attemptsColor }}>{attempts}</span>
                          <span style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute }}>/5</span>
                          {m.best_score != null && (
                            <div style={{ fontFamily: F.body, fontSize: 11, color: scoreColor(pct(m.best_score, 180)), marginTop: 2 }}>
                              Best: {pct(m.best_score, 180)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute }}>No exam access</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setSelectedMember(m)}
                        style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.1em', background: 'none', border: `1px solid ${C.rule}`, borderRadius: 4, padding: '5px 10px', cursor: 'pointer', color: C.ink }}
                      >
                        View
                      </button>
                      {m.status === 'active' && m.role !== 'team_admin' && (
                        <button
                          onClick={() => setDeactivateTarget(m)}
                          style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.1em', background: 'none', border: `1px solid ${C.red}`, borderRadius: 4, padding: '5px 10px', cursor: 'pointer', color: C.red }}
                        >
                          Remove
                        </button>
                      )}
                      {isAdminView && m.status === 'deactivated' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Reactivate ${m.display_name || m.email}?`)) return
                            const res = await fetch(`/api/team/members/${m.member_id}/reactivate`, { method: 'POST' })
                            let d = {}; try { d = await res.json() } catch {}
                            if (!res.ok) showToast(d.error || 'Failed to reactivate.')
                            else { showToast('Member reactivated.'); loadData() }
                          }}
                          style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.1em', background: 'none', border: '1px solid #2a6048', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', color: '#2a6048' }}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAssign && (
        <AssignModal
          availableSeats={availableSeats}
          teamId={teamId}
          onClose={() => setShowAssign(false)}
          onSuccess={(msg) => { setShowAssign(false); showToast(msg); loadData() }}
        />
      )}
      {selectedMember && (
        <MemberDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
      {deactivateTarget && (
        <DeactivateModal
          member={deactivateTarget}
          loading={deactivating}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  )
}
