import React from 'react'
import { ChevronDown, Download, Bell } from 'lucide-react'
import type { UserProfile, WeekDefinition } from '../types'
import { isSupabaseConfigured } from '../services/supabaseClient'

interface HeaderProps {
  users: UserProfile[]
  activeUser: UserProfile | undefined
  onSelectUser: (user: UserProfile) => void
  weeks: WeekDefinition[]
  selectedWeek: WeekDefinition
  onSelectWeek: (week: WeekDefinition) => void
  onOpenIosGuide: () => void
  onOpenReminderModal: () => void
  onOpenPollModal: () => void
}

export const Header: React.FC<HeaderProps> = ({
  users,
  activeUser,
  onSelectUser,
  weeks,
  selectedWeek,
  onSelectWeek,
  onOpenIosGuide,
  onOpenReminderModal,
  onOpenPollModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090A0D]/95 backdrop-blur-xl border-b border-[#232734] px-4 py-3 pt-safe">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#161922] border border-[#2B3142] flex items-center justify-center font-black text-lg text-white shadow-sm">
            🐮
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-widest uppercase text-white font-mono">
                MOOSCLES
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1C202C] text-zinc-300 border border-[#2B3142] font-mono">
                PWA
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
              <span>19 Oct — 17 Déc</span>
              <span className="text-zinc-500">•</span>
              {isSupabaseConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Cloud
                </span>
              ) : (
                <span className="text-zinc-300 flex items-center gap-1 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Local
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tools & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Notification test */}
          <button
            onClick={onOpenReminderModal}
            title="Relance 19h"
            className="w-9 h-9 rounded-xl bg-[#161922] border border-[#2B3142] flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4F932]" />
          </button>

          {/* PWA / iPhone install */}
          <button
            onClick={onOpenIosGuide}
            title="Installer PWA"
            className="w-9 h-9 rounded-xl bg-[#161922] border border-[#2B3142] flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* User selector chip */}
          <div className="relative">
            <select
              value={activeUser?.id || ''}
              onChange={(e) => {
                const target = users.find((u) => u.id === e.target.value)
                if (target) onSelectUser(target)
              }}
              className="appearance-none bg-[#161922] border border-[#2B3142] hover:border-zinc-500 text-zinc-100 text-xs font-bold rounded-xl pl-8 pr-7 py-2 cursor-pointer focus:outline-none focus:border-zinc-400 transition-colors"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#161922] text-zinc-100">
                  {u.name}
                </option>
              ))}
            </select>
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-sm">
              {activeUser?.avatar || '🐮'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Week selection bar */}
      <div className="max-w-xl mx-auto mt-2.5 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <select
            value={selectedWeek.weekNumber}
            onChange={(e) => {
              const num = Number(e.target.value)
              const w = weeks.find((item) => item.weekNumber === num)
              if (w) onSelectWeek(w)
            }}
            className="w-full bg-[#161922] border border-[#2B3142] text-zinc-100 text-xs font-bold rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-zinc-400"
          >
            {weeks.map((w) => (
              <option key={w.weekNumber} value={w.weekNumber} className="bg-[#161922] text-zinc-100">
                {w.label} • {w.startDate.slice(5)} au {w.endDate.slice(5)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>

        {/* Weekly Poll action */}
        <button
          onClick={onOpenPollModal}
          className="px-3.5 py-2 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] text-[#090A0D] text-xs font-black tracking-tight whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          Bilan S{selectedWeek.weekNumber}
        </button>
      </div>
    </header>
  )
}
