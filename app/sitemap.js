export default function sitemap() {
  const base = 'https://lightingmasterlc.com'
  const now = new Date().toISOString()

  const resources = [
    'what-is-the-ncqlp-lc-exam',
    'ncqlp-exam-dates-2026',
    'how-to-become-lighting-certified',
    'lighting-certifications-compared',
    'ncqlp-practice-questions',
    'ncqlp-study-guide',
  ]

  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: base + '/pricing',       lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: base + '/resources',     lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    ...resources.map(slug => ({
      url: base + '/resources/' + slug,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    })),
    { url: base + '/legal/terms',   lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: base + '/legal/privacy', lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
