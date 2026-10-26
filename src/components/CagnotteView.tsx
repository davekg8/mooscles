import React, { useState } from 'react'
import { CheckCircle, Plus, ThumbsUp, Wallet } from 'lucide-react'
import type { CagnotteIdea, UserProfile, WeekDefinition, WeeklySettlement } from '../types'
import { sound } from '../utils/audio'

interface CagnotteViewProps {
  users: UserProfile[]
  weeks: WeekDefinition[]
  settlements: WeeklySettlement[]
  ideas: CagnotteIdea[]
  activeUserId: string
  isAdmin: boolean
  onTogglePaid: (settlementId: string, isPaid: boolean) => void
  onAddIdea: (title: string, description: string) => void
  onToggleIdeaVote: (ideaId: string) => void
}

export const CagnotteView: React.FC<CagnotteViewProps> = ({
  users,
  settlements,
  ideas,
  activeUserId,
  isAdmin,
  onTogglePaid,
  onAddIdea,
  onToggleIdeaVote,
}) => {
  const [activeTab, setActiveTab] = useState<'comptes' | 'idees'>('comptes')
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Finances
  const totalDue = settlements.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0)
  const totalPaid = settlements.reduce(
    (acc, curr) => (curr.isPaid ? acc + (curr.fineAmount || 0) : acc),
    0
  )
  const totalRemaining = totalDue - totalPaid

  // Per user ledger
  const userLedger = users.map((u) => {
    const userSettlements = settlements.filter((s) => s.userId === u.id)
    const userTotalDue = userSettlements.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0)
    const userTotalPaid = userSettlements.reduce(
      (acc, curr) => (curr.isPaid ? acc + (curr.fineAmount || 0) : acc),
      0
    )
    const userPending = userTotalDue - userTotalPaid

    return {
      user: u,
      settlements: userSettlements,
      totalDue: userTotalDue,
      totalPaid: userTotalPaid,
      pending: userPending,
    }
  })

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    sound.vibrate(30)
    sound.playSuccess()
    onAddIdea(newTitle.trim(), newDesc.trim())
    setNewTitle('')
    setNewDesc('')
    setShowAddIdea(false)
  }

  return (
    <div className="space-y-3.5">
      {/* Treasury Card */}
      <div className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-zinc-300" />
            Cagnotte Commune
          </span>
          <span className="text-xs font-mono text-zinc-300 uppercase font-semibold">
            {isAdmin ? 'Tu es le trésorier' : 'Règlement hors-app'}
          </span>
        </div>

        <div className="flex items-baseline justify-between py-1">
          <div>
            <div className="text-4xl font-mono font-black text-white tracking-tight tabular-nums">
              {totalPaid},00 €
            </div>
            <div className="text-xs font-mono text-zinc-300 mt-1 font-semibold">
              Encaissé sur <strong className="text-white">{totalDue},00 €</strong> générés
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono uppercase text-zinc-400 block font-semibold">Reste à percevoir</span>
            <span
              className={`text-xl font-mono font-black tabular-nums ${
                totalRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {totalRemaining},00 €
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-[#222736] overflow-hidden mt-3 border border-[#32394E]">
          <div
            className="h-full rounded-full bg-[#D4F932] transition-all duration-300"
            style={{ width: `${totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Segmented Tab Bar */}
      <div className="grid grid-cols-2 rounded-2xl bg-[#141720] border border-[#2B3142] p-1.5">
        <button
          onClick={() => {
            sound.vibrate(15)
            setActiveTab('comptes')
          }}
          className={`py-2.5 text-xs font-mono font-bold rounded-xl transition-all ${
            activeTab === 'comptes'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          Comptes & Règlements
        </button>
        <button
          onClick={() => {
            sound.vibrate(15)
            setActiveTab('idees')
          }}
          className={`py-2.5 text-xs font-mono font-bold rounded-xl transition-all ${
            activeTab === 'idees'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          Idées Fin de Défi ({ideas.length})
        </button>
      </div>

      {/* Tab 1: Member Accounting Ledger */}
      {activeTab === 'comptes' && (
        <div className="space-y-2.5">
          {userLedger.map((item) => (
            <div
              key={item.user.id}
              className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#222736] border border-[#32384A] flex items-center justify-center text-base">
                    {item.user.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {item.user.name}
                      {item.user.isCurrentUser && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-200">
                          Moi
                        </span>
                      )}
                    </h4>
                    <p className="text-xs font-mono text-zinc-300 font-medium">
                      Total dû : <strong className="text-white">{item.totalDue} €</strong> • Réglé :{' '}
                      <strong className="text-emerald-400">{item.totalPaid} €</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {item.pending === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> À jour
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold">
                      Doit {item.pending},00 €
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Weeks */}
              <div className="space-y-1.5 pt-2 border-t border-[#252B3A]">
                {item.settlements.length === 0 ? (
                  <p className="text-xs font-mono text-zinc-400 italic">Aucune semaine clôturée.</p>
                ) : (
                  item.settlements.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs font-mono py-1.5 px-2.5 rounded-lg bg-[#1C202C]"
                    >
                      <span className="text-zinc-200 font-medium">
                        Semaine {s.weekNumber} (Score {s.score}/5)
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white tabular-nums">{s.fineAmount},00 €</span>
                        {s.fineAmount === 0 ? (
                          <span className="text-xs text-emerald-400 font-bold">Clean</span>
                        ) : !isAdmin ? (
                          <span
                            className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg ${
                              s.isPaid ? 'bg-[#252B3A] text-zinc-200' : 'bg-amber-950/60 text-amber-300'
                            }`}
                          >
                            {s.isPaid ? 'Payé ✓' : 'À payer'}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              sound.vibrate(20)
                              sound.playClick()
                              onTogglePaid(s.id, !s.isPaid)
                            }}
                            className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                              s.isPaid
                                ? 'bg-[#252B3A] text-zinc-200 hover:text-white border border-[#3A4259]'
                                : 'bg-[#D4F932] text-black hover:bg-[#c2e72a]'
                            }`}
                          >
                            {s.isPaid ? 'Payé ✓' : 'Marquer réglé'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Ideas for end of challenge */}
      {activeTab === 'idees' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase text-zinc-300 font-bold">
              Propositions pour le 17 Décembre
            </span>
            <button
              onClick={() => setShowAddIdea(!showAddIdea)}
              className="text-xs font-mono font-bold text-white hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouvelle idée
            </button>
          </div>

          {showAddIdea && (
            <form
              onSubmit={handleCreateIdea}
              className="rounded-2xl bg-[#141720] border border-zinc-500 p-4 space-y-3"
            >
              <h4 className="text-xs font-mono font-bold text-white uppercase">Proposer une utilisation</h4>
              <input
                type="text"
                placeholder="Titre de la proposition..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-zinc-300"
              />
              <textarea
                placeholder="Détails, idée de lieu, budget..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-300"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddIdea(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#1C202C] text-zinc-300 text-xs font-mono font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-mono font-bold"
                >
                  Ajouter
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {ideas.length === 0 && (
              <p className="text-xs font-mono text-zinc-400 italic px-1">
                Aucune idée pour l'instant. Lance la première ! 🎉
              </p>
            )}
            {ideas.map((idea) => {
              const hasVoted = idea.votes.includes(activeUserId)
              const suggester = users.find((u) => u.id === idea.suggestedBy)

              return (
                <div
                  key={idea.id}
                  className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-white">{idea.title}</h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-medium">{idea.description}</p>
                    <span className="text-xs font-mono text-zinc-400 mt-2 block font-medium">
                      Par {suggester?.name || 'Un membre'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sound.vibrate(20)
                      sound.playClick()
                      onToggleIdeaVote(idea.id)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs font-extrabold border transition-all active:scale-95 ${
                      hasVoted
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-[#1C202C] border-[#32384A] text-zinc-200 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>{idea.votes.length}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
