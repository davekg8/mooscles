import React, { useState, useEffect } from 'react'
import { Dumbbell, BarChart3, Wallet } from 'lucide-react'
import type { DailyEntry, UserProfile, WeekDefinition, WeeklySettlement, CagnotteIdea } from './types'
import { WEEKS } from './utils/challengeConstants'
import { calculateWeekScore } from './utils/calculator'
import { StorageService } from './services/storageService'
import { Header } from './components/Header'
import { LimitingFactorCard } from './components/LimitingFactorCard'
import { DailyLogSection } from './components/DailyLogSection'
import { LeaderboardView } from './components/LeaderboardView'
import { CagnotteView } from './components/CagnotteView'
import { WeeklyPollModal } from './components/WeeklyPollModal'
import { IosInstallModal } from './components/IosInstallModal'
import { ReminderModal } from './components/ReminderModal'
import { sound } from './utils/audio'

export const App: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [activeUser, setActiveUser] = useState<UserProfile | undefined>()
  const [weeks] = useState<WeekDefinition[]>(WEEKS)
  const [selectedWeek, setSelectedWeek] = useState<WeekDefinition>(WEEKS[1]) // Week 2 is current
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-26')
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([])
  const [ideas, setIdeas] = useState<CagnotteIdea[]>([])

  const [activeTab, setActiveTab] = useState<'me' | 'leaderboard' | 'cagnotte'>('me')

  // Modals
  const [pollModalOpen, setPollModalOpen] = useState(false)
  const [iosModalOpen, setIosModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)

  // Initial load
  useEffect(() => {
    async function loadData() {
      const loadedUsers = await StorageService.getProfiles()
      setUsers(loadedUsers)

      const activeId = StorageService.getActiveUserId()
      const current = loadedUsers.find((u) => u.id === activeId) || loadedUsers[0]
      setActiveUser(current)

      const loadedEntries = await StorageService.getDailyEntries()
      setEntries(loadedEntries)

      const loadedSettlements = await StorageService.getWeeklySettlements()
      setSettlements(loadedSettlements)

      const loadedIdeas = await StorageService.getCagnotteIdeas()
      setIdeas(loadedIdeas)
    }

    loadData()
  }, [])

  // When selectedWeek changes, update selectedDate to first day of that week if out of range
  const handleSelectWeek = (w: WeekDefinition) => {
    sound.vibrate(15)
    setSelectedWeek(w)
    if (selectedDate < w.startDate || selectedDate > w.endDate) {
      setSelectedDate(w.startDate)
    }
  }

  const handleSelectUser = (user: UserProfile) => {
    sound.vibrate(20)
    setActiveUser(user)
    StorageService.setActiveUserId(user.id)
  }

  // Active user's entries in selected week
  const userWeekEntries = entries.filter((e) => {
    return (
      e.userId === activeUser?.id &&
      e.date >= selectedWeek.startDate &&
      e.date <= selectedWeek.endDate
    )
  })

  const totalP = userWeekEntries.reduce((acc, curr) => acc + (curr.pushups || 0), 0)
  const totalS = userWeekEntries.reduce((acc, curr) => acc + (curr.squats || 0), 0)
  const totalG = userWeekEntries.reduce((acc, curr) => acc + (curr.plankSeconds || 0), 0)
  const activeUserScore = calculateWeekScore(totalP, totalS, totalG)

  // Current selected day entry
  const currentDayEntry = entries.find(
    (e) => e.userId === activeUser?.id && e.date === selectedDate
  )

  const handleUpdateEntry = async (delta: {
    pushups?: number
    squats?: number
    plankSeconds?: number
    exactPushups?: number
    exactSquats?: number
    exactPlankSeconds?: number
  }) => {
    if (!activeUser) return
    await StorageService.saveDailyEntry(activeUser.id, selectedDate, delta)
    const freshEntries = await StorageService.getDailyEntries()
    setEntries(freshEntries)
  }

  const handleConfirmWeeklyScore = async (score: number, fineAmount: number) => {
    if (!activeUser) return
    await StorageService.recordWeeklyScore(
      activeUser.id,
      selectedWeek.weekNumber,
      score,
      fineAmount
    )
    const freshSettlements = await StorageService.getWeeklySettlements()
    setSettlements(freshSettlements)
  }

  const handleTogglePaid = async (settlementId: string, isPaid: boolean) => {
    await StorageService.toggleSettlementPaid(settlementId, isPaid)
    const freshSettlements = await StorageService.getWeeklySettlements()
    setSettlements(freshSettlements)
  }

  const handleAddIdea = async (title: string, description: string) => {
    if (!activeUser) return
    await StorageService.addCagnotteIdea(title, description, activeUser.id)
    const freshIdeas = await StorageService.getCagnotteIdeas()
    setIdeas(freshIdeas)
  }

  const handleToggleIdeaVote = async (ideaId: string) => {
    if (!activeUser) return
    await StorageService.toggleIdeaVote(ideaId, activeUser.id)
    const freshIdeas = await StorageService.getCagnotteIdeas()
    setIdeas(freshIdeas)
  }

  return (
    <div className="min-h-screen bg-[#090A0D] text-zinc-100 flex flex-col font-sans pb-24">
      {/* Top Header */}
      <Header
        users={users}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
        weeks={weeks}
        selectedWeek={selectedWeek}
        onSelectWeek={handleSelectWeek}
        onOpenIosGuide={() => setIosModalOpen(true)}
        onOpenReminderModal={() => setReminderModalOpen(true)}
        onOpenPollModal={() => setPollModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full px-3.5 sm:px-4 pt-3.5 flex-1">
        {/* Tab 1: Mon Challenge */}
        {activeTab === 'me' && (
          <div className="space-y-3.5">
            <LimitingFactorCard
              score={activeUserScore}
              userName={activeUser?.name || 'Moi'}
              weekLabel={selectedWeek.label}
            />

            <DailyLogSection
              selectedWeek={selectedWeek}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              currentEntry={currentDayEntry}
              onUpdateEntry={handleUpdateEntry}
            />
          </div>
        )}

        {/* Tab 2: Classement Potes */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            users={users}
            selectedWeek={selectedWeek}
            entries={entries}
            settlements={settlements}
            onSelectUser={(u) => {
              handleSelectUser(u)
              setActiveTab('me')
            }}
          />
        )}

        {/* Tab 3: Cagnotte & Comptes */}
        {activeTab === 'cagnotte' && (
          <CagnotteView
            users={users}
            weeks={weeks}
            settlements={settlements}
            ideas={ideas}
            activeUserId={activeUser?.id || ''}
            onTogglePaid={handleTogglePaid}
            onAddIdea={handleAddIdea}
            onToggleIdeaVote={handleToggleIdeaVote}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#090A0D]/95 backdrop-blur-xl border-t border-[#232734] px-4 py-2.5 pb-safe z-40">
        <div className="max-w-xl mx-auto grid grid-cols-3">
          {/* Tab 1: Me */}
          <button
            onClick={() => {
              sound.vibrate(15)
              setActiveTab('me')
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'me' ? 'text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200 font-semibold'
            }`}
          >
            <Dumbbell className={`w-5 h-5 mb-1 ${activeTab === 'me' ? 'text-[#D4F932]' : ''}`} />
            <span className="text-xs font-mono tracking-tight uppercase">Entraînement</span>
          </button>

          {/* Tab 2: Leaderboard */}
          <button
            onClick={() => {
              sound.vibrate(15)
              setActiveTab('leaderboard')
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'leaderboard' ? 'text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200 font-semibold'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-1 ${activeTab === 'leaderboard' ? 'text-[#D4F932]' : ''}`} />
            <span className="text-xs font-mono tracking-tight uppercase">Classement</span>
          </button>

          {/* Tab 3: Cagnotte */}
          <button
            onClick={() => {
              sound.vibrate(15)
              setActiveTab('cagnotte')
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'cagnotte' ? 'text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200 font-semibold'
            }`}
          >
            <Wallet className={`w-5 h-5 mb-1 ${activeTab === 'cagnotte' ? 'text-[#D4F932]' : ''}`} />
            <span className="text-xs font-mono tracking-tight uppercase">Cagnotte</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <WeeklyPollModal
        isOpen={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        selectedWeek={selectedWeek}
        userName={activeUser?.name || 'Moi'}
        userId={activeUser?.id || ''}
        computedScore={activeUserScore}
        currentSettlementScore={
          settlements.find(
            (s) => s.userId === activeUser?.id && s.weekNumber === selectedWeek.weekNumber
          )?.score
        }
        onConfirmScore={handleConfirmWeeklyScore}
      />

      <IosInstallModal
        isOpen={iosModalOpen}
        onClose={() => setIosModalOpen(false)}
      />

      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
    </div>
  )
}

export default App
