import type { WeekScore } from '../types'
import { WEEKLY_TARGETS } from './challengeConstants'

export function calculateWeekScore(
  pushups: number,
  squats: number,
  plankSeconds: number
): WeekScore {
  const pTier = Math.min(5, Math.floor(pushups / WEEKLY_TARGETS.tierPushups))
  const sTier = Math.min(5, Math.floor(squats / WEEKLY_TARGETS.tierSquats))
  const gTier = Math.min(5, Math.floor(plankSeconds / WEEKLY_TARGETS.tierPlankSeconds))

  // The lowest tier is the decisive one (le palier le plus bas fait foi !)
  const finalTier = Math.min(5, pTier, sTier, gTier)
  const fineAmount = Math.max(0, 5 - finalTier)

  // Identify the limiting factor(s)
  let limitingFactor: 'pushups' | 'squats' | 'plank' | 'balanced' = 'balanced'
  if (finalTier < 5) {
    if (pTier === finalTier && sTier > finalTier && gTier > finalTier) {
      limitingFactor = 'pushups'
    } else if (sTier === finalTier && pTier > finalTier && gTier > finalTier) {
      limitingFactor = 'squats'
    } else if (gTier === finalTier && pTier > finalTier && sTier > finalTier) {
      limitingFactor = 'plank'
    } else if (pTier < sTier && pTier < gTier) {
      limitingFactor = 'pushups'
    } else if (sTier < pTier && sTier < gTier) {
      limitingFactor = 'squats'
    } else if (gTier < pTier && gTier < sTier) {
      limitingFactor = 'plank'
    }
  }

  // Next tier delta (how much needed to unlock the next level and save 1€)
  let nextTierNeeded = undefined
  if (finalTier < 5) {
    const targetNextTier = finalTier + 1
    const targetP = targetNextTier * WEEKLY_TARGETS.tierPushups
    const targetS = targetNextTier * WEEKLY_TARGETS.tierSquats
    const targetG = targetNextTier * WEEKLY_TARGETS.tierPlankSeconds

    nextTierNeeded = {
      tier: targetNextTier,
      missingPushups: Math.max(0, targetP - pushups),
      missingSquats: Math.max(0, targetS - squats),
      missingPlankSeconds: Math.max(0, targetG - plankSeconds),
      moneySaved: 1, // Moving from tier N to N+1 saves 1€
    }
  }

  return {
    pushups,
    squats,
    plankSeconds,
    pushupTier: pTier,
    squatTier: sTier,
    plankTier: gTier,
    finalTier,
    fineAmount,
    limitingFactor,
    nextTierNeeded,
  }
}

export function formatSecondsToMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins} min`
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

export function formatTimeDigital(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
