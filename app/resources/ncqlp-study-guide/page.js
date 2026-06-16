const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'NCQLP Study Guide 2026: The 12 Topics You Must Master | LC Lighting Master',
  description: 'A domain-by-domain breakdown of the NCQLP LC exam blueprint — what each of the 12 study areas tests, how to approach each module, and a weekly study cadence for working professionals.',
  alternates: { canonical: siteUrl + '/resources/ncqlp-study-guide' },
  openGraph: {
    title: 'NCQLP Study Guide 2026: The 12 Topics You Must Master',
    description: 'What the NCQLP LC exam tests in each domain — lighting science, photometry, controls, energy codes, daylighting, sustainability, and more.',
    url: siteUrl + '/resources/ncqlp-study-guide',
  },
}

const domains = [
  {
    num: '01',
    title: 'Lighting Science & Color Theory',
    body: 'This foundational domain covers the physics of light — electromagnetic spectrum, wavelength and color perception, the human visual system (photopic vs. scotopic vision), colorimetry, and color temperature. Expect questions on Kelvin values, the chromaticity diagram, metameric pairs, and how the eye adapts to different luminance levels. Candidates who are weak here struggle across multiple other domains because so much later content builds on these fundamentals.',
  },
  {
    num: '02',
    title: 'Light Sources & LED Technology',
    body: 'LED technology dominates this section. Topics include semiconductor physics at a conceptual level, lumen depreciation (L70/L80/L90 ratings), driver types (constant current vs. constant voltage), thermal management, phosphor conversion vs. direct-emit LED, and comparisons to legacy sources (fluorescent, HID, halogen). Questions often present a scenario and ask which light source characteristic makes it appropriate or inappropriate for the application.',
  },
  {
    num: '03',
    title: 'Photometry & IES File Standards',
    body: 'Photometry is where many candidates lose the most points — and where consistent study pays off most. Know the relationships between candela, lumen, footcandle, and lux. Master the inverse square law (E = I/d²) and the cosine correction for non-perpendicular surfaces. Understand IES LM-63 file format, polar and isofootcandle diagrams, and how photometric reports are used in lighting software. The exam will test calculations, so practice them.',
  },
  {
    num: '04',
    title: 'Lighting Controls & Dimming Systems',
    body: 'Controls content spans occupancy and vacancy sensors (PIR, ultrasonic, dual-technology), daylight harvesting strategies (open-loop vs. closed-loop), DALI protocol (IEC 62386 — 64 addresses per bus, 16 groups), 0-10V dimming, wireless systems (Bluetooth mesh, Zigbee), and tunable white concepts. Energy codes increasingly mandate controls, so this domain intersects heavily with the ASHRAE 90.1 section. Know commissioning requirements.',
  },
  {
    num: '05',
    title: 'Energy Codes: ASHRAE 90.1, Title 24, IECC',
    body: 'ASHRAE 90.1 regulates commercial buildings via LPD (watts per square foot) limits using the Space-by-Space Method or Building Area Method. Title 24 applies to California projects and has its own LPD tables and controls mandates. The IECC addresses residential and light commercial. The exam typically presents a space type and asks which LPD limit applies or whether a proposed design complies. Know the difference between mandatory measures and prescriptive paths.',
  },
  {
    num: '06',
    title: 'Exterior & Roadway Lighting',
    body: 'IES distribution type classifications (Type I through V, full-cutoff, semi-cutoff) and their appropriate applications are heavily tested here. Light trespass, skyglow, and obtrusive light are defined and regulated by IDA/IES Model Lighting Ordinance and LEED SS credits. Parking lot design, roadway uniformity ratios (average-to-minimum, max-to-min), and luminaire mounting height relationships are all exam-testable. Know BUG (Backlight, Uplight, Glare) ratings.',
  },
  {
    num: '07',
    title: 'Emergency & Exit Lighting',
    body: 'NFPA 101 (Life Safety Code) governs emergency lighting in commercial occupancies. The critical values: 1 footcandle minimum at floor level along egress paths, 90-minute minimum battery duration, 0.1 fc at end of emergency period. Egress illumination requirements differ from exit sign illumination requirements — know both. Also know the difference between centrally powered emergency systems and unit equipment (self-contained batteries), and when each is appropriate.',
  },
  {
    num: '08',
    title: 'Daylighting & Daylight Harvesting',
    body: 'Daylighting content includes window-to-wall ratio, sidelighting vs. toplighting strategies, light shelves, shading coefficients, and the relationship between daylight factor and climate. Daylight harvesting controls (photosensors, blinds integration, dimming curves) and their commissioning requirements are tested alongside LEED Daylight credit metrics, including spatial daylight autonomy (sDA) and annual sunlight exposure (ASE). Know the difference between sDA and daylight factor.',
  },
  {
    num: '09',
    title: 'Circadian Lighting & Human-Centric Design',
    body: 'This is an emerging but increasingly tested domain. Melanopsin-driven circadian responses are driven by the intrinsically photosensitive retinal ganglion cells (ipRGCs), which are most sensitive to short-wavelength (~480nm) light. Metrics include melanopic equivalent daylight illuminance (EDI) from WELL, and circadian stimulus (CS) from LRC research. The WELL Building Standard\'s Light concept is the primary framework tested — know its preconditions and optimizations.',
  },
  {
    num: '10',
    title: 'Lighting Design Process & Documentation',
    body: 'This domain covers the full design workflow: programming (understanding owner requirements), schematic design, design development, construction documents, specifications (prescriptive vs. performance), photometric calculations, submittal review, and commissioning. Understand when lighting schedules, cut sheets, photometric plans, and reflected ceiling plans are used. Questions often involve identifying the appropriate deliverable for a given project phase or interpreting specification language.',
  },
  {
    num: '11',
    title: 'Lighting Economics & Life-Cycle Analysis',
    body: 'Life-cycle cost analysis, simple payback calculations, return on investment, and demand charge reduction are all tested. The exam expects you to recognize which factors drive a retrofit\'s economics — not to perform complex financial modeling. Know the difference between installed cost, operating cost, and maintenance cost (lamp and ballast replacements). Understand how utilities structure incentives and rebates, and how to calculate annual energy cost (kWh × rate).',
  },
  {
    num: '12',
    title: 'Sustainability & Green Building Standards',
    body: 'LEED v4.1 EQ credits for Interior Lighting, Daylight, and Quality Views; the WELL Building Standard\'s Light concept; and ENERGY STAR qualification criteria for luminaires are the primary frameworks. Also know Dark Sky (IDA) principles, the relationship between LPD compliance and LEED EA credits, and how sustainable design intersects with the visual comfort and biological performance goals of WELL. These are increasingly integrated rather than siloed topics.',
  },
]

export default function Article() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'NCQLP Study Guide 2026: The 12 Topics You Must Master',
    description: metadata.description,
    url: siteUrl + '/resources/ncqlp-study-guide',
    publisher: { '@type': 'Organization', name: 'Luxart LLC', url: siteUrl },
    author: { '@type': 'Organization', name: 'Luxart LLC' },
    datePublished: '2025-01-01',
    dateModified: '2026-01-01',
    mainEntityOfPage: siteUrl + '/resources/ncqlp-study-guide',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p style={eyebrow}>Study Guide</p>
      <h1 style={h1Style}>NCQLP Study Guide 2026: The 12 Topics You Must Master</h1>
      <p style={meta}>Updated January 2026 · 10 min read</p>

      <p style={body}>
        The NCQLP LC exam does not reward specialists. It rewards lighting professionals
        who understand the full breadth of the discipline — from the physics of light to
        the economics of a retrofit, from DALI addressing to LEED credit prerequisites.
        This guide walks through all 12 study domains in order, explains what the exam
        tests in each, and closes with a practical weekly study cadence for working
        professionals.
      </p>

      {domains.map((d) => (
        <div key={d.num} style={domainBlock}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
            <span style={domainNum}>{d.num}</span>
            <h2 style={domainTitle}>{d.title}</h2>
          </div>
          <p style={domainBody}>{d.body}</p>
        </div>
      ))}

      <h2 style={h2Style}>Weekly Study Cadence</h2>
      <p style={body}>
        A sustainable 5-month plan for a working professional looks like this: two focused
        study sessions per week (90 minutes each) plus one review session (60 minutes) on
        the weekend. That is roughly 5–6 hours per week, or 100–120 hours over the full
        preparation period. This is consistent with what passing first-time candidates report
        spending.
      </p>
      <p style={body}>
        Structure each session around a single topic module rather than jumping between areas.
        Depth per session matters more than breadth — you want to build durable understanding,
        not surface familiarity. At the end of each month, complete a timed practice set
        covering the modules you have studied so far. Track your error rate by topic and
        reallocate review time toward weak areas.
      </p>
      <p style={body}>
        In the final four weeks before the exam, shift from new content to active retrieval:
        timed practice questions, flashcard drilling of formulas and code values, and at least
        two full-length mock exams under realistic conditions (no interruptions, no notes).
        Candidates who complete this pattern consistently score higher than those who spend
        the same total hours reading passively.
      </p>

      <h2 style={h2Style}>How Practice Exams Accelerate Retention</h2>
      <p style={body}>
        The testing effect is well-documented in learning research: retrieving information
        under pressure strengthens memory traces more effectively than re-reading the same
        content. For the LC exam specifically, this means working through practice questions
        — not just reviewing notes — is the highest-leverage study activity in your final
        weeks of preparation.
      </p>
      <p style={body}>
        When you answer a practice question incorrectly, the explanation is more memorable
        than the same fact encountered passively during a reading session. Build a log of
        your missed questions by domain, and revisit those topics within 48 hours while the
        gap is fresh. This targeted retrieval practice converts weak areas into reliable
        knowledge faster than any other method.
      </p>

      <div style={ctaBox}>
        <p style={ctaHeading}>All 12 modules. 74 lessons. 50 timed practice questions.</p>
        <p style={ctaDesc}>
          LC · Lighting Master sequences every topic in the order that builds the most
          durable comprehension. 24 CEU credit hours included.
        </p>
        <a href="/pricing" style={ctaBtn}>Start studying →</a>
      </div>

      <p style={related}>Related: <a href="/resources/ncqlp-practice-questions" style={link}>10 Free Practice Questions</a> · <a href="/resources/ncqlp-exam-dates-2026" style={link}>2026 Exam Dates & Timeline</a></p>
    </>
  )
}

const eyebrow = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 12px' }
const h1Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', color: '#2F4A3F', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, color: '#2F4A3F', margin: '40px 0 14px', lineHeight: 1.25 }
const meta = { fontSize: 13, color: '#A09080', fontFamily: "'Inter', sans-serif", margin: '0 0 36px' }
const body = { fontSize: 17, color: '#3A4A40', lineHeight: 1.8, margin: '0 0 20px' }
const domainBlock = { borderLeft: '3px solid #C65A3A', paddingLeft: 20, marginBottom: 32 }
const domainNum = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#C65A3A', fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 }
const domainTitle = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: '#2F4A3F', margin: 0, lineHeight: 1.3 }
const domainBody = { fontSize: 15, color: '#3A4A40', lineHeight: 1.8, margin: 0 }
const ctaBox = { background: '#F2E6DA', border: '1px solid #DDD0C4', borderRadius: 12, padding: '28px 32px', margin: '48px 0 32px' }
const ctaHeading = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F', margin: '0 0 8px' }
const ctaDesc = { fontSize: 15, color: '#5A6B5E', lineHeight: 1.6, margin: '0 0 18px' }
const ctaBtn = { display: 'inline-block', background: '#C65A3A', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 7, textDecoration: 'none' }
const related = { fontSize: 13, color: '#7E9B86', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }
const link = { color: '#C65A3A', textDecoration: 'none' }
