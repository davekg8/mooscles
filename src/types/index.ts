export interface UserProfile {
  id: string
  name: string
  avatar: string
  color: string
  isCurrentUser?: boolean
  role?: 'admin' | 'member'
}

export interface DailyEntry {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  pushups: number
  squats: number
  plankSeconds: number
  notes?: string
  updatedAt: string
}

export interface WeekDefinition {
  weekNumber: number
  label: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  isPast: boolean
  isCurrent: boolean
  isFuture: boolean
  isSpecialFinal?: boolean
}

export interface WeekScore {
  pushups: number
  squats: number
  plankSeconds: number
  pushupTier: number // 0 to 5
  squatTier: number // 0 to 5
  plankTier: number // 0 to 5
  finalTier: number // 0 to 5 (the limiting factor)
  fineAmount: number // 5 - finalTier in €
  limitingFactor: 'pushups' | 'squats' | 'plank' | 'balanced'
  nextTierNeeded?: {
    tier: number
    missingPushups: number
    missingSquats: number
    missingPlankSeconds: number
    moneySaved: number
  }
}

export interface WeeklySettlement {
  id: string
  userId: string
  weekNumber: number
  score: number // 0 to 5
  fineAmount: number // in euros
  isPaid: boolean
  paidAt?: string
  notes?: string
}

export interface CagnotteIdea {
  id: string
  title: string
  description: string
  suggestedBy: string
  votes: string[] // userIds who voted
  createdAt: string
}
