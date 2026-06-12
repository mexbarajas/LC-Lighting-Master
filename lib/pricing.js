// lib/pricing.js — safe for both server and client (no Node-only APIs)

export const STRIPE_PRICE_IDS = {
  t1:   'price_1TeKGuCEK8EBA6BtUM7ks3tu',
  t2:   'price_1TeKI4CEK8EBA6BtOe9IFCXR',
  t3:   'price_1TeKOACEK8EBA6Bt5ef4Lxry',
  team: 'price_1TeKSOCEK8EBA6BtPVpVcqH3',
}

export const TEAM_TIERS = [
  { minSeats: 2,  maxSeats: 5,   perSeat: 360, label: '2–5 seats'  },
  { minSeats: 6,  maxSeats: 10,  perSeat: 280, label: '6–10 seats' },
  { minSeats: 11, maxSeats: null, perSeat: null, label: '11+ seats', contact: true },
]

export function getTeamPerSeat(seats) {
  const tier = TEAM_TIERS.find(t =>
    seats >= t.minSeats && (t.maxSeats === null || seats <= t.maxSeats))
  return tier || TEAM_TIERS[0]
}

export const STUDENT_DISCOUNT = 0.40

export function isStudentEmail(email) {
  return typeof email === 'string' &&
    /\.edu$/i.test(email.trim().split('@')[1] || '')
}

export function studentPrice(amount) {
  return Math.round(amount * (1 - STUDENT_DISCOUNT))
}

// May–Jun  → earlyBird   T2 $395, T3 $595
// Jul–Oct  → peak        T2 $495, T3 $695
// Nov–Apr  → standard    T2 $595, T3 $695
export function getCurrentSeason() {
  const month = new Date().getUTCMonth() + 1 // 1-indexed
  if (month === 5 || month === 6) {
    return {
      season: 'earlyBird',
      label: 'Early Bird',
      banner: 'Early Bird — Lowest rate of the year. Lock in now.',
      t2Cents: 39500,
      t3Cents: 59500,
    }
  }
  if (month >= 7 && month <= 10) {
    return {
      season: 'peak',
      label: 'Peak Season',
      banner: 'Peak Season — Exam window approaching.',
      t2Cents: 49500,
      t3Cents: 69500,
    }
  }
  return {
    season: 'standard',
    label: 'Standard',
    banner: null,
    t2Cents: 59500,
    t3Cents: 69500,
  }
}

// Returns { amountCents, label, priceId, perSeat } or null for contactUs (team 11+)
export function getPriceForTier(tier, seats = 1, examAddon = false) {
  const { t2Cents, t3Cents } = getCurrentSeason()

  if (tier === 't1') {
    return {
      amountCents: 25000,
      label: 'LC · Lighting Master — Test Engine',
      priceId: STRIPE_PRICE_IDS.t1,
      perSeat: null,
    }
  }

  if (tier === 't2') {
    const addonCents = examAddon ? 20000 : 0
    return {
      amountCents: t2Cents + addonCents,
      label: examAddon
        ? 'LC · Lighting Master — Full Course + Exam Add-on'
        : 'LC · Lighting Master — Full Course',
      priceId: STRIPE_PRICE_IDS.t2,
      perSeat: null,
    }
  }

  if (tier === 't3') {
    return {
      amountCents: t3Cents,
      label: 'LC · Lighting Master — Course + Exam',
      priceId: STRIPE_PRICE_IDS.t3,
      perSeat: null,
    }
  }

  if (tier === 'team') {
    const tierObj = getTeamPerSeat(seats)
    if (tierObj.contact) return null
    const perSeatCents = tierObj.perSeat * 100
    return {
      amountCents: perSeatCents * Number(seats),
      label: `LC · Lighting Master — Team Access (${seats} seats)`,
      priceId: STRIPE_PRICE_IDS.team,
      perSeat: perSeatCents,
    }
  }

  return null
}

// ISO string for Dec 31 of current year at 23:59:59 UTC
export function getAccessExpiry() {
  const year = new Date().getUTCFullYear()
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
}
