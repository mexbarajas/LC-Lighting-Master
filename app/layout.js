import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LC · Lighting Master | NCQLP Exam Prep — Lighting Certification Study Guide',
    template: '%s | LC Lighting Master'
  },
  description: 'The most comprehensive NCQLP exam prep platform for lighting professionals. 12 modules, 74 lessons, 50 timed practice questions, 24 CEU credit hours. Pass your Lighting Certified (LC) exam. Study online at your own pace.',
  keywords: [
    'NCQLP exam prep',
    'NCQLP study guide',
    'NCQLP practice test',
    'NCQLP practice questions',
    'NCQLP exam cost',
    'NCQLP exam eligibility',
    'NCQLP passing score',
    'NCQLP passing rate',
    'NCQLP blueprint',
    'NCQLP exam 2025',
    'NCQLP exam 2026',
    'NCQLP exam 2027',
    'NCQLP study materials',
    'NCQLP online course',
    'NCQLP CEU hours',
    'NCQLP CEU requirements',
    'lighting certification exam',
    'lighting certified exam prep',
    'lighting certified LC credential',
    'lighting certification practice test',
    'lighting certification requirements',
    'lighting certification 2025',
    'lighting certification 2026',
    'lighting certification 2027',
    'lighting certification continuing education',
    'lighting CEU credits',
    'LC exam study guide',
    'LC lighting exam',
    'LC certification study',
    'LC credential prep',
    'LC exam 2025',
    'LC exam 2026',
    'LC exam 2027',
    'LC exam passing score',
    'LC credential renewal',
    'lighting professional certification',
    'lighting design certification',
    'lighting design course online',
    'lighting design professional exam',
    'architectural lighting certification',
    'commercial lighting certification',
    'lighting engineer certification',
    'IES lighting exam prep',
    'IES LC exam',
    'LEED lighting exam prep',
    'ASHRAE lighting exam',
    'LED lighting certification',
    'photometry exam prep',
    'lighting controls certification',
    'lighting education online',
    'lighting professional training',
    'lighting professional exam questions',
    'lighting study guide online',
    'lighting exam practice questions',
    'lighting certified salary',
    'how to become lighting certified',
    'North American lighting certification',
    'lighting technology exam',
    'Luxart lighting education',
  ],
  applicationName: 'LC Lighting Master',
  authors: [{ name: 'Luxart LLC', url: siteUrl }],
  creator: 'Luxart LLC',
  publisher: 'Luxart LLC',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'LC · Lighting Master',
    title: 'LC · Lighting Master | NCQLP Exam Prep & Lighting Certification Study Guide',
    description: 'Pass your NCQLP Lighting Certified exam with the most comprehensive online prep platform. 12 modules, 74 lessons, 50 practice questions, 24 CEU hours. Self-paced, built for North American lighting professionals.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'LC Lighting Master — NCQLP Exam Prep for Lighting Professionals',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LC · Lighting Master | NCQLP Exam Prep',
    description: 'Pass your Lighting Certified (LC) exam. 12 modules, 74 lessons, 50 practice questions, 24 CEU hours. The most comprehensive NCQLP prep platform.',
    images: ['/og-image.png'],
    creator: '@luxartmedia',
  },
  alternates: { canonical: siteUrl },
  category: 'education',
  classification: 'Professional Certification Exam Preparation',
  // Add google: 'YOUR_CODE' here once verified in Google Search Console
}

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': siteUrl + '/#website',
        url: siteUrl,
        name: 'LC · Lighting Master',
        description: 'NCQLP exam prep platform for lighting professionals',
        publisher: { '@id': siteUrl + '/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: siteUrl + '/search?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': siteUrl + '/#organization',
        name: 'Luxart LLC',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: siteUrl + '/og-image.png',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'admin@luxartmedia.com',
          contactType: 'customer support',
        },
        sameAs: [],
      },
      {
        '@type': 'Course',
        '@id': siteUrl + '/#course',
        name: 'LC · Lighting Master — NCQLP Exam Prep',
        description: 'Comprehensive NCQLP exam preparation course covering all 12 blueprint modules for the Lighting Certified (LC) credential. Includes 74 lessons, 50 timed practice questions, and 24 CEU credit hours.',
        url: siteUrl,
        provider: { '@id': siteUrl + '/#organization' },
        educationalCredentialAwarded: 'Lighting Certified (LC) — NCQLP',
        numberOfCredits: 24,
        timeRequired: 'PT40H',
        courseMode: 'online',
        availableLanguage: 'English',
        inLanguage: 'en-US',
        teaches: [
          'IES Photometry and Light Measurement',
          'LED Technology and Light Sources',
          'Lighting Controls and DALI',
          'Energy Codes and ASHRAE 90.1',
          'LEED v4.1 and WELL Building Standard',
          'Exterior Lighting and IES Distribution Types',
          'Emergency Lighting and NFPA 101',
          'Lighting Design Process and Documentation',
          'Color Rendering and CCT',
          'Daylighting and Daylight Harvesting',
          'Circadian Lighting and Human Health',
          'Commercial Lighting Applications',
        ],
        datePublished: '2025-01-15',
        dateModified: new Date().toISOString().split('T')[0],
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseSchedule: {
            '@type': 'Schedule',
            repeatFrequency: 'P1Y',
            scheduleTimezone: 'US/Eastern',
          },
          instructor: { '@id': siteUrl + '/#organization' },
        },
        offers: [
          {
            '@type': 'Offer',
            name: 'Full Course — Tier 2',
            price: '395',
            priceCurrency: 'USD',
            url: siteUrl + '/pricing',
            availability: 'https://schema.org/InStock',
            validFrom: '2025-01-01',
          },
          {
            '@type': 'Offer',
            name: 'Course + Exam Engine — Tier 3',
            price: '595',
            priceCurrency: 'USD',
            url: siteUrl + '/pricing',
            availability: 'https://schema.org/InStock',
            validFrom: '2025-01-01',
          },
        ],
        about: [
          { '@type': 'Thing', name: 'NCQLP Lighting Certification' },
          { '@type': 'Thing', name: 'LC Exam Preparation' },
          { '@type': 'Thing', name: 'IES Photometry' },
          { '@type': 'Thing', name: 'LED Technology' },
          { '@type': 'Thing', name: 'Lighting Controls' },
          { '@type': 'Thing', name: 'Commercial Lighting Design' },
          { '@type': 'Thing', name: 'Lighting Energy Codes' },
          { '@type': 'Thing', name: 'ASHRAE 90.1' },
          { '@type': 'Thing', name: 'LEED v4.1 Lighting Credits' },
          { '@type': 'Thing', name: 'WELL Building Standard Lighting' },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '47',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is the NCQLP lighting certification exam?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The NCQLP Lighting Certified (LC) exam is administered by the National Council on Qualifications for the Lighting Professions. It covers photometry, LED technology, lighting controls, energy codes, and design process. The exam is offered annually from October through November at testing centers.',
            },
          },
          {
            '@type': 'Question',
            name: 'How many questions are on the NCQLP LC exam?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The NCQLP LC exam contains approximately 150 multiple-choice questions covering 13 topic areas. LC · Lighting Master includes 50 timed practice questions with detailed explanations for every answer.',
            },
          },
          {
            '@type': 'Question',
            name: 'How long does it take to study for the LC lighting certification?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Most candidates study for 3–6 months before the exam. LC · Lighting Master provides a structured 12-module, 74-lesson curriculum that covers the complete NCQLP exam blueprint, designed for working professionals studying at their own pace.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does LC Lighting Master provide CEU credit hours?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Completing the full LC · Lighting Master course earns 24 CEU (Continuing Education Unit) credit hours, which can be applied toward professional development requirements and lighting credential maintenance.',
            },
          },
          {
            '@type': 'Question',
            name: 'What topics does the NCQLP LC exam cover?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The NCQLP LC exam covers: lighting science and color theory, light sources and LED technology, photometry and IES files, lighting controls and DALI, energy codes (ASHRAE 90.1, Title 24), LEED and WELL credits, exterior and roadway lighting, emergency lighting (NFPA 101), daylighting, circadian lighting, and lighting design process.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is LC Lighting Master different from the IES study group?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'LC · Lighting Master is a self-paced online platform available year-round, with 74 structured lessons, 50 timed practice questions, audio narration, visual diagrams, bookmarks, and progress tracking. The IES study group is a 10-week Zoom course offered once per year. LC Lighting Master also costs less and includes 24 CEU credit hours.',
            },
          },
        ],
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1HPMLXWF51"
          strategy="afterInteractive"
          async
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1HPMLXWF51');
          `}
        </Script>
      </head>
      <body className={geist.className} style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
