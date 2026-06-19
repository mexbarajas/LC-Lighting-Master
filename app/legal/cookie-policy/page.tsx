import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | LC · Lighting Master',
  description: 'Cookie Policy for LightingMasterLC.com',
}

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p className="text-gray-700">This Cookie Policy explains how Luxart LLC uses cookies and similar tracking technologies on LightingMasterLC.com. By continuing to use the Platform, you consent to the use of cookies as described in this Policy, subject to applicable laws and consent requirements.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. What Are Cookies?</h2>
            <p className="text-gray-700">Cookies are small text files stored on your device when you visit a website. Cookies help websites: Function properly, Remember preferences, Improve performance, Analyze traffic, Enhance security, Personalize experiences.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Types of Cookies We Use</h2>
            <p className="text-gray-700"><strong>Essential Cookies</strong> These cookies are necessary for operation of the Platform. Examples include: Login authentication, Session management, Security verification, Fraud prevention, User account access. Without these cookies, portions of the Platform may not function properly.</p>
            <p className="text-gray-700 mt-3"><strong>Functional Cookies</strong> Functional cookies help remember user preferences such as: Language settings, Display preferences, User choices, Platform settings.</p>
            <p className="text-gray-700 mt-3"><strong>Analytics Cookies</strong> Analytics cookies help us understand: Visitor behavior, Website performance, Traffic sources, Content effectiveness. We currently use Google Analytics. Analytics data may include: Device information, Browser information, Pages visited, Time spent on pages, General geographic information.</p>
            <p className="text-gray-700 mt-3"><strong>Marketing Cookies</strong> Marketing cookies may be used to: Measure campaign performance, Deliver relevant communications, Understand user interests, Improve promotional efforts. These cookies may be set by us or trusted third-party providers.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Cookies</h2>
            <p className="text-gray-700">Third-party providers may place cookies through the Platform. Examples may include: Google Analytics, Stripe, Email marketing platforms, Hosting providers. These third parties maintain their own privacy policies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookie Consent</h2>
            <p className="text-gray-700">Where required by law, users may be presented with a cookie consent banner allowing them to: Accept all cookies, Reject non-essential cookies, Customize preferences. Consent choices may be modified later through browser settings or available cookie preference tools.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Managing Cookies</h2>
            <p className="text-gray-700">Users may control cookies through browser settings. Most browsers allow users to: Delete cookies, Block cookies, Restrict cookies, Receive notifications before cookies are stored. Disabling cookies may impact Platform functionality.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Do Not Track Signals</h2>
            <p className="text-gray-700">The Platform currently does not respond to browser-based "Do Not Track" signals because there is no universally accepted standard governing such signals.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. International Users</h2>
            <p className="text-gray-700">Users located in jurisdictions with enhanced privacy protections may have additional rights regarding cookies and tracking technologies. Where required by law, Luxart LLC will obtain consent before placing certain categories of cookies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Changes to this Policy</h2>
            <p className="text-gray-700">Luxart LLC may update this Cookie Policy at any time. Changes become effective upon publication. Continued use of the Platform constitutes acceptance of revised terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact Information</h2>
            <p className="text-gray-700">Luxart LLC | Website: LightingMasterLC.com | Email: admin@luxartmedia.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
