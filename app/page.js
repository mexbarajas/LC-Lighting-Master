import LcAppClient from '@/components/LcAppClient'
import Link from 'next/link'

export const metadata = {
  title: 'NCQLP Exam Prep & Lighting Certification Study Guide | LC Lighting Master',
  description: 'Pass your NCQLP Lighting Certified (LC) exam with the most comprehensive online prep platform. 74 lessons, 50 practice questions, 24 CEU hours. Self-paced. Built for North American lighting professionals.',
  alternates: { canonical: 'https://lightingmasterlc.com' },
  openGraph: {
    title: 'NCQLP Exam Prep & Lighting Certification Study Guide | LC Lighting Master',
    description: 'Pass your NCQLP LC exam. 12 modules, 74 lessons, 50 timed practice questions, 24 CEU hours.',
    url: 'https://lightingmasterlc.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Course',
      name: 'NCQLP LC Exam Preparation Course',
      description: 'Self-paced online NCQLP Lighting Certified (LC) exam prep — 12 modules, 74 lessons, 50 practice questions, 24 CEU hours.',
      url: 'https://lightingmasterlc.com',
      provider: {
        '@type': 'Organization',
        name: 'LC Lighting Master',
        url: 'https://lightingmasterlc.com',
      },
      offers: {
        '@type': 'Offer',
        price: '395',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: 'PT24H',
      },
    },
    {
      '@type': 'Organization',
      name: 'LC Lighting Master',
      url: 'https://lightingmasterlc.com',
      logo: 'https://lightingmasterlc.com/og-image.png',
      sameAs: [],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <LcAppClient />
      <div style={{
        textAlign: 'center',
        padding: '16px 24px 24px',
        fontSize: 13,
        fontFamily: "'Inter', sans-serif",
        color: '#7E9B86',
        borderTop: '1px solid #E8DDD4',
        background: '#FAF5F0',
      }}>
        <span style={{ marginRight: 6 }}>Free resources:</span>
        <Link href="/resources/what-is-the-ncqlp-lc-exam" style={{ color: '#C65A3A', textDecoration: 'none', marginRight: 12 }}>NCQLP Exam Guide</Link>
        <Link href="/resources/ncqlp-exam-dates-2026" style={{ color: '#C65A3A', textDecoration: 'none', marginRight: 12 }}>2026 Exam Dates</Link>
        <Link href="/resources/ncqlp-practice-questions" style={{ color: '#C65A3A', textDecoration: 'none' }}>Practice Questions</Link>
      </div>
    </>
  )
}
