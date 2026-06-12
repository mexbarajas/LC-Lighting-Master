import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PurchaseSuccessBanner from '@/components/PurchaseSuccessBanner'

const PLAN_LABELS = {
  free: 'Free trial',
  t1: 'Test Engine',
  t2: 'Full Course',
  t3: 'Course + Exam',
  team_admin: 'Team Admin',
  team_member: 'Team Member',
}

export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const showSuccess = (await searchParams)?.purchase === 'success'

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, exam_addon')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan || 'free'
  const planLabel = PLAN_LABELS[plan] || plan
  const accessEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : `December 31, ${new Date().getFullYear()}`

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f8f3ec', minHeight: '100vh', padding: '40px 36px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: '#b85835', marginBottom: 8 }}>Welcome back</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 32,
            letterSpacing: '-0.02em', color: '#16120e', lineHeight: 1.1 }}>
            {user.user_metadata?.name?.split(' ')[0] || user.email.split('@')[0]}'s Dashboard
          </h1>
        </div>

        {showSuccess && <PurchaseSuccessBanner />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
          {[
            ['Your plan', planLabel],
            ['Access expires', accessEnd],
            ['Status', sub?.status || 'trial'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: '#fdfaf6', border: '1px solid #e4d9ca',
              borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#8a7a6a', marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: val.length > 14 ? 14 : 20, color: '#16120e', lineHeight: 1.2 }}>{val}</div>
            </div>
          ))}
        </div>

        {plan === 'free' && (
          <div style={{ background: 'rgba(184,88,53,0.06)', border: '1px solid #cfc3b0',
            borderRadius: 10, padding: '20px 22px', marginBottom: 24 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: 14, color: '#b85835', marginBottom: 6 }}>Upgrade to unlock all 12 modules</div>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#8a7a6a',
              margin: '0 0 14px', lineHeight: 1.6 }}>
              Module 01 and 10 practice questions are unlocked in the free trial. Upgrade to access the full course.
            </p>
            <a href="/pricing" style={{ display: 'inline-block', padding: '9px 20px',
              background: '#b85835', color: '#fff', borderRadius: 99,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
              textDecoration: 'none' }}>View pricing →</a>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/" style={{ display: 'inline-block', padding: '9px 20px',
            background: '#16120e', color: '#fff', borderRadius: 99,
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
            textDecoration: 'none' }}>Open course →</a>
          <a href="/pricing" style={{ display: 'inline-block', padding: '9px 20px',
            background: 'none', color: '#352c22', border: '1px solid #cfc3b0', borderRadius: 99,
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
            textDecoration: 'none' }}>Pricing</a>
        </div>
      </div>
    </div>
  )
}
