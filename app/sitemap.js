export default function sitemap() {
  const base = 'https://lightingmasterlc.com'
  const now = new Date().toISOString()
  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: base + '/pricing',       lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: base + '/login',         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: base + '/legal/terms',   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: base + '/legal/privacy', lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
