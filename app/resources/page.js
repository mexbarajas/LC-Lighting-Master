const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'Lighting Certification Resources & NCQLP Exam Guides | LC Lighting Master',
  description: 'Free guides, study tips, and practice questions for the NCQLP Lighting Certified (LC) exam. Learn exam dates, eligibility, study strategies, and more.',
  alternates: { canonical: siteUrl + '/resources' },
  openGraph: {
    title: 'Lighting Certification Resources & NCQLP Exam Guides | LC Lighting Master',
    description: 'Free guides for the NCQLP LC exam — dates, eligibility, study strategies, practice questions, and certification comparisons.',
    url: siteUrl + '/resources',
  },
}

const articles = [
  {
    slug: 'what-is-the-ncqlp-lc-exam',
    title: 'What Is the NCQLP LC Exam? Complete 2026 Guide',
    description: 'Everything you need to know about the Lighting Certified credential — eligibility paths, exam structure, 13 topic areas, cost, and renewal.',
  },
  {
    slug: 'ncqlp-exam-dates-2026',
    title: 'NCQLP Exam Dates 2026: Registration Deadlines & Key Timeline',
    description: 'The 2026 exam window runs Oct 14 – Nov 22. See registration deadlines, a month-by-month study plan, and tips for pacing your preparation.',
  },
  {
    slug: 'how-to-become-lighting-certified',
    title: 'How to Become Lighting Certified (LC): Step-by-Step Path',
    description: 'A practical five-step walkthrough from verifying eligibility through sitting the exam — including what the LC credential adds to your career.',
  },
  {
    slug: 'lighting-certifications-compared',
    title: 'Lighting Certifications Compared: LC vs CLEP vs LEED AP vs WELL AP',
    description: 'An honest comparison of the major lighting and building credentials — which fits your career path and why they complement rather than compete.',
  },
  {
    slug: 'ncqlp-practice-questions',
    title: 'NCQLP Practice Questions: 10 Free LC Exam Sample Questions',
    description: '10 original multiple-choice questions in NCQLP style with full answer explanations. Topics include photometry, controls, energy codes, and more.',
  },
  {
    slug: 'ncqlp-study-guide',
    title: 'NCQLP Study Guide 2026: The 12 Topics You Must Master',
    description: 'A domain-by-domain breakdown of the LC exam blueprint — what each section tests, how much weight it carries, and how to study efficiently.',
  },
]

export default function ResourcesIndex() {
  return (
    <>
      <div style={{ marginBottom: 48 }}>
        <p style={eyebrow}>Free Resources</p>
        <h1 style={h1Style}>NCQLP Lighting Certification Guides</h1>
        <p style={leadStyle}>
          Free guides written for lighting professionals preparing for the NCQLP Lighting
          Certified (LC) exam. Covering exam structure, 2026 dates, study strategy, and
          sample practice questions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {articles.map((a) => (
          <a key={a.slug} href={`/resources/${a.slug}`} style={cardStyle}>
            <h2 style={cardTitle}>{a.title}</h2>
            <p style={cardDesc}>{a.description}</p>
            <span style={readMore}>Read article →</span>
          </a>
        ))}
      </div>

      <div style={ctaBox}>
        <p style={{ margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F' }}>
          Ready to start studying?
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 15, color: '#5A6B5E', lineHeight: 1.6 }}>
          74 structured lessons, 129 timed practice questions, 24 CEU hours. Self-paced. Built for North American lighting professionals.
        </p>
        <a href="/pricing" style={ctaBtn}>See plans & pricing →</a>
      </div>
    </>
  )
}

const eyebrow = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#C65A3A',
  margin: '0 0 12px',
}

const h1Style = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 'clamp(28px, 5vw, 40px)',
  color: '#2F4A3F',
  margin: '0 0 16px',
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
}

const leadStyle = {
  fontSize: 17,
  color: '#4A5C50',
  lineHeight: 1.8,
  margin: 0,
  maxWidth: 640,
}

const cardStyle = {
  display: 'block',
  background: '#fff',
  border: '1px solid #E8DDD4',
  borderRadius: 10,
  padding: '22px 26px',
  textDecoration: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const cardTitle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 18,
  color: '#2F4A3F',
  margin: '0 0 8px',
  lineHeight: 1.3,
}

const cardDesc = {
  fontSize: 14,
  color: '#6B7C70',
  lineHeight: 1.65,
  margin: '0 0 12px',
}

const readMore = {
  fontSize: 13,
  color: '#C65A3A',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
}

const ctaBox = {
  marginTop: 56,
  background: '#F2E6DA',
  border: '1px solid #DDD0C4',
  borderRadius: 12,
  padding: '28px 32px',
}

const ctaBtn = {
  display: 'inline-block',
  background: '#C65A3A',
  color: '#fff',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  padding: '10px 22px',
  borderRadius: 7,
  textDecoration: 'none',
}
