const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'NCQLP Practice Questions: 10 Free LC Exam Sample Questions | LC Lighting Master',
  description: '10 original multiple-choice practice questions in NCQLP LC exam style — covering photometry, controls, energy codes, emergency lighting, daylighting, and more. Full answer explanations included.',
  alternates: { canonical: siteUrl + '/resources/ncqlp-practice-questions' },
  openGraph: {
    title: 'NCQLP Practice Questions: 10 Free LC Exam Sample Questions',
    description: '10 original LC exam-style questions with full answer explanations. Photometry, controls, ASHRAE, NFPA 101, LEED, and more.',
    url: siteUrl + '/resources/ncqlp-practice-questions',
  },
}

const questions = [
  {
    n: 1,
    q: 'A horizontal work surface measures 50 footcandles. What is the equivalent illuminance in lux?',
    options: ['A. 5.38 lux', 'B. 50 lux', 'C. 538 lux', 'D. 4.65 lux'],
    answer: 'C',
    explanation: 'One footcandle equals approximately 10.764 lux. Multiplying 50 fc × 10.764 = 538 lux. The conversion works in the other direction too: 538 lux ÷ 10.764 ≈ 50 fc. This conversion is a reliable exam item — memorize it.',
  },
  {
    n: 2,
    q: 'A specifier is evaluating two LED luminaires. Luminaire A has a CRI of 90 and an Rf (fidelity index) of 88. Luminaire B has a CRI of 82 and an Rf of 91. Which statement best describes the difference?',
    options: [
      'A. Luminaire A renders all colors more accurately because its CRI is higher',
      'B. Luminaire B provides more faithful color rendering than CRI alone indicates because TM-30 Rf evaluates a broader set of sample colors',
      'C. CRI and Rf are equivalent metrics; the luminaires are virtually identical in color quality',
      'D. CRI is more accurate than Rf for predicting human color perception',
    ],
    answer: 'B',
    explanation: 'CRI (Ra) is calculated using only 8 pastel reference samples and can overstate performance on saturated colors. TM-30 Rf uses 99 reference samples drawn from real-world objects, giving a more complete picture of fidelity across the full color gamut. A high CRI with a lower Rf may indicate that the source performs well on pastels but poorly on saturated reds and greens.',
  },
  {
    n: 3,
    q: 'An exterior parking lot requires a luminaire distribution that provides good lateral spread along a roadway with minimal backlight. Which IES distribution type is most appropriate?',
    options: ['A. Type I', 'B. Type II', 'C. Type III', 'D. Type V'],
    answer: 'C',
    explanation: 'IES Type III distribution is designed for roadway and parking applications where the luminaire is mounted near the edge of the area to be lit. It provides asymmetric distribution with a strong forward throw and moderate lateral spread, minimizing spill onto adjacent properties. Type I is for sidewalks and pedestrian paths; Type II is for narrower roadways; Type V is symmetric and used for center-pole mounting in large open areas.',
  },
  {
    n: 4,
    q: 'NFPA 101 requires that emergency lighting systems provide a minimum illuminance of 1 footcandle at floor level for a minimum duration of:',
    options: ['A. 30 minutes', 'B. 60 minutes', 'C. 90 minutes', 'D. 120 minutes'],
    answer: 'C',
    explanation: 'NFPA 101 (Life Safety Code) mandates that emergency lighting systems maintain at least 1 footcandle at the floor along the path of egress for a minimum of 90 minutes following loss of normal power. This 90-minute requirement is a frequent exam topic — it distinguishes NFPA 101 from less stringent local codes that sometimes specify 60 minutes.',
  },
  {
    n: 5,
    q: 'ASHRAE 90.1 regulates lighting energy efficiency in commercial buildings primarily through which metric?',
    options: [
      'A. Lumens per watt (efficacy) of individual lamps',
      'B. Lighting Power Density (LPD) in watts per square foot',
      'C. Color Rendering Index (CRI) requirements for occupied spaces',
      'D. Correlated Color Temperature (CCT) limits for office environments',
    ],
    answer: 'B',
    explanation: 'ASHRAE 90.1 sets maximum Lighting Power Density (LPD) limits by space type and building type, expressed in watts per square foot (W/ft²). The standard does not regulate lamp efficacy, CRI, or CCT directly. LPD limits differ between the Space-by-Space Method and the Building Area Method — know both approaches for the exam.',
  },
  {
    n: 6,
    q: 'A retail clothing store requires high color fidelity to display merchandise accurately. Which combination of CCT and CRI is most appropriate for the selling floor accent lighting?',
    options: [
      'A. 2700K, CRI 75',
      'B. 4000K, CRI 70',
      'C. 3000K, CRI 90+',
      'D. 5000K, CRI 65',
    ],
    answer: 'C',
    explanation: '3000K provides a warm-to-neutral tone that flatters skin tones and fabrics while remaining visually comfortable for extended retail dwell times. A CRI of 90 or above is the threshold commonly specified for retail to ensure accurate color discrimination between fabric dyes and garment colors. 2700K at CRI 75 would render colors poorly; 5000K at CRI 65 is appropriate for industrial or task settings, not merchandise display.',
  },
  {
    n: 7,
    q: 'In a DALI (Digital Addressable Lighting Interface) system, what is the maximum number of individual device addresses on a single DALI bus segment?',
    options: ['A. 16', 'B. 32', 'C. 64', 'D. 128'],
    answer: 'C',
    explanation: 'The DALI protocol (IEC 62386) supports up to 64 individual device addresses on a single bus segment (addresses 0–63). Up to 16 group addresses and 16 scene settings are also available. This hard limit of 64 devices per bus is a defining characteristic of DALI — larger installations require multiple bus segments managed by a central controller. DALI-2 maintains this limit but adds stricter device compliance certification.',
  },
  {
    n: 8,
    q: 'A daylight harvesting control system dims electric lighting in response to daylight contribution. What type of sensor is most commonly used to implement this strategy?',
    options: [
      'A. Passive infrared (PIR) occupancy sensor aimed at the work plane',
      'B. Closed-loop photosensor measuring total light at the work surface',
      'C. Open-loop photosensor measuring light through the window glass',
      'D. Ultrasonic sensor detecting air movement near skylights',
    ],
    answer: 'C',
    explanation: 'Open-loop photosensors measure daylight entering the space (typically through a roof monitor, skylight, or window) without factoring in the electric light contribution, and send a signal to the control system to reduce electric output when daylight is sufficient. Closed-loop photosensors measure total illuminance at the work plane (daylight plus electric), which provides more precise dimming control but requires careful calibration. For the exam, understand the distinction between open-loop (simpler, less precise) and closed-loop (more precise, requires commissioning).',
  },
  {
    n: 9,
    q: 'Under LEED v4.1 Indoor Environment Quality (EQ), which lighting credit addresses the quality and controllability of electric light in occupied spaces?',
    options: [
      'A. EQ Credit: Enhanced Acoustics',
      'B. EQ Credit: Interior Lighting',
      'C. EQ Credit: Daylight',
      'D. EQ Credit: Quality Views',
    ],
    answer: 'B',
    explanation: 'LEED v4.1 EQ Credit: Interior Lighting awards points for strategies including lighting controls for individual occupants, surface reflectances that contribute to comfortable luminance ratios, and avoidance of direct glare. The Daylight credit (a separate credit) addresses sidelighting and toplighting for access to natural light. Knowing the distinction between Interior Lighting, Daylight, and Quality Views credits is essential — they are each independently tested on the exam.',
  },
  {
    n: 10,
    q: 'A luminaire mounted 8 feet above a horizontal work surface produces 500 candelas directly below (nadir, 0°). What is the illuminance at the point directly below the luminaire?',
    options: ['A. 500 lux', 'B. 62.5 footcandles', 'C. 7.8 footcandles', 'D. 3.9 footcandles'],
    answer: 'C',
    explanation: 'The inverse square law states that E = I / d², where E is illuminance in footcandles, I is intensity in candelas, and d is the distance in feet. Here: E = 500 cd / (8 ft)² = 500 / 64 ≈ 7.8 footcandles. This calculation assumes normal incidence (the light hits the surface perpendicularly, which is true at nadir). For non-perpendicular angles, the formula becomes E = I × cos(θ) / d².',
  },
]

export default function Article() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'NCQLP Practice Questions: 10 Free LC Exam Sample Questions with Answers',
    description: metadata.description,
    url: siteUrl + '/resources/ncqlp-practice-questions',
    publisher: { '@type': 'Organization', name: 'LC Lighting Master', url: siteUrl },
    author: { '@type': 'Organization', name: 'LC Lighting Master' },
    datePublished: '2025-01-01',
    dateModified: '2026-01-01',
    mainEntityOfPage: siteUrl + '/resources/ncqlp-practice-questions',
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Answer: ${q.answer}. ${q.explanation}`,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p style={eyebrow}>Free Practice</p>
      <h1 style={h1Style}>NCQLP Practice Questions: 10 Free LC Exam Sample Questions</h1>
      <p style={meta}>Updated January 2026 · 12 min read</p>

      <p style={body}>
        These 10 original questions are written in the style of the NCQLP LC exam — four
        options, one best answer, emphasis on practical application over memorization. Topics
        span the full blueprint: photometry, color science, controls, energy codes, emergency
        lighting, exterior distribution, daylighting, LEED, and the inverse square law. Work
        through them before checking answers below.
      </p>

      {questions.map((item) => (
        <div key={item.n} style={qBlock}>
          <p style={qNumber}>Question {item.n}</p>
          <p style={qText}>{item.q}</p>
          <ol type="A" style={{ margin: '12px 0 0', paddingLeft: 22, fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#3A4A40', lineHeight: 2 }}>
            {item.options.map((o) => (
              <li key={o} style={{ paddingLeft: 4 }}>{o.slice(3)}</li>
            ))}
          </ol>
          <div style={answerBlock}>
            <span style={answerLabel}>Answer: {item.answer}</span>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#3A4A40', lineHeight: 1.75, fontFamily: "'Inter', sans-serif" }}>{item.explanation}</p>
          </div>
        </div>
      ))}

      <p style={body}>
        These 10 questions represent a fraction of the topics tested on the LC exam.
        The full exam contains approximately 150 questions across all 13 blueprint areas,
        timed. The difference between reading explanations and performing under timed
        exam conditions is significant — repeated timed practice is what converts knowledge
        into exam performance.
      </p>

      <div style={ctaBox}>
        <p style={ctaHeading}>50 more practice questions — timed, with explanations</p>
        <p style={ctaDesc}>
          LC · Lighting Master includes 50 full-length timed practice questions across all
          exam topics, plus 74 structured lessons and 24 CEU credit hours.
        </p>
        <a href="/pricing" style={ctaBtn}>See plans →</a>
      </div>

      <p style={related}>Related: <a href="/resources/ncqlp-study-guide" style={link}>The 12 Topics You Must Master</a> · <a href="/resources/what-is-the-ncqlp-lc-exam" style={link}>What Is the NCQLP LC Exam?</a></p>
    </>
  )
}

const eyebrow = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 12px' }
const h1Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', color: '#2F4A3F', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, color: '#2F4A3F', margin: '40px 0 14px', lineHeight: 1.25 }
const meta = { fontSize: 13, color: '#A09080', fontFamily: "'Inter', sans-serif", margin: '0 0 36px' }
const body = { fontSize: 17, color: '#3A4A40', lineHeight: 1.8, margin: '0 0 20px' }
const qBlock = { background: '#fff', border: '1px solid #E8DDD4', borderRadius: 10, padding: '22px 26px', margin: '0 0 20px' }
const qNumber = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 8px' }
const qText = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: '#2F4A3F', lineHeight: 1.5, margin: 0 }
const answerBlock = { marginTop: 18, paddingTop: 14, borderTop: '1px solid #E8DDD4' }
const answerLabel = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#7E9B86', letterSpacing: '0.05em' }
const ctaBox = { background: '#F2E6DA', border: '1px solid #DDD0C4', borderRadius: 12, padding: '28px 32px', margin: '48px 0 32px' }
const ctaHeading = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F', margin: '0 0 8px' }
const ctaDesc = { fontSize: 15, color: '#5A6B5E', lineHeight: 1.6, margin: '0 0 18px' }
const ctaBtn = { display: 'inline-block', background: '#C65A3A', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 7, textDecoration: 'none' }
const related = { fontSize: 13, color: '#7E9B86', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }
const link = { color: '#C65A3A', textDecoration: 'none' }
