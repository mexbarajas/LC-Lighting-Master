export const metadata = {
  title: 'Cookie Policy | LC Lighting Master',
  description: 'Cookie policy for LC Lighting Master by Luxart LLC.',
}

export default function CookiesPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px',
      fontFamily: 'sans-serif', color: '#2F4A3F', background: '#FAF5F0',
      minHeight: '100vh' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#C65A3A', marginBottom: 12 }}>Luxart LLC</p>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Cookie Policy</h1>
      <p style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 40 }}>
        LC · Lighting Master · Effective June 1, 2026</p>
      {[
        { title: '1. What Are Cookies', body: 'Cookies are small text files stored on your device when you visit a website. LC · Lighting Master uses cookies and similar technologies to authenticate sessions, remember preferences, and analyze usage.' },
        { title: '2. Cookies We Use', body: 'Authentication cookies (Supabase): required for login and session management. These are session cookies deleted when you close your browser. Analytics cookies (Google Analytics): anonymous usage data to improve the platform. You can opt out via browser settings or the Google Analytics opt-out extension.' },
        { title: '3. Third-Party Cookies', body: 'Stripe sets cookies during the checkout process for fraud prevention and payment security. Cloudinary may set performance cookies when serving media assets. We do not control third-party cookies.' },
        { title: '4. Managing Cookies', body: 'You can disable cookies in your browser settings. Note that disabling authentication cookies will prevent you from logging in to LC · Lighting Master.' },
        { title: '5. Contact', body: 'Questions? Email admin@luxartmedia.com' },
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
