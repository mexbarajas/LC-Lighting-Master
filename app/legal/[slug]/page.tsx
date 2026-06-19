import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Section = { h: string; body: string }

type Doc = {
  title: string
  subtitle: string
  effective: string
  sections: Section[]
}

const DOCS: Record<string, Doc> = {
  'terms-of-service': {
    title: 'Terms of Service',
    subtitle: 'Your agreement with Luxart LLC for use of LC · Lighting Master',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Agreement', body: 'By creating an account or purchasing access, you enter into a binding agreement with Luxart LLC ("Luxart", "we", "us") and agree to these Terms. If you do not agree, do not use the platform. These Terms apply to all individual and team subscribers.' },
      { h: '2. Description of service', body: 'LC · Lighting Master provides online educational content, practice examinations, and study tools to help professionals prepare for the Lighting Certified (LC) examination. We are an independent preparation service and are not affiliated with, endorsed by, or connected to the National Council on Qualifications for the Lighting Professions (NCQLP) or any examination body.' },
      { h: '3. Accounts', body: 'You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You may not share, transfer, or sell account access. Notify us immediately at admin@luxartmedia.com if you suspect unauthorized access.' },
      { h: '4. Subscriptions and access', body: 'Access is granted for a calendar-year window expiring December 31 of the year of purchase, or for the specific period shown at checkout. All plans are single-user unless purchased as a team plan. Team plans grant access to the specified number of seats managed by a designated team administrator.' },
      { h: '5. License and permitted use', body: 'Each LC · Lighting Master license is issued to a single named individual and is non-transferable. Sharing login credentials, allowing third-party access, or purchasing a single license for multiple people is strictly prohibited. Accounts found to be shared will be terminated without refund. Teams of two or more must purchase a Team License.' },
      { h: '6. Acceptable use', body: 'You agree not to: reproduce, distribute, or publicly display course content, exam questions, or any proprietary material without written permission; attempt to reverse-engineer, scrape, or circumvent any access controls; share login credentials; use the platform for any unlawful purpose; or upload harmful code. Violations may result in immediate account termination without refund.' },
      { h: '7. Intellectual property', body: 'All content on LC · Lighting Master — including lesson text, exam questions, diagrams, audio narration, visual assets, and software — is owned by or licensed to Luxart LLC and protected by copyright. Your subscription grants a limited, non-exclusive, non-transferable license to access content for personal study purposes only.' },
      { h: '8. Disclaimers', body: 'LC · Lighting Master is provided "as is" without warranty of any kind. We do not guarantee that use of our platform will result in passing any examination. Examination formats, content, and pass rates are set by the relevant credentialing body and are outside our control.' },
      { h: '9. Limitation of liability', body: "To the fullest extent permitted by applicable law, Luxart LLC's total liability to you for any claim arising from your use of the platform is limited to the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, special, or consequential damages, including lost profits or examination fees." },
      { h: '10. Governing law', body: "These Terms are governed by the laws of the United States. Any dispute that cannot be resolved informally will be submitted to binding arbitration under the American Arbitration Association's Consumer Arbitration Rules. You waive the right to participate in class action lawsuits or class-wide arbitration." },
      { h: '11. Changes to terms', body: 'We may update these Terms with at least 14 days\' notice by email. Continued use after the effective date constitutes acceptance.' },
      { h: '12. Contact', body: 'Legal questions: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Who we are', body: 'LC · Lighting Master is an online examination preparation platform operated by Luxart LLC, a limited liability company registered in the United States. Our primary contact for privacy matters is admin@luxartmedia.com.' },
      { h: '2. Information we collect', body: 'We collect information you provide directly: your first and last name, professional email address, company name, US state, and a hashed password when you create an account. We also collect usage data including lesson progress, exam attempts and scores, bookmarks, notes, session timestamps, and browser/device type.' },
      { h: '3. How we use your information', body: 'We use your information to: deliver and improve the platform; process payments and send transactional emails; track your individual learning progress; send optional product announcements you can unsubscribe from at any time; comply with legal obligations; and prevent fraud and abuse.' },
      { h: '4. Legal bases (GDPR)', body: 'If you are in the European Economic Area, our legal bases for processing are: performance of a contract; legitimate interests (security, fraud prevention, aggregate analytics); consent (marketing emails — withdrawable at any time); and legal obligation.' },
      { h: '5. Sharing of information', body: 'We do not sell your personal information. We share data only with: Stripe, Inc. (payment processing); email service providers for transactional email; cloud infrastructure providers under confidentiality obligations; and law enforcement when required by law.' },
      { h: '6. Data retention', body: 'Account data is retained for the duration of your active account plus 2 years, then deleted. Payment records are retained for 7 years as required by US tax law. You may request earlier deletion by emailing admin@luxartmedia.com.' },
      { h: '7. Your rights', body: 'You have the right to access, correct, export, or delete your personal data at any time. Submit requests to admin@luxartmedia.com. We will respond within 30 days and will not discriminate against you for exercising these rights.' },
      { h: '8. Security', body: 'We implement industry-standard security measures including TLS 1.3 encryption in transit, bcrypt password hashing, and access controls limiting employee data access to job functions.' },
      { h: '9. Children', body: 'LC · Lighting Master is intended for professional adults aged 18 and older. We do not knowingly collect data from persons under 18.' },
      { h: '10. Changes to this policy', body: 'We will notify users of material changes by email at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.' },
      { h: '11. Contact', body: 'Privacy questions: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'acceptable-use-policy': {
    title: 'Acceptable Use Policy',
    subtitle: 'Rules governing your use of LC · Lighting Master',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Purpose', body: 'This Acceptable Use Policy ("AUP") governs all use of the LC · Lighting Master platform operated by Luxart LLC. By accessing or using the platform, you agree to comply with this AUP in addition to our Terms of Service.' },
      { h: '2. Permitted use', body: 'The platform is provided solely for individual study and examination preparation for the Lighting Certified (LC) credential. Each license is issued to a single named individual for personal, non-commercial educational use.' },
      { h: '3. Prohibited activities', body: 'You may not: share, resell, sublicense, or transfer your account or credentials to any other person; use the platform on behalf of another individual; screen-record, screenshot, copy, or distribute any course content, exam questions, or materials; use automated tools, bots, or scripts to access or scrape the platform; attempt to bypass authentication, access controls, or payment gates; use the platform to harass, defame, or harm others; upload, transmit, or introduce malicious code; or misrepresent your identity or professional credentials.' },
      { h: '4. Content standards', body: 'Any content you submit to the platform (notes, community questions, feedback) must not be defamatory, obscene, threatening, or in violation of any law. We reserve the right to remove content that violates these standards without notice.' },
      { h: '5. Academic integrity', body: 'The practice exam questions and materials in LC · Lighting Master are proprietary and are not to be reproduced, shared, or used outside of the platform. Sharing exam content in any form — including on forums, social media, or study groups — constitutes a violation of this AUP and our intellectual property rights.' },
      { h: '6. Enforcement', body: 'Violations of this AUP may result in immediate account suspension or termination without refund, removal of access to all content, reporting to relevant professional bodies where applicable, and legal action for material violations.' },
      { h: '7. Reporting violations', body: 'If you become aware of any violation of this AUP, please report it to admin@luxartmedia.com. We investigate all reports and take appropriate action.' },
      { h: '8. Changes', body: 'We may update this AUP at any time with at least 14 days\' notice by email for material changes. Continued use of the platform constitutes acceptance of the updated AUP.' },
      { h: '9. Contact', body: 'Acceptable use questions: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'cookie-policy': {
    title: 'Cookie Policy',
    subtitle: 'How LC · Lighting Master uses cookies and similar technologies',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. What are cookies', body: 'Cookies are small text files placed on your device by websites you visit. They are widely used to make sites work efficiently and to provide reporting information. LC · Lighting Master uses both first-party cookies (set by us) and third-party cookies (set by our service providers).' },
      { h: '2. Essential cookies', body: 'These cookies are strictly necessary for the platform to function. They manage your login session and authentication state, remember your language and display preferences, and prevent cross-site request forgery. You cannot opt out of essential cookies without losing access to your account.' },
      { h: '3. Analytics cookies', body: 'We use privacy-respecting analytics to understand how learners navigate the platform and where users encounter friction. Analytics data is aggregated and not linked to identifiable individuals. You may opt out of analytics cookies in your Account settings without affecting platform functionality.' },
      { h: '4. Preference cookies', body: 'These cookies remember your choices: audio playback speed, last lesson position, sidebar state, and exam session configuration. Disabling them means the platform cannot remember your preferences between sessions.' },
      { h: '5. Payment cookies', body: 'Our payment processor Stripe, Inc. sets cookies necessary to detect fraud and process payments securely. These are set only during checkout flows. Stripe\'s cookie practices are governed by Stripe\'s own Privacy Policy.' },
      { h: '6. No advertising cookies', body: 'We do not use advertising cookies, cross-site tracking pixels, or behavioral retargeting technologies. We do not partner with advertising networks. No cookie data is shared with advertisers.' },
      { h: '7. Managing cookies', body: 'You can control cookies through your browser settings. Blocking essential cookies will prevent you from signing in. For questions about our cookie use, contact admin@luxartmedia.com.' },
      { h: '8. Changes', body: 'We will notify users of material changes to our cookie practices at least 14 days before they take effect.' },
    ],
  },

  'refund-policy': {
    title: 'Refund Policy',
    subtitle: 'Our commitment to fair and transparent refunds',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Our commitment', body: 'We want you to feel confident purchasing LC · Lighting Master. If the platform is not right for you, we offer a straightforward refund process. All refund requests should be submitted to admin@luxartmedia.com with your account email and reason.' },
      { h: '2. 14-day money-back guarantee — individual plans', body: 'Individual subscribers (Tier 1, Tier 2, Tier 3) may request a full refund within 14 days of purchase, no questions asked, provided they have completed fewer than 3 full lessons. To claim: email admin@luxartmedia.com within 14 days of purchase with subject line "Refund Request".' },
      { h: '3. Team plans', body: 'Team plan purchases are refundable within 14 days provided no team members have accessed the platform. Once any seat has been activated, team plans are non-refundable.' },
      { h: '4. Exam add-on', body: 'The practice exam add-on is refundable within 14 days of purchase if fewer than 2 exam sessions have been started. Once 2 or more sessions have been completed, the add-on is non-refundable.' },
      { h: '5. Promotional pricing', body: 'Purchases made at a promotional or seasonal discount are subject to the same refund terms above. The refund amount is always the amount actually paid.' },
      { h: '6. Renewals', body: 'Access expires on December 31 of the year of purchase. If you re-purchase for the following year, refund eligibility resets.' },
      { h: '7. Chargebacks', body: 'We ask that you contact us before initiating a chargeback. Unresolved chargebacks result in immediate account suspension. We respond to all billing disputes within 2 business days.' },
      { h: '8. Processing time', body: 'Approved refunds are processed within 5–10 business days and returned to the original payment method.' },
      { h: '9. Contact', body: 'All refund requests and billing questions: admin@luxartmedia.com. We aim to respond within 1 business day. Luxart LLC, United States.' },
    ],
  },

  'copyright-ip-policy': {
    title: 'Copyright & IP Policy',
    subtitle: 'Protecting the intellectual property of LC · Lighting Master',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Ownership', body: 'All content on LC · Lighting Master — including but not limited to lesson text, module scripts, practice exam questions and explanations, diagrams, illustrations, audio narration, video clips, visual assets, UI design, and underlying software code — is owned by or exclusively licensed to Luxart LLC and is protected by United States and international copyright law.' },
      { h: '2. License granted to subscribers', body: 'Your subscription or purchase grants you a limited, personal, non-exclusive, non-transferable, revocable license to access and view the content solely for your own private study and examination preparation. This license does not grant you any ownership rights or any right to use the content for any other purpose.' },
      { h: '3. Prohibited uses', body: 'Without prior written permission from Luxart LLC, you may not: copy, reproduce, or duplicate any content in any form; distribute, publish, broadcast, or publicly display any content; create derivative works based on our content; use our content in AI training datasets or similar machine learning applications; share exam questions, answer explanations, or lesson content with others in any format; or remove, alter, or obscure any copyright notices or attributions.' },
      { h: '4. DMCA / Copyright complaints', body: 'If you believe that content on our platform infringes your copyright, please send a written notice to admin@luxartmedia.com containing: identification of the copyrighted work; identification of the allegedly infringing material and its location; your contact information; a statement of good faith belief; and your signature. We will investigate and respond within 14 days.' },
      { h: '5. Third-party content', body: 'Some content on the platform references third-party standards, guidelines, or publications (e.g., IES, ASHRAE). Such references are for educational purposes only and do not imply affiliation with or endorsement by those organizations. All trademarks and registered marks belong to their respective owners.' },
      { h: '6. Enforcement', body: 'Unauthorized use of our intellectual property may result in account termination without refund, civil legal action for copyright infringement, and claims for statutory damages under applicable law. We actively monitor for unauthorized distribution of our content.' },
      { h: '7. Contact', body: 'Copyright and IP questions: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'affiliate-terms': {
    title: 'Affiliate Program Terms',
    subtitle: 'Terms governing participation in the LC · Lighting Master affiliate program',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. Program overview', body: 'The LC · Lighting Master Affiliate Program ("Program") allows approved participants ("Affiliates") to earn commission by referring new paying customers to the platform. Participation is subject to these terms and approval by Luxart LLC.' },
      { h: '2. Eligibility', body: 'To participate, you must: be at least 18 years old; have a legitimate platform or audience relevant to lighting design, architecture, or professional development; agree to these Affiliate Terms; and be approved by Luxart LLC. Employees and contractors of Luxart LLC are not eligible.' },
      { h: '3. Commission structure', body: 'Approved Affiliates earn a commission on each qualifying purchase made by a new customer referred through their unique affiliate link. Commission rates, cookie windows, and payout thresholds are communicated at the time of approval and may be updated with 30 days\' notice.' },
      { h: '4. Qualifying purchases', body: 'A qualifying purchase is a first-time paid purchase by a new customer who followed your affiliate link and completed checkout within the specified cookie window. Renewals, upgrades by existing subscribers, and purchases by existing free account holders who did not use your link do not qualify.' },
      { h: '5. Prohibited promotional methods', body: 'Affiliates may not: use paid search advertising that targets our brand name or trademark variations; engage in cookie stuffing, forced clicks, or any other deceptive referral methods; make false or misleading claims about the platform or the LC examination; spam email lists or use unsolicited bulk messaging; or offer cash rebates or unauthorized incentives to purchasers.' },
      { h: '6. Disclosure requirements', body: 'You must clearly and conspicuously disclose your affiliate relationship whenever you promote LC · Lighting Master, in compliance with FTC guidelines and any applicable laws in your jurisdiction. Failure to disclose is grounds for immediate removal from the Program.' },
      { h: '7. Payment', body: 'Commissions are paid monthly for the prior month\'s qualifying referrals, once your account balance reaches the minimum payout threshold. Luxart LLC reserves the right to withhold payment pending fraud investigation. Chargebacks and refunds on referred purchases will be deducted from commissions.' },
      { h: '8. Termination', body: 'Either party may terminate affiliate participation at any time with 7 days\' written notice. Luxart LLC may terminate immediately for fraud, Terms violations, or conduct that damages the brand. Earned commissions for completed qualifying purchases will be paid out at the next regular cycle after termination.' },
      { h: '9. Contact', body: 'Affiliate program inquiries: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'certificate-disclaimer': {
    title: 'Certificate Disclaimer',
    subtitle: 'Important information about our completion certificate',
    effective: 'June 1, 2026',
    sections: [
      { h: '1. What our certificate represents', body: 'LC · Lighting Master issues a completion certificate to subscribers who finish all course modules and pass the in-platform practice examination. This certificate is a record of your completion of our proprietary study program only.' },
      { h: '2. Not an official credential', body: 'The LC · Lighting Master completion certificate is NOT the Lighting Certified (LC) credential issued by the National Council on Qualifications for the Lighting Professions (NCQLP). Holding our certificate does not mean you have passed, sat for, or registered for the official LC examination.' },
      { h: '3. No affiliation with NCQLP', body: 'LC · Lighting Master and Luxart LLC are entirely independent of the NCQLP and all affiliated examination bodies. We are not an authorized testing center, official study provider, or approved content partner of the NCQLP or any credentialing organization. Our use of the term "LC" refers to the Lighting Certified examination as a subject of study, not as an endorsement or authorization.' },
      { h: '4. No guarantee of exam success', body: 'Our platform is designed to help you prepare thoroughly for the LC examination, but we make no guarantee that completing our course or earning our certificate will result in passing the official LC examination. Examination outcomes depend on individual preparation, examination conditions, and other factors outside our control.' },
      { h: '5. Employer and professional use', body: 'Before presenting our completion certificate to an employer, professional organization, or credentialing body, confirm that they recognize third-party study certificates. Luxart LLC is not responsible for how any third party interprets or values our certificate.' },
      { h: '6. Accuracy of content', body: 'While we make every effort to ensure our course content is accurate and current, lighting standards, codes, and best practices evolve. We cannot guarantee that all content reflects the most current examination content outline. We recommend cross-referencing with official NCQLP resources when preparing for the examination.' },
      { h: '7. Contact', body: 'Questions about our certificate: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = DOCS[slug]
  if (!doc) return { title: 'Not Found' }
  return {
    title: `${doc.title} | LC Lighting Master`,
    description: doc.subtitle,
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = DOCS[slug]
  if (!doc) notFound()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px', fontFamily: 'sans-serif', color: '#2F4A3F', background: '#FAF5F0', minHeight: '100vh' }}>
      <a href="/" style={{ display: 'inline-block', marginBottom: 32, fontSize: 12, color: '#8a7a6a', textDecoration: 'none', letterSpacing: '0.06em' }}>
        ← LC · Lighting Master
      </a>
      <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C65A3A', marginBottom: 12 }}>
        Luxart LLC
      </p>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', color: '#16120e' }}>{doc.title}</h1>
      <p style={{ fontSize: 13, color: '#8a7a6a', marginBottom: 40 }}>
        LC · Lighting Master · Effective {doc.effective}
      </p>
      {doc.sections.map((s) => (
        <div key={s.h} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid rgba(22,18,14,0.08)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px', color: '#16120e' }}>{s.h}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0, color: '#3D5C50' }}>{s.body}</p>
        </div>
      ))}
      <p style={{ fontSize: 11, color: '#8a7a6a', marginTop: 32 }}>
        © {new Date().getFullYear()} Luxart LLC. All rights reserved.
      </p>
    </div>
  )
}
