import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Copyright & IP Policy | LC · Lighting Master',
  description: 'Copyright and Intellectual Property Policy for LightingMasterLC.com',
}

export default function CopyrightIPPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Copyright & Intellectual Property Policy</h1>
        <p className="text-gray-600 text-sm mb-1">LightingMasterLC.com Operated by Luxart LLC</p>
        <p className="text-gray-500 text-xs mb-8">Effective: June 18, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. OWNERSHIP OF INTELLECTUAL PROPERTY</h2>
            <p className="text-gray-700">All content available through LightingMasterLC.com ("Platform") is owned by Luxart LLC or its licensors and is protected by United States and international copyright, trademark, trade secret, unfair competition, and intellectual property laws. All rights not expressly granted are reserved. Nothing contained on the Platform transfers ownership of any intellectual property to users.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. PROTECTED CONTENT</h2>
            <p className="text-gray-700">Protected content includes, but is not limited to: Educational Content (Courses, Lessons, Training materials, Learning modules, Continuing education content, LC examination preparation materials, Assessments, Practice tests, Quizzes, Question banks, Educational methodologies), Written Content (Articles, Study guides, Explanations, Course descriptions, Learning objectives, Technical documentation, Blog posts, Marketing materials), Audio Content (Podcasts, Narrated lessons, Audio recordings, Educational presentations, Interviews, Webinars), Visual Content (Graphics, Diagrams, Illustrations, Course images, Infographics, Logos, Website design elements, User interface elements), Technology Assets (Databases, Software, Code, APIs, Platform architecture, Course structures, Learning paths, Certificate generation systems), Certificates (Certificate templates, Certificate designs, Verification systems, Completion records).</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. LIMITED LICENSE TO USERS</h2>
            <p className="text-gray-700">Subject to compliance with all applicable agreements, Luxart LLC grants users a limited, non-exclusive, non-transferable, revocable license to: Access purchased content, View educational materials, Stream authorized content, Participate in courses, Download authorized certificates. This license is personal to the registered user and may not be transferred, assigned, sublicensed, or shared.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. PROHIBITED ACTIVITIES</h2>
            <p className="text-gray-700">Users may not directly or indirectly: Copy or Reproduce Content (Copy lessons, Copy assessments, Copy practice questions, Copy course structures, Copy educational materials), Redistribute Content (Share content with third parties, Post content online, Upload content to file-sharing sites, Distribute content through social media, Publish course materials), Commercial Exploitation (Sell content, License content, Rent content, Resell subscriptions, Build competing educational products), Recording Activities (Screen record lessons, Record audio content, Capture webinars, Create screenshots for redistribution, Archive content outside authorized systems), Data Collection Activities (Scrape content, Crawl content, Data mine content, Extract databases, Harvest educational materials, Use bots or automated collection tools).</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. ARTIFICIAL INTELLIGENCE RESTRICTIONS</h2>
            <p className="text-gray-700">Without prior written permission from Luxart LLC, users may not: Use Platform content to train AI models, Use course materials as AI datasets, Feed content into machine learning systems, Generate derivative educational products using Platform content, Extract question banks for AI training. This prohibition applies to: Public AI systems, Private AI systems, Commercial AI systems, Internal AI systems, Large language models, Machine learning models.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. LC EXAM PREPARATION MATERIALS</h2>
            <p className="text-gray-700">Any LC examination preparation materials, study guides, quizzes, assessments, practice questions, explanations, learning aids, or educational resources provided through the Platform are proprietary educational content. Users may not: Reproduce practice questions, Share question banks, Publish assessments, Create competing exam preparation products, Distribute study materials. Unauthorized use may result in immediate legal action.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. CERTIFICATE PROTECTION</h2>
            <p className="text-gray-700">Certificates issued through the Platform may not be: Altered, Modified, Forged, Sold, Licensed, Misrepresented. Luxart LLC reserves the right to revoke certificates obtained through: Fraud, Account sharing, Unauthorized access, Misrepresentation.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. TRADEMARKS</h2>
            <p className="text-gray-700">The following may constitute trademarks, service marks, trade dress, or proprietary branding of Luxart LLC: LightingMasterLC, LightingMasterLC.com, Associated logos, Course names, Program names, Educational brands. Users may not use Company trademarks without prior written consent.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. COPYRIGHT INFRINGEMENT REPORTING</h2>
            <p className="text-gray-700">If you believe material available on the Platform infringes your copyright, you may submit a notice containing: Identification of the copyrighted work, Identification of the allegedly infringing material, Contact information, Statement of good-faith belief, Statement under penalty of perjury. Copyright notices should be sent to: admin@luxartmedia.com. Luxart LLC reserves the right to request additional information before taking action.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. CONTACT INFORMATION</h2>
            <p className="text-gray-700">Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
