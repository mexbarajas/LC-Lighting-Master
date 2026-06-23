// lib/pricing.js — flat rate pricing, no seasonal logic

export const PLANS = {
  t1: {
    id:          't1',
    name:        'LC Preparation Test',
    price:       250,
    amount:      25000,
    description: 'Full 50-question timed practice exam with detailed explanations.',
    includes:    ['50 timed practice questions','13 NCQLP topic areas','Detailed answer explanations','Score tracking','Unlimited retakes'],
    cta:         'Get the Practice Test',
  },
  t2: {
    id:          't2',
    name:        'Full Course',
    price:       395,
    amount:      39500,
    description: '12 modules, 74 lessons, podcast narration, visual overviews, and progress tracking.',
    includes:    ['74 structured lessons','12 modules','Podcast narration','Visual diagrams','Progress tracking','24 CEU hours','Bookmarks & notes'],
    cta:         'Enroll in Full Course',
  },
  t3: {
    id:          't3',
    name:        'Full Course + Exam',
    price:       595,
    amount:      59500,
    description: 'Everything in Full Course plus the complete 50-question practice exam.',
    includes:    ['Everything in Full Course','50 timed practice questions','Exam score analytics','Best value for exam candidates'],
    cta:         'Enroll — Course + Exam',
    featured:    true,
  },
  exam_addon: {
    id:          'exam_addon',
    name:        'Practice Exam Add-on',
    price:       200,
    amount:      20000,
    description: 'Add the full 50-question exam to your existing Full Course.',
    includes:    ['50 timed questions','Score tracking','Unlimited retakes'],
    cta:         'Add Practice Exam — $200',
  },
}

// ── TEAM PRICING ──────────────────────────────────────────────
export const MIN_TEAM_SEATS              = 5
export const EXAM_ATTEMPT_LIMIT          = 5
export const TEAM_COURSE_ONLY_PRICE      = 349   // per seat
export const TEAM_COURSE_EXAM_PRICE      = 450   // per seat
export const TEAM_MEMBER_EXAM_ADD_ON_PRICE = 99

export const TEAM_PLAN_TYPES = {
  course_only: {
    id:          'course_only',
    name:        'Team Course Only',
    perSeat:     TEAM_COURSE_ONLY_PRICE,
    hasExam:     false,
    description: 'Full course access for every seat. Members can add exam access for $99.',
    includes: [
      'All 12 modules · 74 lessons',
      '24 CEU credit hours',
      'Downloadable completion certificate',
      'Team admin dashboard',
      'Per-member progress tracking',
    ],
  },
  course_exam: {
    id:          'course_exam',
    name:        'Team Course + Exam',
    perSeat:     TEAM_COURSE_EXAM_PRICE,
    hasExam:     true,
    description: 'Full course plus LC practice exam for every seat.',
    includes: [
      'Everything in Course Only',
      '180-question LC practice bank',
      `Up to ${EXAM_ATTEMPT_LIMIT} exam attempts per member`,
      'Per-member exam score analytics',
    ],
  },
}

export function getTeamTotal(planType, seats) {
  const plan = TEAM_PLAN_TYPES[planType]
  if (!plan || seats < MIN_TEAM_SEATS || seats >= 11) return null
  return plan.perSeat * seats
}

// Legacy — kept for backward compat with pre-June-2026 orders without plan_type metadata
export const TEAM_TIERS = [
  { minSeats: 5,  maxSeats: 10,  perSeat: 360, label: '5–10 seats' },
  { minSeats: 11, maxSeats: null, perSeat: null, label: '11+ seats', contact: true },
]
export function getTeamPerSeat(seats) {
  if (seats >= 11) return TEAM_TIERS[1]
  if (seats >= 5)  return TEAM_TIERS[0]
  return null // below minimum — rejected server-side
}

export function isStudentEmail(email) {
  if (!email || typeof email !== 'string') return false
  const lower = email.toLowerCase().trim()
  if (process.env.STUDENT_TEST_EMAIL &&
      lower === process.env.STUDENT_TEST_EMAIL.toLowerCase()) return true
  return /\.edu$/i.test(lower.split('@')[1] || '')
}

// ISO string for Dec 31 of current year at 23:59:59 UTC
export function getAccessExpiry() {
  const year = new Date().getUTCFullYear()
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
}
