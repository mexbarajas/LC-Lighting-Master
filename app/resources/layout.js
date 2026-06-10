const siteUrl = 'https://lightingmasterlc.com'

export default function ResourcesLayout({ children }) {
  return (
    <div style={{ background: '#FAF5F0', minHeight: '100vh', fontFamily: "'Inter', 'Geist', sans-serif" }}>

      {/* Header */}
      <header style={{
        background: '#2F4A3F',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img
              src="/brand/logo-transparent.png"
              alt="LC Lighting Master"
              style={{ width: 34, height: 34, flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(250,210,100,0.55)) brightness(1.15)' }}
            />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: '#F2E6DA',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}>LC · Lighting Master</span>
          </a>
          <a href="/pricing" style={{
            background: '#C65A3A',
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            padding: '8px 18px',
            borderRadius: 7,
            textDecoration: 'none',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}>
            Start studying →
          </a>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E8DDD4',
        padding: '28px 24px',
        background: '#FAF5F0',
      }}>
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 24px',
          alignItems: 'center',
        }}>
          <a href="/" style={footerLink}>Home</a>
          <a href="/pricing" style={footerLink}>Pricing</a>
          <a href="/resources" style={footerLink}>Resources</a>
          <a href="/legal/terms" style={footerLink}>Terms</a>
          <a href="mailto:admin@luxartmedia.com" style={footerLink}>admin@luxartmedia.com</a>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#A09080' }}>
            © {new Date().getFullYear()} Luxart LLC
          </span>
        </div>
      </footer>
    </div>
  )
}

const footerLink = {
  fontSize: 13,
  color: '#7E9B86',
  textDecoration: 'none',
  fontFamily: "'Inter', sans-serif",
}
