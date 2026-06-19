import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | LC · Lighting Master',
  description: 'Refund Policy for LightingMasterLC.com',
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. OVERVIEW</h2>
            <p className="text-gray-700">This Refund Policy governs all purchases made through LightingMasterLC.com ("Platform") operated by Luxart LLC ("Company," "we," "our," or "us"). By purchasing any subscription, course, training program, educational content, team license, corporate license, continuing education offering, or other digital product through the Platform, you agree to this Refund Policy. Because the Platform provides immediate access to digital educational content, all sales are subject to the restrictions outlined below.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. DIGITAL PRODUCTS AND EDUCATIONAL SERVICES</h2>
            <p className="text-gray-700">The Platform provides digital educational products and services, including but not limited to: Online courses, Educational lessons, Audio content, Podcasts, Learning materials, Assessments, Practice examinations, Certificate programs, Continuing education content, Subscription services, Team licenses, Corporate licenses. Upon purchase, users receive immediate access to digital content. Due to the nature of digital products, refunds are limited.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. NO REFUNDS AFTER COURSE CONSUMPTION</h2>
            <p className="text-gray-700">A user becomes ineligible for a refund upon the earliest occurrence of any of the following: (A) Completion of Three (3) Lessons: Once a user completes three (3) lessons within any purchased course, subscription, or learning program, the purchase becomes non-refundable. (B) Significant Consumption of Content: Luxart LLC reserves the right to determine whether a substantial portion of purchased content has been accessed, viewed, streamed, completed, or otherwise consumed. If substantial consumption has occurred, no refund will be issued. (C) Certificate Issuance: Once a certificate has been generated, awarded, downloaded, or issued, no refund will be provided. (D) Account Misuse: Refunds will not be granted to users whose accounts are suspended, restricted, or terminated due to violations of Platform policies.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. SUBSCRIPTION PURCHASES</h2>
            <p className="text-gray-700">All subscriptions provide access to digital educational content. Users are responsible for evaluating the Platform before purchasing. Subscription fees are non-refundable except where required by applicable law. Failure to use the Platform does not create entitlement to a refund.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. MANUAL RENEWAL PLANS</h2>
            <p className="text-gray-700">Subscriptions offered by LightingMasterLC.com do not automatically renew unless explicitly stated otherwise during checkout. Users are solely responsible for renewing access if continued access is desired. Failure to renew does not entitle users to refunds, credits, extensions, or special pricing.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. FREE TIER ACCESS</h2>
            <p className="text-gray-700">The Platform may offer free content, lessons, previews, demonstrations, or trial features. The existence of free content allows prospective users to evaluate the Platform before purchasing. Purchases made after access to free content are considered informed purchases.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. TECHNICAL ISSUES</h2>
            <p className="text-gray-700">If a verified technical issue prevents access to purchased content, Luxart LLC may, at its sole discretion: Restore access, Extend subscription periods, Provide technical assistance, Issue account credits. Technical issues do not automatically qualify a purchase for a refund.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. NON-REFUNDABLE SITUATIONS</h2>
            <p className="text-gray-700">Refunds will not be issued for: Failure to pass the LC Examination, Failure to obtain certification, Failure to complete a course, Lack of usage, Change of career goals, Change of employment status, User dissatisfaction unrelated to a material defect, Internet connectivity issues, Browser compatibility issues, Device compatibility issues, Scheduling conflicts, Personal circumstances, User misunderstanding of course objectives, Violations of Terms of Service.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. CHARGEBACKS AND PAYMENT DISPUTES</h2>
            <p className="text-gray-700">Users agree to contact Luxart LLC before initiating a chargeback or payment dispute. If a user initiates a chargeback after receiving access to digital content, Luxart LLC reserves the right to: Suspend the account, Terminate access, Revoke certificates, Block future purchases, Contest the chargeback using account records and usage data. Evidence may include: Login history, Course progress, Lesson completion records, Certificate issuance records, Subscription records, Access logs.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. CONTACT INFORMATION</h2>
            <p className="text-gray-700">Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com. Questions regarding refunds should be directed to the email address above.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
