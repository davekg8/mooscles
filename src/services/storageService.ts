import type { CagnotteIdea, DailyEntry, UserProfile, WeeklySettlement } from '../types'
import { supabase } from './supabaseClient'

type EntryDelta = {
  pushups?: number
  squats?: number
  plankSeconds?: number
  exactPushups?: number
  exactSquats?: number
  exactPlankSeconds?: number
}

function fail(error: { message: string } | null, context: string): void {
  if (error) {
    console.error(context, error)
    throw new Error(error.message)
  }
}

function mapEntry(d: any): DailyEntry {
  return {
    id: d.id,
    userId: d.user_id,
    date: d.date,
    pushups: d.pushups,
    squats: d.squats,
    plankSeconds: d.plank_seconds,
    notes: d.notes ?? undefined,
    updatedAt: d.updated_at,
  }
}

function mapSettlement(d: any): WeeklySettlement {
  return {
    id: d.id,
    userId: d.user_id,
    weekNumber: d.week_number,
    score: d.score,
    fineAmount: Number(d.fine_amount),
    isPaid: Boolean(d.is_paid),
    paidAt: d.paid_at ?? undefined,
  }
}

export const StorageService = {
  // --- PROFILS ---
  async getProfiles(currentUserId?: string): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    fail(error, 'getProfiles')
    return (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      role: p.role,
      isCurrentUser: p.id === currentUserId,
    }))
  },

  async getMyProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    fail(error, 'getMyProfile')
    return data ? { ...data, isCurrentUser: true } : null
  },

  async joinChallenge(code: string, name: string, avatar: string, color: string): Promise<void> {
    const { error } = await supabase.rpc('join_challenge', {
      p_code: code,
      p_name: name,
      p_avatar: avatar,
      p_color: color,
    })
    fail(error, 'joinChallenge')
  },

  async updateMyProfile(userId: string, patch: { name: string; avatar: string; color: string }): Promise<void> {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
    fail(error, 'updateMyProfile')
  },

  // --- SAISIES ---
  async getDailyEntries(): Promise<DailyEntry[]> {
    const { data, error } = await supabase.from('daily_entries').select('*')
    fail(error, 'getDailyEntries')
    return (data ?? []).map(mapEntry)
  },

  async saveDailyEntry(userId: string, date: string, current: DailyEntry | undefined, delta: EntryDelta): Promise<DailyEntry> {
    const base = current ?? { pushups: 0, squats: 0, plankSeconds: 0 }
    const next = {
      pushups: delta.exactPushups ?? Math.max(0, base.pushups + (delta.pushups ?? 0)),
      squats: delta.exactSquats ?? Math.max(0, base.squats + (delta.squats ?? 0)),
      plankSeconds: delta.exactPlankSeconds ?? Math.max(0, base.plankSeconds + (delta.plankSeconds ?? 0)),
    }
    const { data, error } = await supabase
      .from('daily_entries')
      .upsert(
        {
          user_id: userId,
          date,
          pushups: next.pushups,
          squats: next.squats,
          plank_seconds: next.plankSeconds,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()
    fail(error, 'saveDailyEntry')
    return mapEntry(data)
  },

  // --- BILANS & AMENDES ---
  async getWeeklySettlements(): Promise<WeeklySettlement[]> {
    const { data, error } = await supabase.from('weekly_settlements').select('*').order('week_number')
    fail(error, 'getWeeklySettlements')
    return (data ?? []).map(mapSettlement)
  },

  async recordWeeklyScore(weekNumber: number, score: number): Promise<void> {
    const { error } = await supabase.rpc('submit_weekly_score', { p_week: weekNumber, p_score: score })
    fail(error, 'recordWeeklyScore')
  },

  async toggleSettlementPaid(settlementId: string, isPaid: boolean): Promise<void> {
    const { error } = await supabase
      .from('weekly_settlements')
      .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
      .eq('id', settlementId)
    fail(error, 'toggleSettlementPaid')
  },

  // --- IDÉES & VOTES ---
  async getCagnotteIdeas(): Promise<CagnotteIdea[]> {
    const [ideasRes, votesRes] = await Promise.all([
      supabase.from('cagnotte_ideas').select('*').order('created_at'),
      supabase.from('idea_votes').select('idea_id,user_id'),
    ])
    fail(ideasRes.error, 'getCagnotteIdeas')
    fail(votesRes.error, 'getIdeaVotes')
    const votes = votesRes.data ?? []
    return (ideasRes.data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description ?? '',
      suggestedBy: d.suggested_by,
      votes: votes.filter((v: any) => v.idea_id === d.id).map((v: any) => v.user_id),
      createdAt: d.created_at,
    }))
  },

  async addCagnotteIdea(title: string, description: string, userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('cagnotte_ideas')
      .insert({ title, description, suggested_by: userId })
      .select('id')
      .single()
    fail(error, 'addCagnotteIdea')
    await supabase.from('idea_votes').insert({ idea_id: data!.id, user_id: userId })
  },

  async deleteCagnotteIdea(ideaId: string): Promise<void> {
    const { error } = await supabase.from('cagnotte_ideas').delete().eq('id', ideaId)
    fail(error, 'deleteCagnotteIdea')
  },

  async toggleIdeaVote(ideaId: string, userId: string, hasVoted: boolean): Promise<void> {
    const { error } = hasVoted
      ? await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', userId)
      : await supabase.from('idea_votes').insert({ idea_id: ideaId, user_id: userId })
    fail(error, 'toggleIdeaVote')
  },
}
