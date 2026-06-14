export const metadata = {
  title: 'Refund Policy | LC Lighting Master',
  description: 'Refund policy for LC Lighting Master by Luxart LLC.',
}

export default function RefundPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px',
      fontFamily: 'sans-serif', color: '#2F4A3F', background: '#FAF5F0',
      minHeight: '100vh' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#C65A3A', marginBottom: 12 }}>Luxart LLC</p>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Refund Policy</h1>
      <p style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 40 }}>
        LC · Lighting Master · Effective June 1, 2026</p>
      {[
        { title: '1. One-Time Payment', body: 'All purchases on LC · Lighting Master are one-time payments. There are no subscriptions, recurring charges, or automatic renewals.' },
        { title: '2. Access Period', body: 'Access to purchased content expires on December 31 of the calendar year in which the purchase was made. This is not a rolling 12-month period from the purchase date.' },
        { title: '3. Refund Eligibility', body: 'Individual plan purchases (T1, T2, T3) are eligible for a full refund within 14 days of purchase, provided fewer than 3 lessons have been completed. To request a refund, email admin@luxartmedia.com with your purchase email and order reference.' },
        { title: '4. Non-Refundable Purchases', body: 'Team licenses are non-refundable once activated. Purchases made after November 1 are non-refundable as they include access through December 31 of the following year. Purchases where more than 3 lessons have been completed are non-refundable.' },
        { title: '5. Processing', body: 'Approved refunds are processed within 5–10 business days. Stripe processing fees (approximately 2.9% + $0.30) are non-recoverable and will be deducted from the refunded amount.' },
        { title: '6. Contact', body: 'Questions about this policy? Email admin@luxartmedia.com' },
      ].map(s => (
        <div key={s.title} style={{ marginBottom: 32, paddingBottom: 32,
          borderBottom: '1px solid rgba(22,18,14,0.08)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>{s.title}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0, color: '#3D5C50' }}>{s.body}</p>
        </div>
      ))}
    </div>
  )
}
