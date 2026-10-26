import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Check, Timer } from 'lucide-react'
import { formatTimeDigital, formatSecondsToMinutes } from '../utils/calculator'
import { sound } from '../utils/audio'

interface PlankStopwatchProps {
  onAddPlankSeconds: (seconds: number) => void
}

export const PlankStopwatch: React.FC<PlankStopwatchProps> = ({ onAddPlankSeconds }) => {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1
          if (next % 30 === 0) {
            sound.vibrate([40, 30, 40])
            sound.playClick()
          }
          return next
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const toggleRun = () => {
    sound.vibrate(30)
    sound.playClick()
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    sound.vibrate(20)
    setIsRunning(false)
    setSeconds(0)
  }

  const addPreset = (secToAdd: number) => {
    sound.vibrate(25)
    sound.playClick()
    setSeconds((prev) => prev + secToAdd)
  }

  const handleCommit = () => {
    if (seconds <= 0) return
    sound.vibrate([40, 30, 70])
    sound.playSuccess()
    onAddPlankSeconds(seconds)
    setIsRunning(false)
    setSeconds(0)
  }

  return (
    <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-zinc-300" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Chronomètre Gainage
          </h3>
        </div>

        {seconds > 0 && !isRunning && (
          <button
            onClick={resetTimer}
            className="text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Remettre à zéro
          </button>
        )}
      </div>

      {/* Stopwatch Display */}
      <div className="flex flex-col items-center justify-center py-3">
        <div
          className={`text-5xl font-mono font-black tracking-tight tabular-nums transition-colors ${
            isRunning ? 'text-[#D4F932]' : 'text-white'
          }`}
        >
          {formatTimeDigital(seconds)}
        </div>
        <div className="text-xs font-mono text-zinc-300 font-semibold mt-1">
          {seconds > 0 ? formatSecondsToMinutes(seconds) : '2 min (120s) = 1 palier validé'}
        </div>
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => addPreset(30)}
          className="py-2 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] border border-[#32384A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center"
        >
          +30 s
        </button>
        <button
          onClick={() => addPreset(60)}
          className="py-2 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] border border-[#32384A] text-zinc-100 text-xs font-mono font-bold active:scale-95 transition-all text-center"
        >
          +1 min
        </button>
        <button
          onClick={() => addPreset(120)}
          className="py-2 rounded-xl bg-[#1C202C] hover:bg-[#252B3A] border border-[#3A4259] text-white text-xs font-mono font-black active:scale-95 transition-all text-center"
        >
          +2 min (1/5)
        </button>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleRun}
          className={`flex-1 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 ${
            isRunning
              ? 'bg-amber-400 text-black hover:bg-amber-300'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> {seconds > 0 ? 'Reprendre' : 'Démarrer le chrono'}
            </>
          )}
        </button>

        {seconds > 0 && (
          <button
            onClick={handleCommit}
            className="flex-1 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-[#D4F932] hover:bg-[#c2e72a] text-black flex items-center justify-center gap-1.5 active:scale-98 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Valider (+{formatSecondsToMinutes(seconds)})
          </button>
        )}
      </div>
    </div>
  )
}
