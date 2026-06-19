import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | LC · Lighting Master',
  description: 'Terms of Service for LightingMasterLC.com',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. AGREEMENT TO TERMS</h2>
            <p className="text-gray-700">By accessing and using LightingMasterLC.com (the "Platform"), you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions contained in this Terms of Service Agreement ("Agreement"). This Agreement applies to all users, including but not limited to browsers, vendors, customers, merchants, and/or contributors of content.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. USE LICENSE</h2>
            <p className="text-gray-700">Permission is granted to temporarily download one copy of the materials (information or software) on LightingMasterLC.com for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: (a) modifying or copying the materials; (b) using the materials for any commercial purpose, or for any public display (commercial or non-commercial); (c) attempting to decompile or reverse engineer any software contained on LightingMasterLC.com; (d) removing any copyright or other proprietary notations from the materials; (e) transferring the materials to another person or "mirroring" the materials on any other server.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. DISCLAIMER</h2>
            <p className="text-gray-700">The materials on Luxart LLC's web site are provided on an 'as is' basis. Luxart LLC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. LIMITATIONS</h2>
            <p className="text-gray-700">In no event shall Luxart LLC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on LightingMasterLC.com, even if Luxart LLC or a Luxart LLC authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. ACCURACY OF MATERIALS</h2>
            <p className="text-gray-700">The materials appearing on LightingMasterLC.com could include technical, typographical, or photographic errors. Luxart LLC does not warrant that any of the materials on its web site are accurate, complete, or current. Luxart LLC may make changes to the materials contained on its web site at any time without notice.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. MATERIALS AND LINKS</h2>
            <p className="text-gray-700">Luxart LLC has not reviewed all of the sites linked to its web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Luxart LLC of the site. Use of any such linked web site is at the user's own risk. If you find a link that you believe is inappropriate, please contact us.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. MODIFICATIONS</h2>
            <p className="text-gray-700">Luxart LLC may revise these terms of service for its web site at any time without notice. By using this web site, you are agreeing to be bound by the then current version of these terms of service.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. GOVERNING LAW</h2>
            <p className="text-gray-700">These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts located in the United States.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. ACCOUNT RESPONSIBILITY</h2>
            <p className="text-gray-700">You are responsible for all activity that occurs under your account. You agree to notify Luxart LLC immediately of any unauthorized use of your account or password. Luxart LLC will not be liable for any loss or damage arising from your failure to maintain the confidentiality of your password or account information.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. PAYMENT AND SUBSCRIPTIONS</h2>
            <p className="text-gray-700">All purchases on the Platform are subject to acceptance and processing by Luxart LLC. By making a purchase, you authorize Luxart LLC to charge your payment method. Subscription fees are non-refundable except as expressly provided in our Refund Policy. You remain responsible for all charges incurred on your account.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
