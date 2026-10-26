import type { CagnotteIdea, DailyEntry, UserProfile, WeeklySettlement } from '../types'
import { DEFAULT_USERS } from '../utils/challengeConstants'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const LOCAL_STORAGE_KEYS = {
  USERS: 'mooscles_users_v1',
  ENTRIES: 'mooscles_entries_v1',
  SETTLEMENTS: 'mooscles_settlements_v1',
  IDEAS: 'mooscles_ideas_v1',
  ACTIVE_USER: 'mooscles_active_user_v1',
}

// Initial seed entries for testing & week 1 catchup
function getInitialEntries(): DailyEntry[] {
  return [
    // David Week 1 (19-25 Oct) -> 250 pushups, 200 squats, 600s plank -> 4/5 (squats limited)
    { id: 'e1', userId: 'u1', date: '2026-10-19', pushups: 50, squats: 50, plankSeconds: 120, updatedAt: '2026-10-19T20:00:00Z' },
    { id: 'e2', userId: 'u1', date: '2026-10-21', pushups: 80, squats: 50, plankSeconds: 180, updatedAt: '2026-10-21T20:00:00Z' },
    { id: 'e3', userId: 'u1', date: '2026-10-23', pushups: 70, squats: 50, plankSeconds: 150, updatedAt: '2026-10-23T20:00:00Z' },
    { id: 'e4', userId: 'u1', date: '2026-10-25', pushups: 50, squats: 50, plankSeconds: 150, updatedAt: '2026-10-25T20:00:00Z' },
    // Alexandre Week 1 -> 5/5 perfect week
    { id: 'e5', userId: 'u2', date: '2026-10-20', pushups: 100, squats: 100, plankSeconds: 240, updatedAt: '2026-10-20T20:00:00Z' },
    { id: 'e6', userId: 'u2', date: '2026-10-22', pushups: 150, squats: 150, plankSeconds: 360, updatedAt: '2026-10-22T20:00:00Z' },
    // Lucas Week 1 -> 1/5 (only 60 pushups, 60 squats, 2m plank)
    { id: 'e7', userId: 'u3', date: '2026-10-24', pushups: 60, squats: 60, plankSeconds: 130, updatedAt: '2026-10-24T20:00:00Z' },
  ]
}

function getInitialSettlements(): WeeklySettlement[] {
  return [
    // Week 1 results
    { id: 's1', userId: 'u1', weekNumber: 1, score: 4, fineAmount: 1, isPaid: true, paidAt: '2026-10-26T09:00:00Z' },
    { id: 's2', userId: 'u2', weekNumber: 1, score: 5, fineAmount: 0, isPaid: true, paidAt: '2026-10-26T09:00:00Z' },
    { id: 's3', userId: 'u3', weekNumber: 1, score: 1, fineAmount: 4, isPaid: false },
    { id: 's4', userId: 'u4', weekNumber: 1, score: 3, fineAmount: 2, isPaid: true, paidAt: '2026-10-26T10:00:00Z' },
    { id: 's5', userId: 'u5', weekNumber: 1, score: 2, fineAmount: 3, isPaid: false },
    { id: 's6', userId: 'u6', weekNumber: 1, score: 4, fineAmount: 1, isPaid: false },
    { id: 's7', userId: 'u7', weekNumber: 1, score: 0, fineAmount: 5, isPaid: false },
  ]
}

function getInitialIdeas(): CagnotteIdea[] {
  return [
    {
      id: 'i1',
      title: 'Festin Viande & Barbecue Géant 🥩🔥',
      description: 'On privatise un spot ou on se fait une grosse soirée grillades haut de gamme avec la cagnotte.',
      suggestedBy: 'u1',
      votes: ['u1', 'u2', 'u4'],
      createdAt: '2026-10-20T12:00:00Z',
    },
    {
      id: 'i2',
      title: 'Session Grand Prix Karting 🏎️💨',
      description: 'Course de karting indoor entre nous pour savoir qui a les cuisses les plus nerveuses !',
      suggestedBy: 'u3',
      votes: ['u3', 'u6', 'u7'],
      createdAt: '2026-10-22T14:30:00Z',
    },
    {
      id: 'i3',
      title: 'Grand Resto Étoilé ou Bistronomique 🍷🍽️',
      description: 'Tout le monde sur son 31 pour trinquer à nos efforts et nos courbatures.',
      suggestedBy: 'u5',
      votes: ['u5', 'u1'],
      createdAt: '2026-10-24T18:00:00Z',
    },
  ]
}

export const StorageService = {
  // --- PROFILES ---
  async getProfiles(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*')
        if (!error && data && data.length > 0) {
          return data as UserProfile[]
        }
      } catch (err) {
        console.warn('Supabase fetch profiles error, using local fallback:', err)
      }
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    const defaults = [...DEFAULT_USERS]
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(defaults))
    return defaults
  },

  getActiveUserId(): string {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_USER) || 'u1'
  },

  setActiveUserId(userId: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_USER, userId)
  },

  // --- DAILY ENTRIES ---
  async getDailyEntries(): Promise<DailyEntry[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('daily_entries').select('*')
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            date: d.date,
            pushups: d.pushups,
            squats: d.squats,
            plankSeconds: d.plank_seconds,
            notes: d.notes,
            updatedAt: d.updated_at,
          }))
        }
      } catch (err) {
        console.warn('Supabase fetch entries error, using local fallback:', err)
      }
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.ENTRIES)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    const initial = getInitialEntries()
    localStorage.setItem(LOCAL_STORAGE_KEYS.ENTRIES, JSON.stringify(initial))
    return initial
  },

  async saveDailyEntry(
    userId: string,
    date: string,
    delta: { pushups?: number; squats?: number; plankSeconds?: number; exactPushups?: number; exactSquats?: number; exactPlankSeconds?: number }
  ): Promise<DailyEntry> {
    const entries = await this.getDailyEntries()
    const existingIndex = entries.findIndex(e => e.userId === userId && e.date === date)
    
    let currentEntry: DailyEntry
    if (existingIndex >= 0) {
      currentEntry = { ...entries[existingIndex] }
      if (delta.exactPushups !== undefined) currentEntry.pushups = delta.exactPushups
      else if (delta.pushups !== undefined) currentEntry.pushups = Math.max(0, currentEntry.pushups + delta.pushups)

      if (delta.exactSquats !== undefined) currentEntry.squats = delta.exactSquats
      else if (delta.squats !== undefined) currentEntry.squats = Math.max(0, currentEntry.squats + delta.squats)

      if (delta.exactPlankSeconds !== undefined) currentEntry.plankSeconds = delta.exactPlankSeconds
      else if (delta.plankSeconds !== undefined) currentEntry.plankSeconds = Math.max(0, currentEntry.plankSeconds + delta.plankSeconds)

      currentEntry.updatedAt = new Date().toISOString()
      entries[existingIndex] = currentEntry
    } else {
      currentEntry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        date,
        pushups: delta.exactPushups ?? Math.max(0, delta.pushups ?? 0),
        squats: delta.exactSquats ?? Math.max(0, delta.squats ?? 0),
        plankSeconds: delta.exactPlankSeconds ?? Math.max(0, delta.plankSeconds ?? 0),
        updatedAt: new Date().toISOString(),
      }
      entries.push(currentEntry)
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.ENTRIES, JSON.stringify(entries))

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('daily_entries').upsert({
          user_id: currentEntry.userId,
          date: currentEntry.date,
          pushups: currentEntry.pushups,
          squats: currentEntry.squats,
          plank_seconds: currentEntry.plankSeconds,
          updated_at: currentEntry.updatedAt,
        }, { onConflict: 'user_id,date' })
      } catch (err) {
        console.warn('Supabase upsert error:', err)
      }
    }

    return currentEntry
  },

  // --- WEEKLY SETTLEMENTS & FINES ---
  async getWeeklySettlements(): Promise<WeeklySettlement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('weekly_settlements').select('*')
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            weekNumber: d.week_number,
            score: d.score,
            fineAmount: Number(d.fine_amount),
            isPaid: Boolean(d.is_paid),
            paidAt: d.paid_at,
          }))
        }
      } catch (err) {
        console.warn('Supabase fetch settlements error:', err)
      }
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTLEMENTS)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    const initial = getInitialSettlements()
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(initial))
    return initial
  },

  async recordWeeklyScore(
    userId: string,
    weekNumber: number,
    score: number,
    fineAmount: number
  ): Promise<WeeklySettlement> {
    const settlements = await this.getWeeklySettlements()
    const existingIndex = settlements.findIndex(s => s.userId === userId && s.weekNumber === weekNumber)

    let settlement: WeeklySettlement
    if (existingIndex >= 0) {
      settlement = {
        ...settlements[existingIndex],
        score,
        fineAmount,
      }
      settlements[existingIndex] = settlement
    } else {
      settlement = {
        id: 'settlement_' + Date.now(),
        userId,
        weekNumber,
        score,
        fineAmount,
        isPaid: fineAmount === 0, // 5/5 score has 0€ fine, automatically paid
        paidAt: fineAmount === 0 ? new Date().toISOString() : undefined,
      }
      settlements.push(settlement)
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements))

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('weekly_settlements').upsert({
          user_id: settlement.userId,
          week_number: settlement.weekNumber,
          score: settlement.score,
          fine_amount: settlement.fineAmount,
          is_paid: settlement.isPaid,
          paid_at: settlement.paidAt,
        }, { onConflict: 'user_id,week_number,year' })
      } catch (err) {
        console.warn('Supabase record score error:', err)
      }
    }

    return settlement
  },

  async toggleSettlementPaid(settlementId: string, isPaid: boolean): Promise<void> {
    const settlements = await this.getWeeklySettlements()
    const target = settlements.find(s => s.id === settlementId)
    if (target) {
      target.isPaid = isPaid
      target.paidAt = isPaid ? new Date().toISOString() : undefined
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements))

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('weekly_settlements').update({
            is_paid: isPaid,
            paid_at: target.paidAt,
          }).eq('id', settlementId)
        } catch (err) {
          console.warn('Supabase toggle paid error:', err)
        }
      }
    }
  },

  // --- CAGNOTTE IDEAS & VOTES ---
  async getCagnotteIdeas(): Promise<CagnotteIdea[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('cagnotte_ideas').select('*')
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            suggestedBy: d.suggested_by,
            votes: d.votes || [],
            createdAt: d.created_at,
          }))
        }
      } catch (err) {
        console.warn('Supabase fetch ideas error:', err)
      }
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.IDEAS)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    const initial = getInitialIdeas()
    localStorage.setItem(LOCAL_STORAGE_KEYS.IDEAS, JSON.stringify(initial))
    return initial
  },

  async addCagnotteIdea(title: string, description: string, suggestedBy: string): Promise<CagnotteIdea> {
    const ideas = await this.getCagnotteIdeas()
    const newIdea: CagnotteIdea = {
      id: 'idea_' + Date.now(),
      title,
      description,
      suggestedBy,
      votes: [suggestedBy],
      createdAt: new Date().toISOString(),
    }
    ideas.push(newIdea)
    localStorage.setItem(LOCAL_STORAGE_KEYS.IDEAS, JSON.stringify(ideas))

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('cagnotte_ideas').insert({
          title: newIdea.title,
          description: newIdea.description,
          suggested_by: newIdea.suggestedBy,
          votes: newIdea.votes,
        })
      } catch (err) {
        console.warn('Supabase insert idea error:', err)
      }
    }

    return newIdea
  },

  async toggleIdeaVote(ideaId: string, userId: string): Promise<void> {
    const ideas = await this.getCagnotteIdeas()
    const idea = ideas.find(i => i.id === ideaId)
    if (idea) {
      if (idea.votes.includes(userId)) {
        idea.votes = idea.votes.filter(u => u !== userId)
      } else {
        idea.votes.push(userId)
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.IDEAS, JSON.stringify(ideas))

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('cagnotte_ideas').update({
            votes: idea.votes,
          }).eq('id', ideaId)
        } catch (err) {
          console.warn('Supabase vote error:', err)
        }
      }
    }
  },
}
