const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'What Is the NCQLP LC Exam? Complete 2026 Guide | LC Lighting Master',
  description: 'Learn what the NCQLP Lighting Certified (LC) exam is, who it\'s for, the 13 topic areas, eligibility requirements, exam dates, cost, and how to renew the credential.',
  alternates: { canonical: siteUrl + '/resources/what-is-the-ncqlp-lc-exam' },
  openGraph: {
    title: 'What Is the NCQLP LC Exam? Complete 2026 Guide',
    description: 'Eligibility, exam structure, 13 topic areas, registration cost, and CEU renewal for the NCQLP Lighting Certified credential.',
    url: siteUrl + '/resources/what-is-the-ncqlp-lc-exam',
  },
}

export default function Article() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Is the NCQLP LC Exam? Complete 2026 Guide',
    description: metadata.description,
    url: siteUrl + '/resources/what-is-the-ncqlp-lc-exam',
    publisher: { '@type': 'Organization', name: 'Luxart LLC', url: siteUrl },
    author: { '@type': 'Organization', name: 'Luxart LLC' },
    datePublished: '2025-01-01',
    dateModified: '2026-01-01',
    mainEntityOfPage: siteUrl + '/resources/what-is-the-ncqlp-lc-exam',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p style={eyebrow}>NCQLP Overview</p>
      <h1 style={h1Style}>What Is the NCQLP LC Exam? Complete 2026 Guide</h1>
      <p style={meta}>Updated January 2026 · 8 min read</p>

      <p style={body}>
        The <strong>NCQLP Lighting Certified (LC)</strong> exam is the gold standard credential for
        lighting professionals in North America. Administered by the National Council on
        Qualifications for the Lighting Professions, the LC designation signals that you have
        demonstrated mastery across the full breadth of lighting practice — from photometry and
        LED technology to energy codes, controls, and design process.
      </p>

      <h2 style={h2Style}>What Is the NCQLP?</h2>
      <p style={body}>
        The National Council on Qualifications for the Lighting Professions is an independent
        non-profit organization that has been credentialing lighting professionals since 1991. Its
        mission is to elevate the quality of lighting practice by establishing a rigorous,
        objective standard through a nationally recognized examination. The NCQLP is not affiliated
        with any manufacturer or trade association, which gives the LC credential independent
        credibility in the marketplace.
      </p>
      <p style={body}>
        The Council partners with Prometric testing centers across the United States and Canada to
        deliver the exam annually. Earning the LC means you have been assessed by a neutral third
        party against an industry-defined blueprint — not just a vendor's training program.
      </p>

      <h2 style={h2Style}>Exam Structure: What to Expect</h2>
      <p style={body}>
        The LC exam consists of approximately <strong>150 multiple-choice questions</strong> administered
        over a timed session at a Prometric testing center. Questions are drawn from <strong>13 topic
        areas</strong> that align with what practicing lighting professionals encounter daily:
      </p>
      <ol style={{ ...body, paddingLeft: 22, lineHeight: 2 }}>
        <li>Lighting Science and Color Theory</li>
        <li>Light Sources and LED Technology</li>
        <li>Photometry and IES File Standards</li>
        <li>Lighting Controls and Dimming Systems</li>
        <li>Energy Codes (ASHRAE 90.1, Title 24, IECC)</li>
        <li>Exterior and Roadway Lighting</li>
        <li>Emergency and Exit Lighting (NFPA 101)</li>
        <li>Daylighting and Daylight Integration</li>
        <li>Circadian and Human-Centric Lighting</li>
        <li>Lighting Design Process and Documentation</li>
        <li>Lighting Economics and Life-Cycle Analysis</li>
        <li>Sustainability and Green Building Credits (LEED, WELL)</li>
        <li>Commercial and Specialty Lighting Applications</li>
      </ol>
      <p style={body}>
        No single topic dominates the exam. Candidates who study narrowly — memorizing LED specs
        while neglecting controls or energy codes — consistently underperform. The exam rewards
        broad, integrated understanding.
      </p>

      <h2 style={h2Style}>Eligibility Requirements</h2>
      <p style={body}>
        The NCQLP uses a combination of education and professional experience to determine
        eligibility. You must accumulate a minimum number of qualifying points across three
        categories: formal education, professional experience, and elective credits (CEUs,
        publications, teaching, etc.).
      </p>
      <p style={body}>
        Common eligibility paths include: a four-year accredited degree in architecture,
        engineering, or a lighting-related field combined with two or more years of professional
        lighting experience; a two-year technical degree with four or more years of experience;
        or eight or more years of qualifying experience without a degree. The NCQLP publishes
        a detailed point table on its website — reviewing it before registering ensures you
        will not be disqualified on a technicality.
      </p>

      <h2 style={h2Style}>2026 Exam Window and Registration Cost</h2>
      <p style={body}>
        The 2026 exam window runs <strong>October 14 – November 22</strong> at Prometric
        testing centers. Registration typically opens in spring, with an early-bird deadline
        in August and a standard deadline in September. Late registration is generally not
        available, so candidates who miss the standard deadline must wait until the following year.
      </p>
      <p style={body}>
        Registration fees are in the range of $400–$500 for first-time candidates and slightly
        lower for re-takes. The NCQLP periodically adjusts fees, so confirm the current amount
        on the official NCQLP website when you register. Fees are non-refundable once the
        registration window has closed, which makes adequate preparation — not wishful thinking —
        the responsible approach.
      </p>

      <h2 style={h2Style}>Credential Maintenance: CEU Renewal Every 3 Years</h2>
      <p style={body}>
        The LC credential does not last forever. Lighting technology and codes evolve rapidly,
        and the NCQLP requires credential holders to earn <strong>continuing education units
        (CEUs)</strong> to maintain their designation. The renewal cycle is every three years,
        with a minimum number of CEU hours required from approved providers.
      </p>
      <p style={body}>
        Completing the full LC · Lighting Master course earns 24 CEU credit hours — more than
        enough to satisfy one full renewal cycle. Keeping your credential active is not just
        an administrative formality; it signals to employers that your knowledge is current
        with modern LED technology, updated energy codes, and evolving sustainability standards.
      </p>

      <h2 style={h2Style}>Why Employers Value the LC Credential</h2>
      <p style={body}>
        The LC is the only vendor-neutral, nationally recognized credential that covers the
        full scope of professional lighting practice. Architects, engineers, manufacturers'
        representatives, distributors, and specification consultants all compete for the same
        projects. When a client or design firm sees the LC designation on a business card or
        LinkedIn profile, it signals competence that self-reported experience alone cannot.
      </p>
      <p style={body}>
        For lighting sales professionals, the LC often differentiates who gets in front of
        specifiers. For lighting designers and engineers, it is increasingly a requirement
        rather than a differentiator. Many firms now list the LC as a preferred or required
        qualification for senior roles.
      </p>

      <div style={ctaBox}>
        <p style={ctaHeading}>Study with 74 lessons + 129 practice questions</p>
        <p style={ctaDesc}>
          LC · Lighting Master covers all 13 exam topics with structured lessons, visual
          diagrams, audio narration, and timed practice questions. 24 CEU credit hours included.
        </p>
        <a href="/pricing" style={ctaBtn}>Start studying →</a>
      </div>

      <p style={related}>Related: <a href="/resources/ncqlp-exam-dates-2026" style={link}>2026 Exam Dates & Timeline</a> · <a href="/resources/how-to-become-lighting-certified" style={link}>Step-by-Step Path to LC</a></p>
    </>
  )
}

const eyebrow = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 12px' }
const h1Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', color: '#2F4A3F', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, color: '#2F4A3F', margin: '40px 0 14px', lineHeight: 1.25 }
const meta = { fontSize: 13, color: '#A09080', fontFamily: "'Inter', sans-serif", margin: '0 0 36px' }
const body = { fontSize: 17, color: '#3A4A40', lineHeight: 1.8, margin: '0 0 20px' }
const ctaBox = { background: '#F2E6DA', border: '1px solid #DDD0C4', borderRadius: 12, padding: '28px 32px', margin: '48px 0 32px' }
const ctaHeading = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F', margin: '0 0 8px' }
const ctaDesc = { fontSize: 15, color: '#5A6B5E', lineHeight: 1.6, margin: '0 0 18px' }
const ctaBtn = { display: 'inline-block', background: '#C65A3A', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 7, textDecoration: 'none' }
const related = { fontSize: 13, color: '#7E9B86', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }
const link = { color: '#C65A3A', textDecoration: 'none' }
