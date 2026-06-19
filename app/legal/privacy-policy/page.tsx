import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | LC · Lighting Master',
  description: 'Privacy Policy for LightingMasterLC.com',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. INTRODUCTION</h2>
            <p className="text-gray-700">This Privacy Policy explains how Luxart LLC ("Company," "we," "our," or "us") collects, uses, shares, and protects your personal information through LightingMasterLC.com ("Platform"). Your privacy is important to us. If you do not agree with this Privacy Policy, please do not use the Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. INFORMATION WE COLLECT</h2>
            <p className="text-gray-700">We collect information you provide directly: name, email address, professional firm/company, professional role, geographic location, and password. We also automatically collect usage data including but not limited to: lesson progress and completion status, practice exam attempts and scores, time spent on lessons, bookmarks and saved notes, course access logs, browser type and version, IP address, and device type.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. HOW WE USE YOUR INFORMATION</h2>
            <p className="text-gray-700">We use your information to: provide, maintain, and improve the Platform; process payments and send transactional emails; track your individual learning progress and course completion; send product updates and announcements (which you can opt out of at any time); comply with legal and regulatory obligations; prevent fraud, abuse, and security incidents; and perform analytics to improve user experience.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. DATA RETENTION</h2>
            <p className="text-gray-700">We retain your account data for the duration of your subscription plus twelve (12) months thereafter, after which it is securely deleted. Payment records are retained for seven (7) years as required by US federal tax law. You may request earlier deletion by contacting admin@luxartmedia.com.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. SHARING OF INFORMATION</h2>
            <p className="text-gray-700">We do not sell your personal information. We may share information with: payment processors (Stripe, Inc.) for payment processing and fraud prevention; email service providers for transactional communications; cloud infrastructure providers who are bound by confidentiality agreements; and law enforcement or government agencies when required by law or court order. We may also share aggregated, de-identified information for research and analytics.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. SECURITY</h2>
            <p className="text-gray-700">We implement industry-standard security measures including TLS 1.3 encryption for data in transit, bcrypt password hashing for stored passwords, regular security audits, and access controls limiting employee data access to job functions only. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. YOUR RIGHTS</h2>
            <p className="text-gray-700">You have the right to access, correct, export, or delete your personal data. Submit requests to admin@luxartmedia.com. We will respond within 30 calendar days. You have the right to withdraw consent for marketing communications at any time. We will not discriminate against you for exercising these rights.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. THIRD-PARTY LINKS AND SERVICES</h2>
            <p className="text-gray-700">The Platform may contain links to third-party websites. This Privacy Policy does not apply to those external sites, and we are not responsible for their privacy practices. We recommend reviewing the privacy policies of any third-party services before providing your information.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="text-gray-700">We use cookies, web beacons, and similar technologies to enhance your experience. Essential cookies are required for platform functionality. Analytics cookies help us understand usage patterns. You can manage cookie preferences in your browser settings. For more information, see our Cookie Policy.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. CHANGES TO THIS POLICY</h2>
            <p className="text-gray-700">We may update this Privacy Policy at any time. Material changes will be communicated via email at least 14 days before taking effect. Continued use of the Platform after changes constitutes your acceptance of the updated Privacy Policy. The "Effective Date" at the top of this policy reflects the last update.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. CONTACT US</h2>
            <p className="text-gray-700">If you have questions about this Privacy Policy or our privacy practices, please contact us at admin@luxartmedia.com. Luxart LLC, United States.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
