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

// 9 calendar weeks for Mooscles
export const WEEKS: WeekDefinition[] = [
  {
    weekNumber: 1,
    label: 'Semaine 1 (Rattrapage)',
    startDate: '2026-10-19',
    endDate: '2026-10-25',
    isPast: true,
    isCurrent: false,
    isFuture: false,
  },
  {
    weekNumber: 2,
    label: 'Semaine 2 (En cours 🔥)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    isPast: false,
    isCurrent: true,
    isFuture: false,
  },
  {
    weekNumber: 3,
    label: 'Semaine 3',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 4,
    label: 'Semaine 4',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 5,
    label: 'Semaine 5 (Mi-parcours ⚡)',
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 6,
    label: 'Semaine 6',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 7,
    label: 'Semaine 7',
    startDate: '2026-11-30',
    endDate: '2026-12-06',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 8,
    label: 'Semaine 8 (Sprint final)',
    startDate: '2026-12-07',
    endDate: '2026-12-13',
    isPast: false,
    isCurrent: false,
    isFuture: true,
  },
  {
    weekNumber: 9,
    label: 'Semaine 9 (Mode FULL 🚀)',
    startDate: '2026-12-14',
    endDate: '2026-12-17',
    isPast: false,
    isCurrent: false,
    isFuture: true,
    isSpecialFinal: true,
  },
]

export const FUN_REMINDER_MESSAGES = [
  "🐮 Il est 19h ! Tes pecs et tes cuisses t'attendent pour économiser tes sous !",
  "💰 Rappel Mooscles : 1 € économisé = 50 pompes de faites. À toi de jouer !",
  "⏰ 19h pétantes ! Pas d'excuses, même 20 pompes devant Netflix ça compte !",
  "🔥 Ton corps va te remercier... ou la cagnotte va te remercier. Choisis ton camp !",
  "🫡 Petit check Mooscles : 2 minutes de gainage ce soir et tu valides un palier !",
  "👀 Tes potes sont en train de valider leurs squats. Tu vas pas te laisser distancer ?",
]

export const DEFAULT_USERS = [
  { id: 'u1', name: 'David (Moi)', avatar: '🐮', color: '#f59e0b', isCurrentUser: true, role: 'admin' },
  { id: 'u2', name: 'Alexandre', avatar: '🦍', color: '#3b82f6', isCurrentUser: false, role: 'member' },
  { id: 'u3', name: 'Lucas', avatar: '🦁', color: '#10b981', isCurrentUser: false, role: 'member' },
  { id: 'u4', name: 'Thomas', avatar: '🐺', color: '#8b5cf6', isCurrentUser: false, role: 'member' },
  { id: 'u5', name: 'Sarah', avatar: '🦊', color: '#ec4899', isCurrentUser: false, role: 'member' },
  { id: 'u6', name: 'Maxime', avatar: '🐻', color: '#06b6d4', isCurrentUser: false, role: 'member' },
  { id: 'u7', name: 'Clément', avatar: '🦅', color: '#f97316', isCurrentUser: false, role: 'member' },
] as const
