import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Certificate Disclaimer | LC · Lighting Master',
  description: 'Certificate Disclaimer for LightingMasterLC.com',
}

export default function CertificateDisclaimer() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Disclaimer</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Certificate Purpose</h2>
            <p className="text-gray-700">Certificates issued through LightingMasterLC.com are provided solely as evidence that a user has completed the applicable course, program, lesson series, assessment, or educational requirement established by Luxart LLC.</p>
            <p className="text-gray-700 mt-3">Certificates do not constitute: Professional licensure, Government approval, Regulatory approval, Professional engineering certification, Professional lighting certification, Employment qualification, Proof of competency, Academic credit, Accreditation.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Guarantee of Outcomes</h2>
            <p className="text-gray-700">Completion of any course or issuance of any certificate does not guarantee: Passing the LC Examination, Passing any certification examination, Obtaining professional credentials, Employment opportunities, Promotions, Salary increases, Continuing education approval by third parties. Users remain solely responsible for satisfying any requirements imposed by licensing boards, employers, professional organizations, accreditation agencies, or certification bodies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No NCQLP Affiliation</h2>
            <p className="text-gray-700">LightingMasterLC.com and Luxart LLC are not affiliated with, endorsed by, sponsored by, approved by, or otherwise associated with the National Council on Qualifications for the Lighting Professions (NCQLP), unless expressly stated in writing. References to the LC Examination are provided solely for educational and informational purposes.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Certificate Verification</h2>
            <p className="text-gray-700">Luxart LLC reserves the right to verify, revoke, invalidate, suspend, or refuse recognition of any certificate obtained through: Fraud, Misrepresentation, Account sharing, Unauthorized access, Policy violations, Technical manipulation.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ownership of Certificates</h2>
            <p className="text-gray-700">Certificates remain intellectual property of Luxart LLC. Users receive a limited license to display certificates as evidence of course completion. Certificates may not be altered, modified, falsified, sold, licensed, transferred, or used in a misleading manner.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Continuing Education Disclaimer</h2>
            <p className="text-gray-700">Where a course is marketed as eligible for continuing education credit, users remain responsible for confirming acceptance by the applicable accrediting organization, licensing authority, employer, or educational institution. Luxart LLC does not guarantee acceptance by any third party.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h2>
            <p className="text-gray-700">Questions regarding certificates should be directed to: admin@luxartmedia.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
