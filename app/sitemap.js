export default function sitemap() {
  const base = 'https://lightingmasterlc.com'
  const now = new Date().toISOString()
  return [
    { url: base,                                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/resources`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/what-is-the-ncqlp-lc-exam`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/ncqlp-exam-dates-2026`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/how-to-become-lighting-certified`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/lighting-certifications-compared`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/ncqlp-practice-questions`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resources/ncqlp-study-guide`,                lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/legal/terms`,                         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/legal/privacy`,                       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/legal/refund`,                        lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/legal/cookies`,                       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
