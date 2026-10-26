import React from 'react'
import { ChevronDown, Download, Bell } from 'lucide-react'
import type { UserProfile, WeekDefinition } from '../types'

interface HeaderProps {
  activeUser: UserProfile | undefined
  onOpenProfile: () => void
  notificationsOn: boolean
  pollPending: boolean
  weeks: WeekDefinition[]
  selectedWeek: WeekDefinition
  onSelectWeek: (week: WeekDefinition) => void
  onOpenIosGuide: () => void
  onOpenReminderModal: () => void
  onOpenPollModal: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onOpenProfile,
  notificationsOn,
  pollPending,
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
          <img src="/brand/emblem.webp" alt="Mooscles" width={40} height={40} className="w-10 h-10 object-contain" />
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
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En ligne
              </span>
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
            {!notificationsOn && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4F932]" />
            )}
          </button>

          {/* PWA / iPhone install */}
          <button
            onClick={onOpenIosGuide}
            title="Installer PWA"
            className="w-9 h-9 rounded-xl bg-[#161922] border border-[#2B3142] flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Profil */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 bg-[#161922] border border-[#2B3142] hover:border-zinc-500 text-zinc-100 text-xs font-bold rounded-xl pl-2 pr-2.5 py-2 max-w-[120px]"
          >
            <span className="text-sm">{activeUser?.avatar || '🐮'}</span>
            <span className="truncate">{activeUser?.name}</span>
          </button>
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
                {w.label} • {w.startDate.slice(8)}/{w.startDate.slice(5, 7)} au {w.endDate.slice(8)}/{w.endDate.slice(5, 7)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>

        {/* Weekly Poll action */}
        <button
          onClick={onOpenPollModal}
          className="relative px-3.5 py-2 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] text-[#090A0D] text-xs font-black tracking-tight whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          Bilan S{selectedWeek.weekNumber}
          {pollPending && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#090A0D]" />
          )}
        </button>
      </div>
    </header>
  )
}
