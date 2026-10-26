import React, { useState } from 'react'
import { Calendar, Edit3 } from 'lucide-react'
import type { DailyEntry, WeekDefinition } from '../types'
import { PlankStopwatch } from './PlankStopwatch'
import { sound } from '../utils/audio'

interface DailyLogSectionProps {
  selectedWeek: WeekDefinition
  selectedDate: string
  onSelectDate: (date: string) => void
  currentEntry: DailyEntry | undefined
  onUpdateEntry: (delta: {
    pushups?: number
    squats?: number
    plankSeconds?: number
    exactPushups?: number
    exactSquats?: number
    exactPlankSeconds?: number
  }) => void
}

interface DayItem {
  dateStr: string
  dayName: string
  dayNum: number
}

export const DailyLogSection: React.FC<DailyLogSectionProps> = ({
  selectedWeek,
  selectedDate,
  onSelectDate,
  currentEntry,
  onUpdateEntry,
}) => {
  const [showManualEdit, setShowManualEdit] = useState(false)
  const [manualPushups, setManualPushups] = useState(currentEntry?.pushups ?? 0)
  const [manualSquats, setManualSquats] = useState(currentEntry?.squats ?? 0)
  const [manualPlank, setManualPlank] = useState(currentEntry?.plankSeconds ?? 0)

  // Generate list of days for the selected week
  const getDaysOfWeek = (): DayItem[] => {
    const start = new Date(selectedWeek.startDate)
    const end = new Date(selectedWeek.endDate)
    const days: DayItem[] = []
    const dayNames = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

    const cur = new Date(start)
    while (cur <= end) {
      const year = cur.getFullYear()
      const month = String(cur.getMonth() + 1).padStart(2, '0')
      const day = String(cur.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      days.push({
        dateStr,
        dayName: dayNames[cur.getDay()],
        dayNum: cur.getDate(),
      })
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }

  const days = getDaysOfWeek()

  const handleIncrement = (type: 'pushups' | 'squats' | 'plankSeconds', amount: number) => {
    sound.vibrate(25)
    sound.playClick()
    onUpdateEntry({ [type]: amount })
  }

  const handleManualSave = () => {
    sound.vibrate(35)
    sound.playSuccess()
    onUpdateEntry({
      exactPushups: Number(manualPushups) || 0,
      exactSquats: Number(manualSquats) || 0,
      exactPlankSeconds: Number(manualPlank) || 0,
    })
    setShowManualEdit(false)
  }

  const isToday = selectedDate === '2026-10-26'

  return (
    <div className="space-y-3.5">
      {/* Day Selector Strip */}
      <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-3.5">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-300" />
            Séance du jour
          </span>
          <span className="text-xs font-mono font-bold text-zinc-200">
            {selectedDate} {isToday ? '• Aujourd’hui' : ''}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const isSelected = d.dateStr === selectedDate
            return (
              <button
                key={d.dateStr}
                onClick={() => {
                  sound.vibrate(15)
                  onSelectDate(d.dateStr)
                }}
                className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white text-black font-black border-white shadow-md'
                    : 'bg-[#1C202C] hover:bg-[#252B3A] border-[#2D3344] text-zinc-200 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-mono font-bold tracking-tight opacity-90">{d.dayName}</span>
                <span className="text-sm font-mono font-extrabold mt-0.5 tabular-nums">{d.dayNum}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Manual Input Toggle */}
      <div className="flex justify-end px-1">
        <button
          onClick={() => {
            setManualPushups(currentEntry?.pushups ?? 0)
            setManualSquats(currentEntry?.squats ?? 0)
            setManualPlank(currentEntry?.plankSeconds ?? 0)
            setShowManualEdit(!showManualEdit)
          }}
          className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {showManualEdit ? 'Fermer saisie libre' : 'Saisie manuelle directe'}
        </button>
      </div>

      {/* Manual Direct Input Mode */}
      {showManualEdit && (
        <div className="rounded-2xl bg-[#141720] border border-zinc-600 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase text-white">Valeurs exactes — {selectedDate}</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">Pompes</label>
              <input
                type="number"
                min="0"
                value={manualPushups}
                onChange={(e) => setManualPushups(Number(e.target.value))}
                className="w-full bg-[#1C202C] border border-[#32384A] focus:border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">Squats</label>
              <input
                type="number"
                min="0"
                value={manualSquats}
                onChange={(e) => setManualSquats(Number(e.target.value))}
                className="w-full bg-[#1C202C] border border-[#32384A] focus:border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">Gainage (s)</label>
              <input
                type="number"
                min="0"
                value={manualPlank}
                onChange={(e) => setManualPlank(Number(e.target.value))}
                className="w-full bg-[#1C202C] border border-[#32384A] focus:border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleManualSave}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs font-mono transition-colors"
          >
            Appliquer les valeurs
          </button>
        </div>
      )}

      {/* Workout Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Pompes */}
        <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Exercice 1
              </span>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-mono mt-0.5">
                Pompes
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-white font-mono tabular-nums">
                {currentEntry?.pushups ?? 0}
              </span>
              <span className="text-xs font-mono text-zinc-400 ml-1 font-bold">reps</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleIncrement('pushups', -10)}
              disabled={!currentEntry?.pushups}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-200 disabled:opacity-30 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              -10
            </button>
            <button
              onClick={() => handleIncrement('pushups', 10)}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              +10
            </button>
            <button
              onClick={() => handleIncrement('pushups', 25)}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              +25
            </button>
            <button
              onClick={() => handleIncrement('pushups', 50)}
              className="py-3 rounded-xl bg-[#D4F932] hover:bg-[#c4ea28] text-black text-xs font-mono font-black active:scale-95 transition-all text-center shadow-sm"
            >
              +50
            </button>
          </div>
        </div>

        {/* 2. Squats */}
        <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Exercice 2
              </span>
              <h3 className="text-base font-black uppercase tracking-tight text-white font-mono mt-0.5">
                Squats
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-white font-mono tabular-nums">
                {currentEntry?.squats ?? 0}
              </span>
              <span className="text-xs font-mono text-zinc-400 ml-1 font-bold">reps</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleIncrement('squats', -10)}
              disabled={!currentEntry?.squats}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-200 disabled:opacity-30 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              -10
            </button>
            <button
              onClick={() => handleIncrement('squats', 10)}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              +10
            </button>
            <button
              onClick={() => handleIncrement('squats', 25)}
              className="py-3 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center border border-[#32384A]"
            >
              +25
            </button>
            <button
              onClick={() => handleIncrement('squats', 50)}
              className="py-3 rounded-xl bg-[#D4F932] hover:bg-[#c4ea28] text-black text-xs font-mono font-black active:scale-95 transition-all text-center shadow-sm"
            >
              +50
            </button>
          </div>
        </div>
      </div>

      {/* 3. Gainage Precision Stopwatch */}
      <PlankStopwatch onAddPlankSeconds={(sec) => handleIncrement('plankSeconds', sec)} />
    </div>
  )
}
