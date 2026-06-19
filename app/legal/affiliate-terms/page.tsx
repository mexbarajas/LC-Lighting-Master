import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Program Terms | LC · Lighting Master',
  description: 'Affiliate Program Terms and Conditions for LightingMasterLC.com',
}

export default function AffiliateTerms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Program Terms</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. PROGRAM OVERVIEW</h2>
            <p className="text-gray-700">This Affiliate Program Terms and Conditions ("Agreement") governs participation in the LightingMasterLC.com Affiliate Program operated by Luxart LLC ("Company," "we," "our," or "us"). By enrolling in the Affiliate Program, you ("Affiliate") agree to be bound by these terms. The Affiliate Program allows eligible individuals to earn commissions by promoting LightingMasterLC.com and referring customers.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. ELIGIBILITY</h2>
            <p className="text-gray-700">Affiliates must be at least 18 years old and have a valid tax identification number (US residents) or equivalent. Employees of Luxart LLC and their immediate family members are not eligible. We reserve the right to deny enrollment or terminate participation at any time for any reason.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. COMMISSION STRUCTURE</h2>
            <p className="text-gray-700">Affiliates earn commission on qualifying referrals as set forth in the Affiliate Dashboard. Commission rates may vary by offer and product. We may modify commission structures with 30 days' notice. Commission is calculated based on the net purchase amount after refunds, chargebacks, or reversals.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. PROMOTIONAL GUIDELINES</h2>
            <p className="text-gray-700">Affiliates may not: Use misleading or false advertising claims, Misrepresent the Platform or its benefits, Violate trademark or copyright laws, Use spam or unsolicited email, Purchase branded keywords without authorization, Create content that implies endorsement by Luxart LLC without permission. All promotional materials must be pre-approved by Luxart LLC.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. PAYMENT TERMS</h2>
            <p className="text-gray-700">Commissions are calculated monthly and paid via the method specified in your Affiliate account within 30 days of the end of each month. Minimum payout threshold is $50. Luxart LLC is not responsible for taxes, withholding, or payment method fees incurred by Affiliates.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. TERMINATION</h2>
            <p className="text-gray-700">Either party may terminate this Agreement with 14 days' written notice. Unpaid commissions will be paid within 60 days of termination. Upon termination, all affiliate links and promotional rights are revoked immediately. Affiliates may not earn commission on sales initiated before termination.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. CONTACT</h2>
            <p className="text-gray-700">For questions about the Affiliate Program: admin@luxartmedia.com. Luxart LLC, United States.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
