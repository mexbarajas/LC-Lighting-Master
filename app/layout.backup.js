import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const siteUrl = 'https://lightingmasterlc.com'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LC · Lighting Master | NCQLP Exam Prep for Lighting Professionals',
    template: '%s | LC Lighting Master',
  },
  description:
    'The most comprehensive NCQLP exam prep platform for lighting professionals. 12 modules, 74 lessons, 129 practice questions, 24 CEU credit hours. Study for your Lighting Certified (LC) credential online.',
  keywords: [
    'NCQLP exam prep',
    'lighting certified exam',
    'LC exam study guide',
    'lighting certification',
    'NCQLP practice questions',
    'lighting design certification',
    'LC credential prep',
    'IES lighting exam',
    'commercial lighting certification',
    'lighting professional exam',
    'NCQLP study materials',
    'lighting certified practice test',
    'CEU lighting hours',
    'North American lighting certification',
  ],
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
    title: 'LC · Lighting Master | NCQLP Exam Prep for Lighting Professionals',
    description:
      'The most comprehensive NCQLP exam prep platform. 12 modules, 74 lessons, 129 practice questions, 24 CEU hours. Pass your LC exam.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LC Lighting Master — NCQLP Exam Prep',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LC · Lighting Master | NCQLP Exam Prep',
    description:
      'Study for your Lighting Certified (LC) credential. 12 modules, 74 lessons, 129 practice questions.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'education',
}

export default function RootLayout({ children }) {
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Course',
              name: 'LC · Lighting Master — NCQLP Exam Prep',
              description:
                'Comprehensive NCQLP exam preparation course for lighting professionals seeking the Lighting Certified (LC) credential.',
              url: siteUrl,
              provider: {
                '@type': 'Organization',
                name: 'Luxart LLC',
                url: siteUrl,
              },
              educationalCredentialAwarded: 'Lighting Certified (LC) — NCQLP',
              numberOfCredits: 24,
              courseCode: 'NCQLP-LC',
              hasCourseInstance: {
                '@type': 'CourseInstance',
                courseMode: 'online',
                instructor: {
                  '@type': 'Organization',
                  name: 'Luxart LLC',
                },
              },
              offers: {
                '@type': 'Offer',
                category: 'Paid',
                url: siteUrl + '/pricing',
              },
              about: [
                { '@type': 'Thing', name: 'NCQLP Lighting Certification' },
                { '@type': 'Thing', name: 'IES Photometry' },
                { '@type': 'Thing', name: 'LED Technology' },
                { '@type': 'Thing', name: 'Lighting Controls' },
                { '@type': 'Thing', name: 'Commercial Lighting' },
              ],
            }),
          }}
        />
      </head>
      <body className={geist.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
