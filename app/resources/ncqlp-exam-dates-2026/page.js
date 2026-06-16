const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'NCQLP Exam Dates 2026: Registration Deadlines & Key Timeline | LC Lighting Master',
  description: 'The 2026 NCQLP LC exam window is October 14 – November 22. See registration deadlines, a month-by-month study schedule, and tips for timing your preparation.',
  alternates: { canonical: siteUrl + '/resources/ncqlp-exam-dates-2026' },
  openGraph: {
    title: 'NCQLP Exam Dates 2026: Registration Deadlines & Key Timeline',
    description: '2026 LC exam window Oct 14–Nov 22. Registration deadlines, study timeline, and month-by-month prep plan.',
    url: siteUrl + '/resources/ncqlp-exam-dates-2026',
  },
}

export default function Article() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'NCQLP Exam Dates 2026: Registration Deadlines & Key Timeline',
    description: metadata.description,
    url: siteUrl + '/resources/ncqlp-exam-dates-2026',
    publisher: { '@type': 'Organization', name: 'Luxart LLC', url: siteUrl },
    author: { '@type': 'Organization', name: 'Luxart LLC' },
    datePublished: '2025-01-01',
    dateModified: '2026-01-01',
    mainEntityOfPage: siteUrl + '/resources/ncqlp-exam-dates-2026',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p style={eyebrow}>Exam Timeline</p>
      <h1 style={h1Style}>NCQLP Exam Dates 2026: Registration Deadlines & Key Timeline</h1>
      <p style={meta}>Updated January 2026 · 6 min read</p>

      <p style={body}>
        Missing the NCQLP registration deadline means waiting another full year. For most
        lighting professionals, that is not acceptable. This guide lays out the confirmed
        2026 exam window, the expected registration timeline, and a concrete month-by-month
        study schedule you can put on your calendar today.
      </p>

      <h2 style={h2Style}>2026 Exam Window</h2>
      <p style={body}>
        The 2026 NCQLP LC exam runs <strong>October 14 through November 22</strong> at
        Prometric testing centers across the United States and Canada. You schedule your
        specific appointment directly through Prometric after your registration is accepted
        by the NCQLP. Testing center availability varies by city, so candidates in smaller
        markets should schedule early — popular Saturday slots in urban centers fill quickly
        in late September.
      </p>
      <p style={body}>
        The exam is offered once per year. There is no spring window, no retake opportunity
        within the same cycle, and no remote or online proctoring option. Your one shot is
        that six-week window in October and November.
      </p>

      <h2 style={h2Style}>Registration Timeline</h2>
      <p style={body}>
        Based on historical NCQLP cycles, registration for the 2026 exam follows this
        approximate schedule:
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>Date</th>
            <th style={th}>Milestone</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Early spring (Feb–Mar)', 'NCQLP announces registration opening and publishes exam handbook'],
            ['April–May', 'Early registration opens — submit application, pay fee, upload credentials'],
            ['Late July', 'Early-bird deadline (lower fee tier, if offered)'],
            ['Mid-September', 'Standard registration deadline — last day to register'],
            ['Late September', 'Prometric scheduling window opens for registered candidates'],
            ['Oct 14 – Nov 22', 'Exam window — sit your scheduled appointment'],
            ['December', 'Scores released; credential issued for passing candidates'],
          ].map(([date, milestone]) => (
            <tr key={date}>
              <td style={td}><strong>{date}</strong></td>
              <td style={td}>{milestone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={body}>
        Confirm all specific dates on the official NCQLP website when registration opens —
        the Council occasionally adjusts deadlines by a week or two from year to year.
      </p>

      <h2 style={h2Style}>How Long Should You Study?</h2>
      <p style={body}>
        Most candidates who pass on their first attempt report studying for <strong>3 to 6
        months</strong>. The range is wide because prior exposure matters: a lighting designer
        who has been specifying controls for a decade will absorb the controls module faster
        than a recent architecture graduate. What is consistent among first-time passers is
        that they started early, studied systematically, and completed multiple rounds of
        practice questions before sitting the exam.
      </p>
      <p style={body}>
        A 3-month plan is achievable for candidates with significant professional experience.
        A 5–6 month plan is realistic for those newer to parts of the blueprint — especially
        photometry, energy codes, and emergency lighting, which are the most technically
        demanding sections for non-engineers.
      </p>

      <h2 style={h2Style}>Month-by-Month Study Plan (May – October)</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>Month</th>
            <th style={th}>Focus Areas</th>
            <th style={th}>Target</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['May', 'Modules 1–3: Lighting Science, Color Theory, Light Sources', 'Build foundational vocabulary; understand lumen depreciation and CRI vs TM-30'],
            ['June', 'Modules 4–6: LED Technology, Photometry, IES Files', 'Master inverse square law, candela distributions, IES Type classifications'],
            ['July', 'Modules 7–8: Controls, Energy Codes (ASHRAE 90.1, Title 24)', 'Know LPD limits, occupancy sensor requirements, DALI addressing'],
            ['August', 'Modules 9–10: Exterior, Emergency, Daylighting', 'NFPA 101 battery duration, IES roadway distribution types, daylight harvesting'],
            ['September', 'Modules 11–12: Sustainability, Design Process + full review', 'LEED EQ credits, WELL lighting requirements, complete a full mock exam'],
            ['October', 'Practice exam repetition, weak-area drilling, exam logistics', 'Aim for consistent 75%+ on timed practice sets; confirm Prometric appointment'],
          ].map(([month, focus, target]) => (
            <tr key={month}>
              <td style={td}><strong>{month}</strong></td>
              <td style={td}>{focus}</td>
              <td style={td}>{target}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>What Happens After You Register?</h2>
      <p style={body}>
        Once your application is accepted and fee received, the NCQLP sends a confirmation
        letter with your Authorization to Test (ATT). You then log into the Prometric website,
        enter your ATT number, and select an available date and location within the exam window.
        You will receive a confirmation email from Prometric — print this or save it to your
        phone, as you will need it at the testing center along with a valid government-issued ID.
      </p>
      <p style={body}>
        Rescheduling is possible within Prometric's policy window (typically up to 72 hours
        before your appointment) but may incur a fee. Cancellations within the exam window
        with no reschedule are treated as a no-show — you forfeit the registration fee and
        must reapply the following year.
      </p>

      <div style={ctaBox}>
        <p style={ctaHeading}>Study with 74 lessons + 50 practice questions</p>
        <p style={ctaDesc}>
          Start now and work through all 12 modules before the October window.
          24 CEU credit hours included with the full course.
        </p>
        <a href="/pricing" style={ctaBtn}>See plans →</a>
      </div>

      <p style={related}>Related: <a href="/resources/what-is-the-ncqlp-lc-exam" style={link}>What Is the NCQLP LC Exam?</a> · <a href="/resources/ncqlp-study-guide" style={link}>2026 Study Guide: 12 Topics</a></p>
    </>
  )
}

const eyebrow = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 12px' }
const h1Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', color: '#2F4A3F', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, color: '#2F4A3F', margin: '40px 0 14px', lineHeight: 1.25 }
const meta = { fontSize: 13, color: '#A09080', fontFamily: "'Inter', sans-serif", margin: '0 0 36px' }
const body = { fontSize: 17, color: '#3A4A40', lineHeight: 1.8, margin: '0 0 20px' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 14, margin: '0 0 24px', color: '#3A4A40', fontFamily: "'Inter', sans-serif" }
const th = { background: '#2F4A3F', color: '#F2E6DA', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, padding: '10px 14px', textAlign: 'left' }
const td = { borderBottom: '1px solid #E8DDD4', padding: '10px 14px', verticalAlign: 'top', lineHeight: 1.6 }
const ctaBox = { background: '#F2E6DA', border: '1px solid #DDD0C4', borderRadius: 12, padding: '28px 32px', margin: '48px 0 32px' }
const ctaHeading = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F', margin: '0 0 8px' }
const ctaDesc = { fontSize: 15, color: '#5A6B5E', lineHeight: 1.6, margin: '0 0 18px' }
const ctaBtn = { display: 'inline-block', background: '#C65A3A', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 7, textDecoration: 'none' }
const related = { fontSize: 13, color: '#7E9B86', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }
const link = { color: '#C65A3A', textDecoration: 'none' }
