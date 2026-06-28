// lib/pricing.js
// CANONICAL SOURCE OF ALL PRICING CONSTANTS — never hardcode prices elsewhere.

export const INDIVIDUAL_PLANS = {
  t1: {
    label:        'LC Preparation Test',
    description:  'Practice exam access — 180 questions, timed sessions, speed bonuses, and per-topic analytics.',
    price:        250,
    includesExam: true,
    includesCert: false,
    priceEnvKey:  'STRIPE_PRICE_T1',
  },
  t2: {
    label:        'Full Course',
    description:  'Full 72-lesson course with certificate of completion and 24 CEU credit hours. Exam not included.',
    price:        395,
    includesExam: false,
    includesCert: true,
    priceEnvKey:  'STRIPE_PRICE_T2',
  },
  t3: {
    label:        'Full Course + Exam',
    description:  'Full course, practice exam access, completion certificate, and priority support.',
    price:        595,
    includesExam: true,
    includesCert: true,
    priceEnvKey:  'STRIPE_PRICE_T3',
  },
};

export const TEAM_PLANS = {
  course_only: {
    label:        'Course Only',
    description:  'Full 72-lesson course access. Exam not included. Members may add exam access individually for $99.',
    pricePerSeat: 349,
    planType:     'course_only',
    includesExam: false,
  },
  course_exam: {
    label:        'Course + Exam',
    description:  'Full course + up to 5 exam attempts per team member.',
    pricePerSeat: 450,
    planType:     'course_exam',
    includesExam: true,
  },
};

export const TEAM_EXAM_ADDON = {
  label:        'Exam Access Add-On',
  description:  'Because you are part of a team license, you can add exam access for $99. Includes up to 5 exam attempts.',
  price:        99,
  priceEnvKey:  'STRIPE_PRICE_TEAM_EXAM_ADDON',
  includesExam: true,
};

export const TEAM_COURSE_ONLY_PRICE        = 349;
export const TEAM_COURSE_EXAM_PRICE        = 450;
export const TEAM_MEMBER_EXAM_ADD_ON_PRICE = 99;
export const TEAM_REASSIGNMENT_FEE         = 100;
export const EXAM_ATTEMPT_LIMIT            = 5;
export const MIN_TEAM_SEATS                = 5;

export function teamPricePerSeat(planType) {
  return planType === 'course_only'
    ? TEAM_COURSE_ONLY_PRICE
    : TEAM_COURSE_EXAM_PRICE;
}

export function teamOrderTotal(seats, planType) {
  return seats * teamPricePerSeat(planType);
}

export function buildPriceToPlanMap() {
  return {
    [process.env.STRIPE_PRICE_T1]: 't1',
    [process.env.STRIPE_PRICE_T2]: 't2',
    [process.env.STRIPE_PRICE_T3]: 't3',
  };
}

// ── Backward-compatible aliases — corrected shapes ────────────────────────────

// PLANS: individual plan lookup with .name (= .label) and .amount (price in cents)
export const PLANS = Object.fromEntries(
  Object.entries(INDIVIDUAL_PLANS).map(([key, p]) => [
    key,
    { ...p, name: p.label, amount: p.price * 100 },
  ])
)

// TEAM_TIERS: array of seat-count tiers iterated by PricingCard
// Uses course_only price as the entry-level per-seat figure; plan type is chosen separately
export const TEAM_TIERS = [
  {
    minSeats: MIN_TEAM_SEATS,
    maxSeats: null,
    perSeat:  TEAM_COURSE_ONLY_PRICE,
    label:    'Team',
    contact:  false,
  },
]

// TEAM_PLAN_TYPES: plan-type lookup with .name, .perSeat, .hasExam fields
export const TEAM_PLAN_TYPES = Object.fromEntries(
  Object.entries(TEAM_PLANS).map(([key, p]) => [
    key,
    { ...p, name: p.label, perSeat: p.pricePerSeat, hasExam: p.includesExam },
  ])
)

// getTeamPerSeat: takes a seat COUNT (number), returns the matching tier object
export function getTeamPerSeat(seatCount) {
  const tier = TEAM_TIERS.find(
    t => seatCount >= t.minSeats && (t.maxSeats === null || seatCount <= t.maxSeats)
  )
  return tier ?? TEAM_TIERS[TEAM_TIERS.length - 1]
}

// TEAM_PER_SEAT: entry-level per-seat price used in display strings (e.g. "${TEAM_PER_SEAT}/seat")
export const TEAM_PER_SEAT = TEAM_COURSE_ONLY_PRICE

export const REASSIGNMENT_FEE = TEAM_REASSIGNMENT_FEE
