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
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. AGREEMENT TO TERMS', body: 'By accessing and using LightingMasterLC.com (the "Platform"), you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions contained in this Terms of Service Agreement ("Agreement"). This Agreement applies to all users, including but not limited to browsers, vendors, customers, merchants, and/or contributors of content.' },
      { h: '2. USE LICENSE', body: 'Permission is granted to temporarily download one copy of the materials (information or software) on LightingMasterLC.com for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: (a) modifying or copying the materials; (b) using the materials for any commercial purpose, or for any public display (commercial or non-commercial); (c) attempting to decompile or reverse engineer any software contained on LightingMasterLC.com; (d) removing any copyright or other proprietary notations from the materials; (e) transferring the materials to another person or "mirroring" the materials on any other server.' },
      { h: '3. DISCLAIMER', body: 'The materials on Luxart LLC\'s web site are provided on an \'as is\' basis. Luxart LLC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.' },
      { h: '4. LIMITATIONS', body: 'In no event shall Luxart LLC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on LightingMasterLC.com, even if Luxart LLC or a Luxart LLC authorized representative has been notified orally or in writing of the possibility of such damage.' },
      { h: '5. ACCURACY OF MATERIALS', body: 'The materials appearing on LightingMasterLC.com could include technical, typographical, or photographic errors. Luxart LLC does not warrant that any of the materials on its web site are accurate, complete, or current. Luxart LLC may make changes to the materials contained on its web site at any time without notice.' },
      { h: '6. MATERIALS AND LINKS', body: 'Luxart LLC has not reviewed all of the sites linked to its web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Luxart LLC of the site. Use of any such linked web site is at the user\'s own risk. If you find a link that you believe is inappropriate, please contact us.' },
      { h: '7. MODIFICATIONS', body: 'Luxart LLC may revise these terms of service for its web site at any time without notice. By using this web site, you are agreeing to be bound by the then current version of these terms of service.' },
      { h: '8. GOVERNING LAW', body: 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts located in the United States.' },
      { h: '9. ACCOUNT RESPONSIBILITY', body: 'You are responsible for all activity that occurs under your account. You agree to notify Luxart LLC immediately of any unauthorized use of your account or password. Luxart LLC will not be liable for any loss or damage arising from your failure to maintain the confidentiality of your password or account information.' },
      { h: '10. PAYMENT AND SUBSCRIPTIONS', body: 'All purchases on the Platform are subject to acceptance and processing by Luxart LLC. By making a purchase, you authorize Luxart LLC to charge your payment method. Subscription fees are non-refundable except as expressly provided in our Refund Policy. You remain responsible for all charges incurred on your account.' },
    ],
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. INTRODUCTION', body: 'This Privacy Policy explains how Luxart LLC ("Company," "we," "our," or "us") collects, uses, shares, and protects your personal information through LightingMasterLC.com ("Platform"). Your privacy is important to us. If you do not agree with this Privacy Policy, please do not use the Platform.' },
      { h: '2. INFORMATION WE COLLECT', body: 'We collect information you provide directly: name, email address, professional firm/company, professional role, geographic location, and password. We also automatically collect usage data including but not limited to: lesson progress and completion status, practice exam attempts and scores, time spent on lessons, bookmarks and saved notes, course access logs, browser type and version, IP address, and device type.' },
      { h: '3. HOW WE USE YOUR INFORMATION', body: 'We use your information to: provide, maintain, and improve the Platform; process payments and send transactional emails; track your individual learning progress and course completion; send product updates and announcements (which you can opt out of at any time); comply with legal and regulatory obligations; prevent fraud, abuse, and security incidents; and perform analytics to improve user experience.' },
      { h: '4. DATA RETENTION', body: 'We retain your account data for the duration of your subscription plus twelve (12) months thereafter, after which it is securely deleted. Payment records are retained for seven (7) years as required by US federal tax law. You may request earlier deletion by contacting admin@luxartmedia.com.' },
      { h: '5. SHARING OF INFORMATION', body: 'We do not sell your personal information. We may share information with: payment processors (Stripe, Inc.) for payment processing and fraud prevention; email service providers for transactional communications; cloud infrastructure providers who are bound by confidentiality agreements; and law enforcement or government agencies when required by law or court order. We may also share aggregated, de-identified information for research and analytics.' },
      { h: '6. SECURITY', body: 'We implement industry-standard security measures including TLS 1.3 encryption for data in transit, bcrypt password hashing for stored passwords, regular security audits, and access controls limiting employee data access to job functions only. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.' },
      { h: '7. YOUR RIGHTS', body: 'You have the right to access, correct, export, or delete your personal data. Submit requests to admin@luxartmedia.com. We will respond within 30 calendar days. You have the right to withdraw consent for marketing communications at any time. We will not discriminate against you for exercising these rights.' },
      { h: '8. THIRD-PARTY LINKS AND SERVICES', body: 'The Platform may contain links to third-party websites. This Privacy Policy does not apply to those external sites, and we are not responsible for their privacy practices. We recommend reviewing the privacy policies of any third-party services before providing your information.' },
      { h: '9. COOKIES AND TRACKING TECHNOLOGIES', body: 'We use cookies, web beacons, and similar technologies to enhance your experience. Essential cookies are required for platform functionality. Analytics cookies help us understand usage patterns. You can manage cookie preferences in your browser settings. For more information, see our Cookie Policy.' },
      { h: '10. CHANGES TO THIS POLICY', body: 'We may update this Privacy Policy at any time. Material changes will be communicated via email at least 14 days before taking effect. Continued use of the Platform after changes constitutes your acceptance of the updated Privacy Policy. The "Effective Date" at the top of this policy reflects the last update.' },
      { h: '11. CONTACT US', body: 'If you have questions about this Privacy Policy or our privacy practices, please contact us at admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },

  'acceptable-use-policy': {
    title: 'Acceptable Use Policy',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. PURPOSE', body: 'This Acceptable Use Policy ("AUP") governs the use of LightingMasterLC.com ("Platform") and all related services operated by Luxart LLC ("Company," "we," "our," or "us"). This Policy supplements the Terms of Service and applies to all users, visitors, subscribers, corporate license holders, affiliates, and participants. By using the Platform, you agree to comply with this Policy.' },
      { h: '2. GENERAL CONDUCT REQUIREMENTS', body: 'Users must: Use the Platform lawfully. Respect other users. Protect account credentials. Provide accurate information. Follow all applicable laws and regulations. Users are responsible for all activity occurring under their accounts.' },
      { h: '3. ACCOUNT SHARING PROHIBITED', body: 'Unless expressly authorized through a Corporate or Team License: Users may not share usernames or passwords, allow third parties to access accounts, use another person\'s account, permit simultaneous use by multiple individuals, resell access, or circumvent user limits. Detection of account sharing may result in: Immediate suspension, Account termination, Certificate revocation, Loss of subscription access, Legal action.' },
      { h: '4. EDUCATIONAL INTEGRITY', body: 'Users may not: Misrepresent course completion, Falsify certificates, Cheat on assessments, Share exam questions, Share quizzes, Distribute practice tests, Misrepresent educational credentials, Impersonate other users. Luxart LLC reserves the right to invalidate educational records obtained through misconduct.' },
      { h: '5. FORUM AND COMMUNITY STANDARDS', body: 'Users may submit comments, reviews, and forum discussions. Users may not post: Harassing content, Threatening content, Defamatory statements, Hate speech, Discriminatory content, Obscene content, Illegal content, Fraudulent content, Misleading educational information, Spam, Advertising without permission. Luxart LLC reserves sole discretion in determining whether content violates this Policy.' },
      { h: '6. PROHIBITED TECHNICAL ACTIVITIES', body: 'Users may not: Attempt unauthorized access, Attempt to access restricted areas, Circumvent security measures, Bypass authentication systems, Use stolen credentials. Users may not engage in interference: Disrupt Platform operations, Overload systems, Interfere with servers, Launch denial-of-service attacks. Users may not engage in reverse engineering: Reverse engineer software, Decompile software, Disassemble software, Analyze source code without authorization. Users may not perform security testing: Vulnerability scanning, Penetration testing, Security probing, Exploit testing, without prior written authorization from Luxart LLC.' },
      { h: '7. ANTI-SCRAPING POLICY', body: 'Users may not: Scrape content, Harvest data, Use automated collection tools, Copy databases, Extract educational materials, Download content through automated means. This prohibition applies regardless of whether access is manual or automated.' },
      { h: '8. ARTIFICIAL INTELLIGENCE RESTRICTIONS', body: 'Users may not use Platform content to: Train AI systems, Fine-tune machine learning models, Build educational datasets, Generate derivative training materials, Create competing AI products. This restriction applies to: Commercial AI systems, Internal AI systems, Public AI systems, Open-source AI systems, unless express written authorization is provided by Luxart LLC.' },
      { h: '9. INTELLECTUAL PROPERTY VIOLATIONS', body: 'Users may not: Copy courses, Reproduce content, Redistribute materials, Record lessons, Publish educational content, Share paid materials, Sell Company content. Unauthorized use constitutes a violation of this Policy.' },
      { h: '10. FRAUD AND ABUSE', body: 'Users may not engage in: Fraud, Chargeback abuse, Identity misrepresentation, Credential theft, False account creation, Subscription abuse, Payment fraud, Circumvention of restrictions.' },
      { h: '11. MARKETING AND ADVERTISING RESTRICTIONS', body: 'Users may not: Send unsolicited advertisements, Promote unrelated products, Conduct unauthorized solicitations, Recruit users for competing platforms, Use the Platform for commercial marketing without authorization.' },
      { h: '12. MONITORING AND INVESTIGATION', body: 'Luxart LLC reserves the right to monitor Platform activity for: Security purposes, Fraud prevention, Compliance enforcement, Abuse detection, Intellectual property protection. Users consent to such monitoring by using the Platform.' },
      { h: '13. ENFORCEMENT ACTIONS', body: 'Luxart LLC may take any action deemed necessary to protect the Platform, including: Content removal, Warning notices, Temporary suspension, Permanent suspension, Account termination, Certificate revocation, IP blocking, Device blocking, Legal action. Enforcement actions may occur without prior notice.' },
      { h: '14. NO OBLIGATION TO HOST CONTENT', body: 'Luxart LLC is not obligated to: Publish user content, Maintain user content, Preserve forum discussions, Retain reviews, Restore deleted content. User-generated content may be removed at any time.' },
      { h: '15. REPORTING VIOLATIONS', body: 'Suspected violations may be reported to: admin@luxartmedia.com. Luxart LLC reserves the right to investigate all reports and determine appropriate action.' },
      { h: '16. RESERVATION OF RIGHTS', body: 'Luxart LLC reserves all rights necessary to: Protect Platform integrity, Protect educational content, Protect intellectual property, Protect users, Enforce agreements. Nothing in this Policy limits any rights available under law or contract.' },
      { h: '17. CHANGES TO THIS POLICY', body: 'Luxart LLC may modify this Policy at any time. Updated versions become effective immediately upon publication. Continued use of the Platform constitutes acceptance of revised terms.' },
      { h: '18. CONTACT INFORMATION', body: 'Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com.' },
    ],
  },

  'cookie-policy': {
    title: 'Cookie Policy',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. INTRODUCTION', body: 'This Cookie Policy explains how Luxart LLC uses cookies and similar tracking technologies on LightingMasterLC.com. By continuing to use the Platform, you consent to the use of cookies as described in this Policy, subject to applicable laws and consent requirements.' },
      { h: '2. WHAT ARE COOKIES?', body: 'Cookies are small text files stored on your device when you visit a website. Cookies help websites: Function properly, Remember preferences, Improve performance, Analyze traffic, Enhance security, Personalize experiences.' },
      { h: '3. TYPES OF COOKIES WE USE', body: 'Essential Cookies: These cookies are necessary for operation of the Platform. Examples include: Login authentication, Session management, Security verification, Fraud prevention, User account access. Without these cookies, portions of the Platform may not function properly. Functional Cookies: Functional cookies help remember user preferences such as: Language settings, Display preferences, User choices, Platform settings. Analytics Cookies: Analytics cookies help us understand: Visitor behavior, Website performance, Traffic sources, Content effectiveness. We currently use Google Analytics. Analytics data may include: Device information, Browser information, Pages visited, Time spent on pages, General geographic information. Marketing Cookies: Marketing cookies may be used to: Measure campaign performance, Deliver relevant communications, Understand user interests, Improve promotional efforts. These cookies may be set by us or trusted third-party providers.' },
      { h: '4. THIRD-PARTY COOKIES', body: 'Third-party providers may place cookies through the Platform. Examples may include: Google Analytics, Stripe, Email marketing platforms, Hosting providers. These third parties maintain their own privacy policies.' },
      { h: '5. COOKIE CONSENT', body: 'Where required by law, users may be presented with a cookie consent banner allowing them to: Accept all cookies, Reject non-essential cookies, Customize preferences. Consent choices may be modified later through browser settings or available cookie preference tools.' },
      { h: '6. MANAGING COOKIES', body: 'Users may control cookies through browser settings. Most browsers allow users to: Delete cookies, Block cookies, Restrict cookies, Receive notifications before cookies are stored. Disabling cookies may impact Platform functionality.' },
      { h: '7. DO NOT TRACK SIGNALS', body: 'The Platform currently does not respond to browser-based "Do Not Track" signals because there is no universally accepted standard governing such signals.' },
      { h: '8. INTERNATIONAL USERS', body: 'Users located in jurisdictions with enhanced privacy protections may have additional rights regarding cookies and tracking technologies. Where required by law, Luxart LLC will obtain consent before placing certain categories of cookies.' },
      { h: '9. CHANGES TO THIS POLICY', body: 'Luxart LLC may update this Cookie Policy at any time. Changes become effective upon publication. Continued use of the Platform constitutes acceptance of revised terms.' },
      { h: '10. CONTACT INFORMATION', body: 'Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com.' },
    ],
  },

  'refund-policy': {
    title: 'Refund Policy',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. OVERVIEW', body: 'This Refund Policy governs all purchases made through LightingMasterLC.com ("Platform") operated by Luxart LLC ("Company," "we," "our," or "us"). By purchasing any subscription, course, training program, educational content, team license, corporate license, continuing education offering, or other digital product through the Platform, you agree to this Refund Policy. Because the Platform provides immediate access to digital educational content, all sales are subject to the restrictions outlined below.' },
      { h: '2. DIGITAL PRODUCTS AND EDUCATIONAL SERVICES', body: 'The Platform provides digital educational products and services, including but not limited to: Online courses, Educational lessons, Audio content, Podcasts, Learning materials, Assessments, Practice examinations, Certificate programs, Continuing education content, Subscription services, Team licenses, Corporate licenses. Upon purchase, users receive immediate access to digital content. Due to the nature of digital products, refunds are limited.' },
      { h: '3. NO REFUNDS AFTER COURSE CONSUMPTION', body: 'A user becomes ineligible for a refund upon the earliest occurrence of any of the following: A. Completion of Three (3) Lessons: Once a user completes three (3) lessons within any purchased course, subscription, or learning program, the purchase becomes non-refundable. B. Significant Consumption of Content: Luxart LLC reserves the right to determine whether a substantial portion of purchased content has been accessed, viewed, streamed, completed, or otherwise consumed. If substantial consumption has occurred, no refund will be issued. C. Certificate Issuance: Once a certificate has been generated, awarded, downloaded, or issued, no refund will be provided. D. Account Misuse: Refunds will not be granted to users whose accounts are suspended, restricted, or terminated due to violations of Platform policies.' },
      { h: '4. SUBSCRIPTION PURCHASES', body: 'All subscriptions provide access to digital educational content. Users are responsible for evaluating the Platform before purchasing. Subscription fees are non-refundable except where required by applicable law. Failure to use the Platform does not create entitlement to a refund.' },
      { h: '5. MANUAL RENEWAL PLANS', body: 'Subscriptions offered by LightingMasterLC.com do not automatically renew unless explicitly stated otherwise during checkout. Users are solely responsible for renewing access if continued access is desired. Failure to renew does not entitle users to refunds, credits, extensions, or special pricing.' },
      { h: '6. FREE TIER ACCESS', body: 'The Platform may offer free content, lessons, previews, demonstrations, or trial features. The existence of free content allows prospective users to evaluate the Platform before purchasing. Purchases made after access to free content are considered informed purchases.' },
      { h: '7. TECHNICAL ISSUES', body: 'If a verified technical issue prevents access to purchased content, Luxart LLC may, at its sole discretion: Restore access, Extend subscription periods, Provide technical assistance, Issue account credits. Technical issues do not automatically qualify a purchase for a refund.' },
      { h: '8. NON-REFUNDABLE SITUATIONS', body: 'Refunds will not be issued for: Failure to pass the LC Examination, Failure to obtain certification, Failure to complete a course, Lack of usage, Change of career goals, Change of employment status, User dissatisfaction unrelated to a material defect, Internet connectivity issues, Browser compatibility issues, Device compatibility issues, Scheduling conflicts, Personal circumstances, User misunderstanding of course objectives, Violations of Terms of Service.' },
      { h: '9. CHARGEBACKS AND PAYMENT DISPUTES', body: 'Users agree to contact Luxart LLC before initiating a chargeback or payment dispute. If a user initiates a chargeback after receiving access to digital content, Luxart LLC reserves the right to: Suspend the account, Terminate access, Revoke certificates, Block future purchases, Contest the chargeback using account records and usage data. Evidence may include: Login history, Course progress, Lesson completion records, Certificate issuance records, Subscription records, Access logs.' },
      { h: '10. FRAUD PREVENTION', body: 'Luxart LLC reserves the right to deny refunds where there is evidence of: Fraud, Account sharing, Credential sharing, Unauthorized access, Abuse of refund policies, Multiple refund requests, Misrepresentation.' },
      { h: '11. TEAM AND CORPORATE LICENSES', body: 'Corporate and Team License purchases are non-refundable once access credentials have been issued or seats have been provisioned. Unused seats do not qualify for refunds. Changes in staffing, employment status, organizational structure, or participation levels do not create refund eligibility.' },
      { h: '12. CONTINUING EDUCATION PROGRAMS', body: 'Continuing education courses, professional development programs, and certificate-based training are subject to this Refund Policy unless otherwise stated in writing. Completion of coursework, assessments, or certificate requirements renders purchases non-refundable.' },
      { h: '13. DISCRETIONARY REFUNDS', body: 'Nothing in this Policy obligates Luxart LLC to provide refunds. However, Luxart LLC may, at its sole discretion, provide refunds, credits, extensions, or accommodations in exceptional circumstances. Any such accommodation shall not establish precedent or create future obligations.' },
      { h: '14. LIMITATION OF LIABILITY', body: 'To the maximum extent permitted by law, Luxart LLC shall not be liable for indirect, incidental, consequential, special, or punitive damages arising from purchases made through the Platform. Refunds, where approved, shall not exceed the amount originally paid by the user for the affected purchase.' },
      { h: '15. CHANGES TO THIS REFUND POLICY', body: 'Luxart LLC may update this Refund Policy at any time. Changes become effective upon publication on the Website. Purchases made after publication of revised terms shall be governed by the updated Refund Policy.' },
      { h: '16. CONTACT INFORMATION', body: 'Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com. Questions regarding refunds should be directed to the email address above.' },
    ],
  },

  'copyright-ip-policy': {
    title: 'Copyright & Intellectual Property Policy',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. OWNERSHIP OF INTELLECTUAL PROPERTY', body: 'All content available through LightingMasterLC.com ("Platform") is owned by Luxart LLC or its licensors and is protected by United States and international copyright, trademark, trade secret, unfair competition, and intellectual property laws. All rights not expressly granted are reserved. Nothing contained on the Platform transfers ownership of any intellectual property to users.' },
      { h: '2. PROTECTED CONTENT', body: 'Protected content includes, but is not limited to: Educational Content (Courses, Lessons, Training materials, Learning modules, Continuing education content, LC examination preparation materials, Assessments, Practice tests, Quizzes, Question banks, Educational methodologies), Written Content (Articles, Study guides, Explanations, Course descriptions, Learning objectives, Technical documentation, Blog posts, Marketing materials), Audio Content (Podcasts, Narrated lessons, Audio recordings, Educational presentations, Interviews, Webinars), Visual Content (Graphics, Diagrams, Illustrations, Course images, Infographics, Logos, Website design elements, User interface elements), Technology Assets (Databases, Software, Code, APIs, Platform architecture, Course structures, Learning paths, Certificate generation systems), Certificates (Certificate templates, Certificate designs, Verification systems, Completion records).' },
      { h: '3. LIMITED LICENSE TO USERS', body: 'Subject to compliance with all applicable agreements, Luxart LLC grants users a limited, non-exclusive, non-transferable, revocable license to: Access purchased content, View educational materials, Stream authorized content, Participate in courses, Download authorized certificates. This license is personal to the registered user and may not be transferred, assigned, sublicensed, or shared.' },
      { h: '4. PROHIBITED ACTIVITIES', body: 'Users may not directly or indirectly: Copy or Reproduce Content (Copy lessons, Copy assessments, Copy practice questions, Copy course structures, Copy educational materials), Redistribute Content (Share content with third parties, Post content online, Upload content to file-sharing sites, Distribute content through social media, Publish course materials), Commercial Exploitation (Sell content, License content, Rent content, Resell subscriptions, Build competing educational products), Recording Activities (Screen record lessons, Record audio content, Capture webinars, Create screenshots for redistribution, Archive content outside authorized systems), Data Collection Activities (Scrape content, Crawl content, Data mine content, Extract databases, Harvest educational materials, Use bots or automated collection tools).' },
      { h: '5. ARTIFICIAL INTELLIGENCE RESTRICTIONS', body: 'Without prior written permission from Luxart LLC, users may not: Use Platform content to train AI models, Use course materials as AI datasets, Feed content into machine learning systems, Generate derivative educational products using Platform content, Extract question banks for AI training. This prohibition applies to: Public AI systems, Private AI systems, Commercial AI systems, Internal AI systems, Large language models, Machine learning models.' },
      { h: '6. LC EXAM PREPARATION MATERIALS', body: 'Any LC examination preparation materials, study guides, quizzes, assessments, practice questions, explanations, learning aids, or educational resources provided through the Platform are proprietary educational content. Users may not: Reproduce practice questions, Share question banks, Publish assessments, Create competing exam preparation products, Distribute study materials. Unauthorized use may result in immediate legal action.' },
      { h: '7. CERTIFICATE PROTECTION', body: 'Certificates issued through the Platform may not be: Altered, Modified, Forged, Sold, Licensed, Misrepresented. Luxart LLC reserves the right to revoke certificates obtained through: Fraud, Account sharing, Unauthorized access, Misrepresentation.' },
      { h: '8. TRADEMARKS', body: 'The following may constitute trademarks, service marks, trade dress, or proprietary branding of Luxart LLC: LightingMasterLC, LightingMasterLC.com, Associated logos, Course names, Program names, Educational brands. Users may not use Company trademarks without prior written consent.' },
      { h: '9. COPYRIGHT INFRINGEMENT REPORTING', body: 'If you believe material available on the Platform infringes your copyright, you may submit a notice containing: Identification of the copyrighted work, Identification of the allegedly infringing material, Contact information, Statement of good-faith belief, Statement under penalty of perjury. Copyright notices should be sent to: admin@luxartmedia.com. Luxart LLC reserves the right to request additional information before taking action.' },
      { h: '10. REPEAT INFRINGERS', body: 'Luxart LLC maintains a policy of terminating accounts belonging to repeat infringers where appropriate. We reserve the right to: Suspend accounts, Revoke access, Remove content, Permanently terminate users.' },
      { h: '11. ENFORCEMENT RIGHTS', body: 'Luxart LLC reserves all legal and equitable remedies available under applicable law. Remedies may include: Injunctive relief, Temporary restraining orders, Permanent injunctions, Actual damages, Statutory damages, Attorneys\' fees, Expert witness fees, Investigation costs, Collection costs.' },
      { h: '12. MONITORING AND INVESTIGATION', body: 'Luxart LLC may monitor Platform activity to detect: Copyright infringement, Unauthorized distribution, Account sharing, Scraping, AI training violations, Misuse of educational materials. Users consent to such monitoring as a condition of using the Platform.' },
      { h: '13. RESERVATION OF RIGHTS', body: 'No rights are granted except those expressly stated in writing. Any unauthorized use automatically terminates any license granted under this Policy.' },
      { h: '14. CHANGES TO THIS POLICY', body: 'Luxart LLC may modify this Policy at any time. Updated versions become effective upon publication on the Website. Continued use of the Platform constitutes acceptance of revised terms.' },
      { h: '15. CONTACT INFORMATION', body: 'Luxart LLC. Website: LightingMasterLC.com. Email: admin@luxartmedia.com.' },
    ],
  },

  'certificate-disclaimer': {
    title: 'Certificate Disclaimer',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: 'CERTIFICATE PURPOSE', body: 'Certificates issued through LightingMasterLC.com are provided solely as evidence that a user has completed the applicable course, program, lesson series, assessment, or educational requirement established by Luxart LLC. Certificates do not constitute: Professional licensure, Government approval, Regulatory approval, Professional engineering certification, Professional lighting certification, Employment qualification, Proof of competency, Academic credit, Accreditation.' },
      { h: 'NO GUARANTEE OF OUTCOMES', body: 'Completion of any course or issuance of any certificate does not guarantee: Passing the LC Examination, Passing any certification examination, Obtaining professional credentials, Employment opportunities, Promotions, Salary increases, Continuing education approval by third parties. Users remain solely responsible for satisfying any requirements imposed by licensing boards, employers, professional organizations, accreditation agencies, or certification bodies.' },
      { h: 'NO NCQLP AFFILIATION', body: 'LightingMasterLC.com and Luxart LLC are not affiliated with, endorsed by, sponsored by, approved by, or otherwise associated with the National Council on Qualifications for the Lighting Professions (NCQLP), unless expressly stated in writing. References to the LC Examination are provided solely for educational and informational purposes.' },
      { h: 'CERTIFICATE VERIFICATION', body: 'Luxart LLC reserves the right to verify, revoke, invalidate, suspend, or refuse recognition of any certificate obtained through: Fraud, Misrepresentation, Account sharing, Unauthorized access, Policy violations, Technical manipulation.' },
      { h: 'OWNERSHIP OF CERTIFICATES', body: 'Certificates remain intellectual property of Luxart LLC. Users receive a limited license to display certificates as evidence of course completion. Certificates may not be altered, modified, falsified, sold, licensed, transferred, or used in a misleading manner.' },
      { h: 'CONTINUING EDUCATION DISCLAIMER', body: 'Where a course is marketed as eligible for continuing education credit, users remain responsible for confirming acceptance by the applicable accrediting organization, licensing authority, employer, or educational institution. Luxart LLC does not guarantee acceptance by any third party.' },
      { h: 'CONTACT INFORMATION', body: 'Questions regarding certificates should be directed to: admin@luxartmedia.com.' },
    ],
  },

  'affiliate-terms': {
    title: 'Affiliate Program Terms',
    subtitle: 'LightingMasterLC.com Operated by Luxart LLC',
    effective: 'June 18, 2026',
    sections: [
      { h: '1. PROGRAM OVERVIEW', body: 'This Affiliate Program Terms and Conditions ("Agreement") governs participation in the LightingMasterLC.com Affiliate Program operated by Luxart LLC ("Company," "we," "our," or "us"). By enrolling in the Affiliate Program, you ("Affiliate") agree to be bound by these terms. The Affiliate Program allows eligible individuals to earn commissions by promoting LightingMasterLC.com and referring customers.' },
      { h: '2. ELIGIBILITY', body: 'Affiliates must be at least 18 years old and have a valid tax identification number (US residents) or equivalent. Employees of Luxart LLC and their immediate family members are not eligible. We reserve the right to deny enrollment or terminate participation at any time for any reason.' },
      { h: '3. COMMISSION STRUCTURE', body: 'Affiliates earn commission on qualifying referrals as set forth in the Affiliate Dashboard. Commission rates may vary by offer and product. We may modify commission structures with 30 days\' notice. Commission is calculated based on the net purchase amount after refunds, chargebacks, or reversals.' },
      { h: '4. PROMOTIONAL GUIDELINES', body: 'Affiliates may not: Use misleading or false advertising claims, Misrepresent the Platform or its benefits, Violate trademark or copyright laws, Use spam or unsolicited email, Purchase branded keywords without authorization, Create content that implies endorsement by Luxart LLC without permission. All promotional materials must be pre-approved by Luxart LLC.' },
      { h: '5. PAYMENT TERMS', body: 'Commissions are calculated monthly and paid via the method specified in your Affiliate account within 30 days of the end of each month. Minimum payout threshold is $50. Luxart LLC is not responsible for taxes, withholding, or payment method fees incurred by Affiliates.' },
      { h: '6. TERMINATION', body: 'Either party may terminate this Agreement with 14 days\' written notice. Unpaid commissions will be paid within 60 days of termination. Upon termination, all affiliate links and promotional rights are revoked immediately. Affiliates may not earn commission on sales initiated before termination.' },
      { h: '7. CONTACT', body: 'For questions about the Affiliate Program: admin@luxartmedia.com. Luxart LLC, United States.' },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(DOCS).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const doc = DOCS[params.slug]
  if (!doc) return {}

  return {
    title: `${doc.title} | LC · Lighting Master`,
    description: doc.subtitle,
    robots: 'index, follow',
    openGraph: {
      title: doc.title,
      description: doc.subtitle,
      type: 'website',
    },
  }
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const doc = DOCS[params.slug]

  if (!doc) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>
        <p className="text-gray-600 text-sm mb-1">{doc.subtitle}</p>
        <p className="text-gray-500 text-xs mb-8">Effective: {doc.effective}</p>

        <div className="prose prose-sm max-w-none">
          {doc.sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.h}</h2>
              <p className="text-gray-700 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
