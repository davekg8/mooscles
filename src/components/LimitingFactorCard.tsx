import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { WeekScore } from '../types'
import { formatSecondsToMinutes } from '../utils/calculator'
import { WEEKLY_TARGETS } from '../utils/challengeConstants'

interface LimitingFactorCardProps {
  score: WeekScore
  userName: string
  weekLabel: string
}

export const LimitingFactorCard: React.FC<LimitingFactorCardProps> = ({
  score,
  userName,
  weekLabel,
}) => {
  const isPerfect = score.finalTier === 5

  const getCoachingNotice = () => {
    if (isPerfect) {
      return {
        isPositive: true,
        title: 'Palier 5/5 validé • 0 € d’amende',
        detail: 'Tous les objectifs sont validés. Aucun paiement dû cette semaine.',
      }
    }

    const next = score.nextTierNeeded
    if (!next) return null

    if (score.limitingFactor === 'pushups') {
      return {
        isPositive: false,
        title: `Facteur limitant : Pompes (${score.pushupTier}/5)`,
        detail: `Encore ${next.missingPushups} pompes pour atteindre le Palier ${next.tier}/5 et économiser 1,00 €.`,
      }
    }
    if (score.limitingFactor === 'squats') {
      return {
        isPositive: false,
        title: `Facteur limitant : Squats (${score.squatTier}/5)`,
        detail: `Encore ${next.missingSquats} squats pour atteindre le Palier ${next.tier}/5 et économiser 1,00 €.`,
      }
    }
    if (score.limitingFactor === 'plank') {
      return {
        isPositive: false,
        title: `Facteur limitant : Gainage (${score.plankTier}/5)`,
        detail: `Encore ${formatSecondsToMinutes(next.missingPlankSeconds)} de gainage pour atteindre le Palier ${next.tier}/5 et économiser 1,00 €.`,
      }
    }

    return {
      isPositive: false,
      title: `Palier ${score.finalTier}/5`,
      detail: `Progression équilibrée. Il manque ${next.missingPushups} pompes, ${next.missingSquats} squats et ${formatSecondsToMinutes(next.missingPlankSeconds)} de gainage.`,
    }
  }

  const notice = getCoachingNotice()

  // Helper to render 5 discrete tier segments for an exercise
  const renderSegmentedBar = (
    currentValue: number,
    tierStep: number,
    tierCount: number
  ) => {
    return (
      <div className="grid grid-cols-5 gap-1.5 h-3.5 w-full">
        {Array.from({ length: tierCount }).map((_, idx) => {
          const tierFloor = idx * tierStep
          const tierCeil = (idx + 1) * tierStep
          let fillPercent = 0

          if (currentValue >= tierCeil) {
            fillPercent = 100
          } else if (currentValue > tierFloor) {
            fillPercent = Math.round(((currentValue - tierFloor) / tierStep) * 100)
          }

          const isFullyAchieved = fillPercent === 100

          return (
            <div
              key={idx}
              className="relative h-full rounded bg-[#222736] overflow-hidden border border-[#32394E]"
              title={`Palier ${idx + 1} (${tierCeil})`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  isFullyAchieved ? 'bg-[#D4F932]' : 'bg-[#D4F932]/75'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4 sm:p-5 shadow-lg">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#252B3A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
              {weekLabel}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-sm font-bold text-white">{userName}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
              {score.finalTier}
              <span className="text-zinc-400 text-xl font-bold">/5</span>
            </span>
            <span className="text-xs uppercase font-mono font-bold text-zinc-300">
              Palier validé
            </span>
          </div>
        </div>

        {/* Fine Due Badge */}
        <div className="text-right">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-extrabold ${
              isPerfect
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-[#1C202C] border-[#32384A] text-zinc-100'
            }`}
          >
            {isPerfect ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
            <span>
              Amende : <strong className={isPerfect ? 'text-emerald-300' : 'text-white'}>{score.fineAmount},00 €</strong>
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-mono mt-1 font-medium">
            {isPerfect ? 'Aucun règlement dû' : 'À verser à la cagnotte'}
          </div>
        </div>
      </div>

      {/* Coaching Prompt Box */}
      {notice && (
        <div
          className={`my-3.5 p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            notice.isPositive
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-[#1C202C] border-[#32384A] text-zinc-200'
          }`}
        >
          {notice.isPositive ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#D4F932] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white text-xs tracking-tight">{notice.title}</p>
            <p className="text-zinc-300 text-xs mt-0.5 font-medium">{notice.detail}</p>
          </div>
        </div>
      )}

      {/* 3 Metric Rows with 5-Block Segmented Tracks */}
      <div className="space-y-3.5 pt-1">
        {/* Pushups */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-zinc-200 text-xs">
              Pompes
            </span>
            <div className="font-mono text-xs tabular-nums text-zinc-300 font-bold">
              <span className="text-white font-extrabold">{score.pushups}</span> / {WEEKLY_TARGETS.pushups} reps
              <span className="text-zinc-400 ml-1.5 font-semibold">({score.pushupTier}/5)</span>
            </div>
          </div>
          {renderSegmentedBar(score.pushups, WEEKLY_TARGETS.tierPushups, 5)}
        </div>

        {/* Squats */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-zinc-200 text-xs">
              Squats
            </span>
            <div className="font-mono text-xs tabular-nums text-zinc-300 font-bold">
              <span className="text-white font-extrabold">{score.squats}</span> / {WEEKLY_TARGETS.squats} reps
              <span className="text-zinc-400 ml-1.5 font-semibold">({score.squatTier}/5)</span>
            </div>
          </div>
          {renderSegmentedBar(score.squats, WEEKLY_TARGETS.tierSquats, 5)}
        </div>

        {/* Plank */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-zinc-200 text-xs">
              Gainage
            </span>
            <div className="font-mono text-xs tabular-nums text-zinc-300 font-bold">
              <span className="text-white font-extrabold">{formatSecondsToMinutes(score.plankSeconds)}</span> / 10 min
              <span className="text-zinc-400 ml-1.5 font-semibold">({score.plankTier}/5)</span>
            </div>
          </div>
          {renderSegmentedBar(score.plankSeconds, WEEKLY_TARGETS.tierPlankSeconds, 5)}
        </div>
      </div>
    </div>
  )
}
