// lib/pricing.js — safe for both server and client (no Node-only APIs)

export const STRIPE_PRICE_IDS = {
  t1:   'price_1TeKGuCEK8EBA6BtUM7ks3tu',
  t2:   'price_1TeKI4CEK8EBA6BtOe9IFCXR',
  t3:   'price_1TeKOACEK8EBA6Bt5ef4Lxry',
  team: 'price_1TeKSOCEK8EBA6BtPVpVcqH3',
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

// Returns { amountCents, label, priceId, perSeat } or null for contactUs (team ≥10)
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
    if (seats >= 10) return null // contact us
    const perSeat = seats >= 6 ? 28000 : 36000
    return {
      amountCents: perSeat * seats,
      label: `LC · Lighting Master — Team Access (${seats} seats)`,
      priceId: STRIPE_PRICE_IDS.team,
      perSeat,
    }
  }

  return null
}

// ISO string for Dec 31 of current year at 23:59:59 UTC
export function getAccessExpiry() {
  const year = new Date().getUTCFullYear()
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
}
