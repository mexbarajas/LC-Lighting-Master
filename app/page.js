import LcAppClient from '@/components/LcAppClient'

export const metadata = {
  title: 'NCQLP Exam Prep & Lighting Certification Study Guide | LC Lighting Master',
  description: 'Pass your NCQLP Lighting Certified (LC) exam with the most comprehensive online prep platform. 74 lessons, 129 practice questions, 24 CEU hours. Self-paced. Built for North American lighting professionals.',
  alternates: { canonical: 'https://lightingmasterlc.com' },
  openGraph: {
    title: 'NCQLP Exam Prep & Lighting Certification Study Guide | LC Lighting Master',
    description: 'Pass your NCQLP LC exam. 12 modules, 74 lessons, 129 timed practice questions, 24 CEU hours.',
    url: 'https://lightingmasterlc.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function Page() {
  return <LcAppClient />
}
