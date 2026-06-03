// lib/pricing.js — safe for both server and client (no Node-only APIs)

const SEASONAL_PRICING = {
  earlyBird:  { months: [5, 6],               t2: 39500, t3: 59500, label: 'Early Bird',  banner: 'Lock in now — lowest rate of the year.' },
  peak:       { months: [7, 8, 9],             t2: 49500, t3: 69500, label: 'Peak Season', banner: 'Exam window approaching — most designers enroll now.' },
  lastMinute: { months: [10],                  t2: 49500, t3: 69500, label: 'Last-Minute', banner: 'Exam window open. One shot to find your gaps before test day.' },
  standard:   { months: [11, 12, 1, 2, 3, 4], t2: 59500, t3: 69500, label: 'Standard',    banner: null },
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1 // 1-indexed
  for (const [season, data] of Object.entries(SEASONAL_PRICING)) {
    if (data.months.includes(month)) {
      return { season, label: data.label, banner: data.banner, t2: data.t2, t3: data.t3 }
    }
  }
  const s = SEASONAL_PRICING.standard
  return { season: 'standard', label: s.label, banner: s.banner, t2: s.t2, t3: s.t3 }
}

export function getPriceForTier(tier, seats = 1) {
  const { t2, t3 } = getCurrentSeason()
  if (tier === 't1') return 25000
  if (tier === 't2') return t2
  if (tier === 't3') return t3
  if (tier === 'team') {
    if (seats >= 10) return null // contact us
    const rate = seats >= 6 ? 28000 : 36000
    return rate * seats
  }
  return 0
}

export function getSeasonBanner() {
  return getCurrentSeason().banner
}

export const TIER_FEATURES = {
  t1: {
    name: 'Test Engine',
    tag: 'Tier 1',
    desc: 'Already studied? Use our LC practice engine as your final accuracy check before exam day.',
    features: [
      '129 LC practice questions',
      '13 topic breakdown',
      '25-sec timed exam mode',
      'Speed bonuses & streaks',
      'Per-topic accuracy report',
      'Unlimited attempts',
    ],
  },
  t2: {
    name: 'Full Course',
    tag: 'Tier 2',
    desc: 'All 12 modules structured around the LC exam blueprint. Certificate + 24 CEU hours.',
    features: [
      'All 12 modules · 74 lessons',
      'Audio narration every lesson',
      'Bookmarks & notes hub',
      'Certificate of completion',
      '24 CEU credit hours',
    ],
    addon: 'Add Test Engine for $200',
  },
  t3: {
    name: 'Course + Exam',
    tag: 'Tier 3',
    desc: 'The complete package — all 12 modules plus the LC practice exam.',
    features: [
      'Everything in Full Course',
      'Test Engine included',
      '129 LC practice questions',
      'Unlimited exam attempts',
      'Topic accuracy analytics',
      'Priority support',
    ],
  },
}
