import React, { useState } from 'react'
import { BellRing } from 'lucide-react'
import type { DailyEntry, UserProfile, WeekDefinition, WeeklySettlement } from '../types'
import { calculateWeekScore, formatSecondsToMinutes } from '../utils/calculator'
import { sound } from '../utils/audio'
import { nudgeFriend } from '../services/pushService'

interface LeaderboardViewProps {
  users: UserProfile[]
  selectedWeek: WeekDefinition
  entries: DailyEntry[]
  settlements: WeeklySettlement[]
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  users,
  selectedWeek,
  entries,
  settlements,
}) => {
  const [toast, setToast] = useState<string | null>(null)

  // Filter entries within the selected week
  const weekEntries = entries.filter((e) => {
    return e.date >= selectedWeek.startDate && e.date <= selectedWeek.endDate
  })

  // Compute stats for each user
  const userStats = users.map((u) => {
    const userEntries = weekEntries.filter((e) => e.userId === u.id)
    const totalP = userEntries.reduce((acc, curr) => acc + (curr.pushups || 0), 0)
    const totalS = userEntries.reduce((acc, curr) => acc + (curr.squats || 0), 0)
    const totalG = userEntries.reduce((acc, curr) => acc + (curr.plankSeconds || 0), 0)

    const score = calculateWeekScore(totalP, totalS, totalG)
    const settlement = settlements.find((s) => s.userId === u.id && s.weekNumber === selectedWeek.weekNumber)

    return {
      user: u,
      pushups: totalP,
      squats: totalS,
      plankSeconds: totalG,
      score,
      settlement,
    }
  })

  // Sort by finalTier desc, then sum of reps desc
  userStats.sort((a, b) => {
    if (b.score.finalTier !== a.score.finalTier) {
      return b.score.finalTier - a.score.finalTier
    }
    return (b.pushups + b.squats) - (a.pushups + a.squats)
  })

  // Group aggregates
  const groupPushups = userStats.reduce((acc, curr) => acc + curr.pushups, 0)
  const groupSquats = userStats.reduce((acc, curr) => acc + curr.squats, 0)
  const groupPlank = userStats.reduce((acc, curr) => acc + curr.plankSeconds, 0)

  const handleRemind = async (user: UserProfile) => {
    sound.vibrate([40, 20, 60])
    sound.playClick()
    try {
      const { sent } = await nudgeFriend(user.id)
      setToast(
        sent > 0
          ? `${user.name} vient d'être secoué 🫨`
          : `${user.name} n'a pas activé les notifications 😴`
      )
    } catch {
      setToast("Oups, la relance n'est pas partie.")
    }
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="space-y-3.5">
      {/* Team Aggregates */}
      <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Total Collectif • {selectedWeek.label}
          </span>
          <span className="text-xs font-mono font-bold text-zinc-400">{users.length} athlètes</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-[#1C202C] rounded-xl p-3 border border-[#32384A]">
            <span className="text-xs font-mono text-zinc-300 uppercase block font-semibold">Pompes</span>
            <span className="text-xl font-mono font-black text-white tabular-nums mt-0.5 block">{groupPushups}</span>
          </div>
          <div className="bg-[#1C202C] rounded-xl p-3 border border-[#32384A]">
            <span className="text-xs font-mono text-zinc-300 uppercase block font-semibold">Squats</span>
            <span className="text-xl font-mono font-black text-white tabular-nums mt-0.5 block">{groupSquats}</span>
          </div>
          <div className="bg-[#1C202C] rounded-xl p-3 border border-[#32384A]">
            <span className="text-xs font-mono text-zinc-300 uppercase block font-semibold">Gainage</span>
            <span className="text-xl font-mono font-black text-white tabular-nums mt-0.5 block">{formatSecondsToMinutes(groupPlank)}</span>
          </div>
        </div>
      </div>

      {/* Relance alert toast */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-white text-black text-xs font-mono font-bold flex items-center justify-between shadow-lg">
          <span>{toast}</span>
          <span className="font-black text-sm">✓</span>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <div className="space-y-2">
        {userStats.map((stat, index) => {
          const isTop = index === 0
          const isFull = stat.score.finalTier === 5

          return (
            <div
              key={stat.user.id}
              className={`rounded-2xl p-4 border transition-all ${
                stat.user.isCurrentUser
                  ? 'bg-[#181C26] border-zinc-500 shadow-md'
                  : 'bg-[#141720] border-[#2B3142]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Rank & User Info */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span
                    className={`font-mono text-sm font-black w-6 text-center tabular-nums ${
                      isTop ? 'text-[#D4F932]' : 'text-zinc-400'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <div className="w-9 h-9 rounded-xl bg-[#222736] border border-[#343B52] flex items-center justify-center text-base font-bold text-white shrink-0">
                    {stat.user.avatar}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-extrabold text-sm text-white truncate">
                        {stat.user.name}
                      </span>
                      {stat.user.isCurrentUser && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-200 border border-zinc-600">
                          Moi
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-zinc-300 mt-0.5">
                      {isFull ? (
                        <span className="text-emerald-400 font-bold">0 € • Palier 5/5</span>
                      ) : (
                        <span className="text-zinc-300">
                          Amende : <strong className="text-white">{stat.score.fineAmount},00 €</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg tabular-nums ${
                        isFull
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#1C202C] text-white border border-[#32384A]'
                      }`}
                    >
                      {stat.score.finalTier}/5
                    </span>
                  </div>

                  {!stat.user.isCurrentUser && !isFull && selectedWeek.isCurrent && (
                    <button
                      onClick={() => handleRemind(stat.user)}
                      title={`Relancer ${stat.user.name}`}
                      className="p-2 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] border border-[#32384A] text-zinc-200 hover:text-white text-xs active:scale-95 transition-all"
                    >
                      <BellRing className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clean Metric Ticks */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#252B3A] text-xs font-mono">
                <div className="text-zinc-300">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Pompes</span>
                  <strong className="text-white text-xs tabular-nums font-black">{stat.pushups}</strong>
                  <span className="text-zinc-400">/250</span>
                </div>
                <div className="text-zinc-300">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Squats</span>
                  <strong className="text-white text-xs tabular-nums font-black">{stat.squats}</strong>
                  <span className="text-zinc-400">/250</span>
                </div>
                <div className="text-zinc-300">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Gainage</span>
                  <strong className="text-white text-xs tabular-nums font-black">{formatSecondsToMinutes(stat.plankSeconds)}</strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
