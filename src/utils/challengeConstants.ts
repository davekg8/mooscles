import type { WeekDefinition } from '../types'

export const CHALLENGE_START = '2026-10-19'
export const CHALLENGE_END = '2026-12-17'

export const WEEKLY_TARGETS = {
  pushups: 250,
  squats: 250,
  plankSeconds: 600, // 10 minutes
  tierPushups: 50, // 50 reps per 1/5
  tierSquats: 50, // 50 reps per 1/5
  tierPlankSeconds: 120, // 2 minutes (120s) per 1/5
}

const WEEK_LABELS: Record<number, string> = {
  5: 'Mi-parcours ⚡',
  8: 'Sprint final',
  9: 'Mode FULL 🚀',
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Date du jour (YYYY-MM-DD) à l'heure de Paris */
export function todayInParis(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Les 9 semaines du challenge, avec leur statut calculé selon la date du jour */
export function buildWeeks(today: string): WeekDefinition[] {
  const weeks: WeekDefinition[] = []
  for (let n = 1; n <= 9; n++) {
    const startDate = addDays(CHALLENGE_START, (n - 1) * 7)
    let endDate = addDays(startDate, 6)
    if (endDate > CHALLENGE_END) endDate = CHALLENGE_END
    const isPast = today > endDate
    const isCurrent = today >= startDate && today <= endDate
    const extra = isCurrent ? 'En cours 🔥' : WEEK_LABELS[n]
    weeks.push({
      weekNumber: n,
      label: `Semaine ${n}${extra ? ` (${extra})` : ''}`,
      startDate,
      endDate,
      isPast,
      isCurrent,
      isFuture: today < startDate,
      isSpecialFinal: n === 9,
    })
  }
  return weeks
}

/** Semaine à afficher par défaut : la semaine en cours, sinon la plus proche */
export function defaultWeek(weeks: WeekDefinition[]): WeekDefinition {
  return weeks.find((w) => w.isCurrent) ?? (weeks[0].isFuture ? weeks[0] : weeks[weeks.length - 1])
}

export const FUN_REMINDER_MESSAGES = [
  "🐮 Il est 19h ! Tes pecs et tes cuisses t'attendent pour économiser tes sous !",
  "💰 Rappel Mooscles : 1 € économisé = 50 pompes de faites. À toi de jouer !",
  "⏰ 19h pétantes ! Pas d'excuses, même 20 pompes devant Netflix ça compte !",
  "🔥 Ton corps va te remercier... ou la cagnotte va te remercier. Choisis ton camp !",
  "🫡 Petit check Mooscles : 2 minutes de gainage ce soir et tu valides un palier !",
  "👀 Tes potes sont en train de valider leurs squats. Tu vas pas te laisser distancer ?",
]

export const AVATARS = ['🐮', '🦍', '🦁', '🐺', '🦊', '🐻', '🦅', '🐯', '🐗', '🦈', '🐸', '🦄', '🐼', '🐙', '🦖', '🐝']

export const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#ef4444', '#84cc16', '#eab308']
