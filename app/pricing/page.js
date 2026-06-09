import PricingPageClient from '@/components/PricingPageClient'

export const metadata = {
  title: 'Pricing — NCQLP Exam Prep Plans | LC Lighting Master',
  description: 'Affordable one-time pricing for NCQLP lighting certification exam prep. Full course, exam engine, and team plans available. Access expires December 31. No subscription.',
  alternates: { canonical: 'https://lightingmasterlc.com/pricing' },
}

export default function PricingPage() {
  return <PricingPageClient />
}
