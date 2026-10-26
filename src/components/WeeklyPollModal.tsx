import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { WeekDefinition, WeekScore } from '../types'
import { sound } from '../utils/audio'

interface WeeklyPollModalProps {
  isOpen: boolean
  onClose: () => void
  selectedWeek: WeekDefinition
  userName: string
  userId: string
  computedScore: WeekScore
  currentSettlementScore?: number
  onConfirmScore: (score: number, fineAmount: number) => void
}

export const WeeklyPollModal: React.FC<WeeklyPollModalProps> = ({
  isOpen,
  onClose,
  selectedWeek,
  computedScore,
  currentSettlementScore,
  onConfirmScore,
}) => {
  if (!isOpen) return null

  const [selectedScore, setSelectedScore] = useState<number>(
    currentSettlementScore ?? computedScore.finalTier
  )

  const pollOptions = [
    { score: 0, fine: 5, label: 'Palier 0 / 5', desc: '< 50 pompes, < 50 squats ou < 2 min gainage' },
    { score: 1, fine: 4, label: 'Palier 1 / 5', desc: '50 pompes, 50 squats, 2 min gainage' },
    { score: 2, fine: 3, label: 'Palier 2 / 5', desc: '100 pompes, 100 squats, 4 min gainage' },
    { score: 3, fine: 2, label: 'Palier 3 / 5', desc: '150 pompes, 150 squats, 6 min gainage' },
    { score: 4, fine: 1, label: 'Palier 4 / 5', desc: '200 pompes, 200 squats, 8 min gainage' },
    { score: 5, fine: 0, label: 'Palier 5 / 5', desc: '250 pompes, 250 squats, 10 min gainage' },
  ]

  const handleSelect = (score: number) => {
    sound.vibrate(20)
    sound.playClick()
    setSelectedScore(score)
  }

  const handleConfirm = () => {
    const fine = 5 - selectedScore
    if (selectedScore === 5) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      sound.playSuccess()
    } else {
      sound.playClick()
    }
    sound.vibrate([30, 20, 60])
    onConfirmScore(selectedScore, fine)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#12141A] border border-[#202430] rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[#181B24] border border-[#242836] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Sondage Hebdomadaire
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Validation {selectedWeek.label}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Vote en ton âme et conscience selon tes séances réelles.
          </p>
        </div>

        {/* Pre-fill Notice */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-[#181B24] border border-[#242836] text-[11px] font-mono text-zinc-300 flex justify-between items-center">
          <span>Séances enregistrées :</span>
          <span className="text-[#D4F932] font-bold">
            Palier {computedScore.finalTier}/5 ({computedScore.fineAmount},00 €)
          </span>
        </div>

        {/* Options */}
        <div className="space-y-1.5 mb-5">
          {pollOptions.map((opt) => {
            const isSelected = selectedScore === opt.score
            const isCalculated = computedScore.finalTier === opt.score

            return (
              <button
                key={opt.score}
                onClick={() => handleSelect(opt.score)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-[#181B24] hover:bg-[#1E222D] border-[#242836] text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold">{opt.label}</span>
                    {isCalculated && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          isSelected
                            ? 'bg-zinc-200 text-black border-zinc-400'
                            : 'bg-[#1C1F2B] text-[#D4F932] border-[#2E3445]'
                        }`}
                      >
                        Calculé
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] mt-0.5 font-mono ${
                      isSelected ? 'text-zinc-700' : 'text-zinc-500'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-black text-white'
                        : opt.fine === 0
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#1C1F2B] text-zinc-300 border border-[#262A38]'
                    }`}
                  >
                    {opt.fine},00 €
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          Confirmer Palier {selectedScore}/5 ({5 - selectedScore},00 € d'amende)
        </button>
      </div>
    </div>
  )
}
