const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  title: 'Lighting Certifications Compared: LC vs CLEP vs LEED AP vs WELL AP | LC Lighting Master',
  description: 'An honest comparison of the major lighting and building credentials. NCQLP LC, AEE CLEP, LEED AP, WELL AP, and DLC NLC — which fits your career path.',
  alternates: { canonical: siteUrl + '/resources/lighting-certifications-compared' },
  openGraph: {
    title: 'Lighting Certifications Compared: LC vs CLEP vs LEED AP vs WELL AP',
    description: 'Which lighting or building credential is right for your career? An honest comparison of LC, CLEP, LEED AP, WELL AP, and DLC NLC training.',
    url: siteUrl + '/resources/lighting-certifications-compared',
  },
}

export default function Article() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Lighting Certifications Compared: LC vs CLEP vs LEED AP vs WELL AP',
    description: metadata.description,
    url: siteUrl + '/resources/lighting-certifications-compared',
    publisher: { '@type': 'Organization', name: 'Luxart LLC', url: siteUrl },
    author: { '@type': 'Organization', name: 'Luxart LLC' },
    datePublished: '2025-01-01',
    dateModified: '2026-01-01',
    mainEntityOfPage: siteUrl + '/resources/lighting-certifications-compared',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p style={eyebrow}>Credential Comparison</p>
      <h1 style={h1Style}>Lighting Certifications Compared: LC vs CLEP vs LEED AP vs WELL AP</h1>
      <p style={meta}>Updated January 2026 · 9 min read</p>

      <p style={body}>
        Lighting professionals face no shortage of credential options — but not all of them
        are created equal, and not all of them serve the same career goals. This guide compares
        the five most relevant certifications for professionals who work with light, evaluating
        each on scope, rigor, employer recognition, and which career paths they serve best.
        The honest answer is that these credentials are complementary, not competing — but
        understanding what each one signals helps you prioritize your time and investment.
      </p>

      <h2 style={h2Style}>Quick Comparison</h2>
      <div style={{ overflowX: 'auto', margin: '0 0 32px' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Credential</th>
              <th style={th}>Issuing Body</th>
              <th style={th}>Focus</th>
              <th style={th}>Exam</th>
              <th style={th}>Best For</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['NCQLP LC', 'NCQLP', 'Full lighting practice', '~150 MC questions', 'Lighting designers, engineers, reps'],
              ['AEE CLEP', 'AEE', 'Energy efficiency in lighting', 'Written exam', 'Energy managers, facilities pros'],
              ['LEED AP BD+C', 'USGBC', 'Green building (lighting is one credit)', 'Multiple choice', 'Architects, MEP engineers'],
              ['WELL AP', 'IWBI', 'Human health & wellness in buildings', 'Multiple choice', 'Interior designers, wellness consultants'],
              ['DLC NLC', 'DesignLights Consortium', 'Networked lighting controls', 'Training modules', 'Controls engineers, integrators'],
            ].map(([cred, body2, focus, exam, best]) => (
              <tr key={cred}>
                <td style={{ ...td, fontWeight: 600 }}>{cred}</td>
                <td style={td}>{body2}</td>
                <td style={td}>{focus}</td>
                <td style={td}>{exam}</td>
                <td style={td}>{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={h2Style}>NCQLP LC — The Broad Lighting Standard</h2>
      <p style={body}>
        The Lighting Certified (LC) credential from the National Council on Qualifications
        for the Lighting Professions is the only vendor-neutral, nationally recognized
        credential that covers the full scope of professional lighting practice. It tests
        photometry, LED technology, controls, energy codes, exterior lighting, emergency
        lighting, daylighting, circadian health, design process, and sustainability — all
        in a single ~150-question exam administered annually at Prometric centers.
      </p>
      <p style={body}>
        For anyone whose primary professional identity is <em>lighting</em> — not energy
        management or green building, but lighting specifically — the LC is the most directly
        relevant credential available. It is recognized across the commercial lighting
        industry by manufacturers, distributors, design firms, and engineering consultants.
        The exam requires demonstrated eligibility (education + experience), which gives
        the credential meaningful barrier-to-entry credibility.
      </p>

      <h2 style={h2Style}>AEE CLEP — Certified Lighting Efficiency Professional</h2>
      <p style={body}>
        The Certified Lighting Efficiency Professional from the Association of Energy
        Engineers focuses on energy reduction and efficiency as the primary lens on lighting.
        It is well-suited for energy managers, facilities directors, and professionals whose
        lighting work is largely about auditing existing installations and identifying
        upgrade opportunities rather than designing from specification.
      </p>
      <p style={body}>
        The CLEP and LC overlap in energy codes and technology content, but the LC goes much
        deeper into photometry, design process, and the full range of professional lighting
        applications. A CLEP holder working toward the LC will find some content familiar,
        but should not underestimate the additional breadth the LC covers.
      </p>

      <h2 style={h2Style}>LEED AP — Leadership in Energy and Environmental Design</h2>
      <p style={body}>
        LEED AP credentials from the U.S. Green Building Council are building-level
        sustainability credentials, not lighting-specific ones. The LEED v4.1 rating system
        includes several Indoor Environment Quality (IEQ) credits that involve lighting —
        including daylighting, lighting control, and quality views — but lighting is one
        piece of a much larger building systems framework.
      </p>
      <p style={body}>
        A LEED AP (BD+C or ID+C specialty) is extremely valuable for architects, interior
        designers, and MEP engineers who work on LEED-certified projects. For a lighting
        professional who is already LC-credentialed, a LEED AP is a natural complement that
        broadens your sustainability vocabulary and project eligibility. Do not pursue LEED AP
        as a substitute for the LC — the overlap in lighting content is thin.
      </p>

      <h2 style={h2Style}>WELL AP — WELL Accredited Professional</h2>
      <p style={body}>
        The WELL Accredited Professional credential from the International WELL Building
        Institute signals expertise in the WELL Building Standard, which addresses occupant
        health and wellness across ten concepts — including Light. The WELL Light concept
        covers circadian lighting, melanopic equivalent daylight illuminance (EDI), glare
        control, and visual comfort.
      </p>
      <p style={body}>
        WELL AP is growing in relevance as human-centric lighting gains traction in corporate
        and healthcare settings. Like LEED AP, it is complementary to the LC for lighting
        professionals who want to extend into wellness-driven design. Standalone, WELL AP
        provides insufficient depth in photometry, LED technology, or energy codes to serve
        as a general lighting credential.
      </p>

      <h2 style={h2Style}>DLC NLC Training — Networked Lighting Controls</h2>
      <p style={body}>
        The DesignLights Consortium's Networked Lighting Controls (NLC) qualification is
        less a formal credential and more a structured training program for professionals
        who specify, install, or integrate networked control systems. It is highly practical
        for controls engineers, electrical contractors, and manufacturer's representatives
        who work with DALI, BACnet, and IP-connected lighting systems.
      </p>
      <p style={body}>
        NLC training fills a gap that the LC's controls module covers at a conceptual level
        but does not go deep on implementation. If your work involves commissioning and
        programming control systems, DLC NLC training is worth completing alongside — not
        instead of — the LC.
      </p>

      <h2 style={h2Style}>Which Credential Should You Pursue First?</h2>
      <p style={body}>
        For most lighting professionals — designers, specification consultants, engineers,
        manufacturers' representatives — the NCQLP LC should come first. It is the broadest
        lighting-specific credential, it is the most widely recognized by employers and
        clients, and it establishes the technical foundation that makes subsequent credentials
        (LEED AP, WELL AP, DLC NLC) more meaningful rather than compensatory.
      </p>
      <p style={body}>
        If your work is primarily in energy auditing or facilities management, the AEE CLEP
        is a reasonable starting point. If you work exclusively on LEED projects, LEED AP may
        be more immediately relevant. But if you call yourself a lighting professional, the
        LC is the credential your clients and peers are most likely to recognize and respect.
      </p>

      <div style={ctaBox}>
        <p style={ctaHeading}>Prepare for the LC with 74 lessons + 50 practice questions</p>
        <p style={ctaDesc}>
          The most comprehensive NCQLP prep platform — covering all 13 exam topics with
          structured lessons, timed practice questions, and 24 CEU credit hours.
        </p>
        <a href="/pricing" style={ctaBtn}>See plans →</a>
      </div>

      <p style={related}>Related: <a href="/resources/what-is-the-ncqlp-lc-exam" style={link}>What Is the NCQLP LC Exam?</a> · <a href="/resources/how-to-become-lighting-certified" style={link}>Step-by-Step Path to LC</a></p>
    </>
  )
}

const eyebrow = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C65A3A', margin: '0 0 12px' }
const h1Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', color: '#2F4A3F', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 22, color: '#2F4A3F', margin: '40px 0 14px', lineHeight: 1.25 }
const meta = { fontSize: 13, color: '#A09080', fontFamily: "'Inter', sans-serif", margin: '0 0 36px' }
const body = { fontSize: 17, color: '#3A4A40', lineHeight: 1.8, margin: '0 0 20px' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '0', color: '#3A4A40', fontFamily: "'Inter', sans-serif" }
const th = { background: '#2F4A3F', color: '#F2E6DA', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap' }
const td = { borderBottom: '1px solid #E8DDD4', padding: '10px 12px', verticalAlign: 'top', lineHeight: 1.55 }
const ctaBox = { background: '#F2E6DA', border: '1px solid #DDD0C4', borderRadius: 12, padding: '28px 32px', margin: '48px 0 32px' }
const ctaHeading = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#2F4A3F', margin: '0 0 8px' }
const ctaDesc = { fontSize: 15, color: '#5A6B5E', lineHeight: 1.6, margin: '0 0 18px' }
const ctaBtn = { display: 'inline-block', background: '#C65A3A', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 7, textDecoration: 'none' }
const related = { fontSize: 13, color: '#7E9B86', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }
const link = { color: '#C65A3A', textDecoration: 'none' }
