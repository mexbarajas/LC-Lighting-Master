// lib/pricing.js
// CANONICAL SOURCE OF ALL PRICING CONSTANTS — never hardcode prices elsewhere.

export const INDIVIDUAL_PLANS = {
  t1: {
    label:        'Course Only',
    description:  'Full 72-lesson course. Exam not included.',
    price:        250,
    includesExam: false,
    includesCert: false,
    priceEnvKey:  'STRIPE_PRICE_T1',
  },
  t2: {
    label:        'Course + Exam',
    description:  'Full course + up to 5 exam attempts.',
    price:        395,
    includesExam: true,
    includesCert: false,
    priceEnvKey:  'STRIPE_PRICE_T2',
  },
  t3: {
    label:        'Course + Exam + Certificate',
    description:  'Full course, 5 exam attempts, and a completion certificate.',
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

// Backward-compatible aliases — importing files depend on these exact shapes. Do not remove.
export const PLANS = {
  t1: { ...INDIVIDUAL_PLANS.t1, name: INDIVIDUAL_PLANS.t1.label, amount: INDIVIDUAL_PLANS.t1.price * 100 },
  t2: { ...INDIVIDUAL_PLANS.t2, name: INDIVIDUAL_PLANS.t2.label, amount: INDIVIDUAL_PLANS.t2.price * 100 },
  t3: { ...INDIVIDUAL_PLANS.t3, name: INDIVIDUAL_PLANS.t3.label, amount: INDIVIDUAL_PLANS.t3.price * 100 },
}
export const TEAM_TIERS = [
  { minSeats: MIN_TEAM_SEATS, maxSeats: 10,   perSeat: TEAM_COURSE_EXAM_PRICE, label: '5–10 seats' },
  { minSeats: 11,             maxSeats: null, perSeat: null,                    label: '11+ seats', contact: true },
]
export const TEAM_PLAN_TYPES = {
  course_only: { ...TEAM_PLANS.course_only, name: TEAM_PLANS.course_only.label, hasExam: TEAM_PLANS.course_only.includesExam, perSeat: TEAM_PLANS.course_only.pricePerSeat },
  course_exam: { ...TEAM_PLANS.course_exam, name: TEAM_PLANS.course_exam.label, hasExam: TEAM_PLANS.course_exam.includesExam, perSeat: TEAM_PLANS.course_exam.pricePerSeat },
}
export function getTeamPerSeat(seats) {
  if (seats >= 11)             return { minSeats: 11,             maxSeats: null, perSeat: null,                    label: '11+ seats', contact: true }
  if (seats >= MIN_TEAM_SEATS) return { minSeats: MIN_TEAM_SEATS, maxSeats: 10,   perSeat: TEAM_COURSE_EXAM_PRICE, label: '5–10 seats' }
  return null
}
