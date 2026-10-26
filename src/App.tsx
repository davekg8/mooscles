import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dumbbell, BarChart3, Wallet, Loader2 } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import type { DailyEntry, UserProfile, WeekDefinition, WeeklySettlement, CagnotteIdea } from './types'
import { buildWeeks, defaultWeek, todayInParis } from './utils/challengeConstants'
import { calculateWeekScore } from './utils/calculator'
import { StorageService } from './services/storageService'
import { supabase, isSupabaseConfigured } from './services/supabaseClient'
import { disablePush, hasActiveSubscription } from './services/pushService'
import { Header } from './components/Header'
import { LimitingFactorCard } from './components/LimitingFactorCard'
import { DailyLogSection } from './components/DailyLogSection'
import { LeaderboardView } from './components/LeaderboardView'
import { CagnotteView } from './components/CagnotteView'
import { WeeklyPollModal } from './components/WeeklyPollModal'
import { IosInstallModal } from './components/IosInstallModal'
import { ReminderModal } from './components/ReminderModal'
import { ProfileModal } from './components/ProfileModal'
import { AuthScreen } from './components/AuthScreen'
import { ProfileForm } from './components/ProfileForm'
import { sound } from './utils/audio'

type Tab = 'me' | 'leaderboard' | 'cagnotte'

const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-[#090A0D] flex items-center justify-center">
    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
  </div>
)

// ------------------------------------------------------------------------------
// Application principale (utilisateur connecté et membre du groupe)
// ------------------------------------------------------------------------------
const MainApp: React.FC<{
  session: Session
  profile: UserProfile
  onProfileChange: () => Promise<void>
}> = ({ session, profile, onProfileChange }) => {
  const userId = session.user.id
  const [today, setToday] = useState(todayInParis)
  const weeks = useMemo(() => buildWeeks(today), [today])
  const [selectedWeek, setSelectedWeek] = useState<WeekDefinition>(() => defaultWeek(buildWeeks(todayInParis())))
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const t = todayInParis()
    const w = defaultWeek(buildWeeks(t))
    return t >= w.startDate && t <= w.endDate ? t : w.startDate
  })
  const [users, setUsers] = useState<UserProfile[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([])
  const [ideas, setIdeas] = useState<CagnotteIdea[]>([])
  const [loaded, setLoaded] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const params = new URLSearchParams(window.location.search)
  const [activeTab, setActiveTab] = useState<Tab>(() => (params.get('tab') as Tab) || 'me')

  const [pollModalOpen, setPollModalOpen] = useState(false)
  const [iosModalOpen, setIosModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  const entriesRef = useRef<DailyEntry[]>([])
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve())

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 4000)
  }, [])

  const refreshAll = useCallback(async () => {
    try {
      const [u, e, s, i] = await Promise.all([
        StorageService.getProfiles(userId),
        StorageService.getDailyEntries(),
        StorageService.getWeeklySettlements(),
        StorageService.getCagnotteIdeas(),
      ])
      setUsers(u)
      entriesRef.current = e
      setEntries(e)
      setSettlements(s)
      setIdeas(i)
      setLoaded(true)
    } catch (err) {
      showError('Impossible de charger les données : ' + (err as Error).message)
    }
  }, [userId, showError])

  // Chargement initial + temps réel + rafraîchissement au retour sur l'app
  useEffect(() => {
    refreshAll()
    hasActiveSubscription().then(setPushEnabled).catch(() => {})

    let timer: ReturnType<typeof setTimeout> | undefined
    const debounced = () => {
      clearTimeout(timer)
      timer = setTimeout(refreshAll, 400)
    }
    const channel = supabase
      .channel('mooscles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_entries' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_settlements' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cagnotte_ideas' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_votes' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debounced)
      .subscribe()

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setToday(todayInParis())
        refreshAll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [refreshAll])

  // Ouvre le sondage si on arrive depuis une notif (?poll=N)
  useEffect(() => {
    const pollWeek = Number(params.get('poll'))
    if (pollWeek) {
      const w = buildWeeks(todayInParis()).find((x) => x.weekNumber === pollWeek)
      if (w) {
        setSelectedWeek(w)
        setSelectedDate(w.startDate)
        setPollModalOpen(true)
      }
    }
    if (params.has('poll') || params.has('tab') || params.has('code')) {
      window.history.replaceState(null, '', '/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Garde les libellés de semaine à jour (ex. "En cours")
  const currentSelectedWeek = weeks.find((w) => w.weekNumber === selectedWeek.weekNumber) ?? selectedWeek

  const handleSelectWeek = (w: WeekDefinition) => {
    sound.vibrate(15)
    setSelectedWeek(w)
    if (selectedDate < w.startDate || selectedDate > w.endDate) {
      setSelectedDate(today >= w.startDate && today <= w.endDate ? today : w.startDate)
    }
  }

  const userWeekEntries = entries.filter(
    (e) => e.userId === userId && e.date >= currentSelectedWeek.startDate && e.date <= currentSelectedWeek.endDate
  )
  const totalP = userWeekEntries.reduce((acc, curr) => acc + (curr.pushups || 0), 0)
  const totalS = userWeekEntries.reduce((acc, curr) => acc + (curr.squats || 0), 0)
  const totalG = userWeekEntries.reduce((acc, curr) => acc + (curr.plankSeconds || 0), 0)
  const activeUserScore = calculateWeekScore(totalP, totalS, totalG)

  const currentDayEntry = entries.find((e) => e.userId === userId && e.date === selectedDate)

  // Dernière semaine terminée sans vote → pastille rouge + bandeau
  const lastPastWeek = [...weeks].reverse().find((w) => w.isPast)
  const pendingPollWeek =
    lastPastWeek && !settlements.some((s) => s.userId === userId && s.weekNumber === lastPastWeek.weekNumber)
      ? lastPastWeek
      : undefined

  const handleUpdateEntry = (delta: {
    pushups?: number
    squats?: number
    plankSeconds?: number
    exactPushups?: number
    exactSquats?: number
    exactPlankSeconds?: number
  }) => {
    const date = selectedDate
    if (date > today) return
    const list = entriesRef.current
    const existing = list.find((e) => e.userId === userId && e.date === date)
    const base = existing ?? { pushups: 0, squats: 0, plankSeconds: 0 }
    const next: DailyEntry = {
      id: existing?.id ?? `tmp-${date}`,
      userId,
      date,
      pushups: delta.exactPushups ?? Math.max(0, base.pushups + (delta.pushups ?? 0)),
      squats: delta.exactSquats ?? Math.max(0, base.squats + (delta.squats ?? 0)),
      plankSeconds: delta.exactPlankSeconds ?? Math.max(0, base.plankSeconds + (delta.plankSeconds ?? 0)),
      updatedAt: new Date().toISOString(),
    }
    // Mise à jour optimiste, puis enregistrement dans l'ordre des clics
    const updated = existing ? list.map((e) => (e === existing ? next : e)) : [...list, next]
    entriesRef.current = updated
    setEntries(updated)

    saveQueue.current = saveQueue.current.then(() =>
      StorageService.saveDailyEntry(userId, date, undefined, {
        exactPushups: next.pushups,
        exactSquats: next.squats,
        exactPlankSeconds: next.plankSeconds,
      }).catch((err) => {
        showError("Pas enregistré ! Vérifie ta connexion. (" + (err as Error).message + ')')
        refreshAll()
      })
    )
  }

  const handleConfirmWeeklyScore = async (score: number) => {
    try {
      await StorageService.recordWeeklyScore(currentSelectedWeek.weekNumber, score)
      setSettlements(await StorageService.getWeeklySettlements())
    } catch (err) {
      showError((err as Error).message)
    }
  }

  const handleTogglePaid = async (settlementId: string, isPaid: boolean) => {
    try {
      await StorageService.toggleSettlementPaid(settlementId, isPaid)
      setSettlements(await StorageService.getWeeklySettlements())
    } catch (err) {
      showError((err as Error).message)
    }
  }

  const handleAddIdea = async (title: string, description: string) => {
    try {
      await StorageService.addCagnotteIdea(title, description, userId)
      setIdeas(await StorageService.getCagnotteIdeas())
    } catch (err) {
      showError((err as Error).message)
    }
  }

  const handleToggleIdeaVote = async (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId)
    if (!idea) return
    try {
      await StorageService.toggleIdeaVote(ideaId, userId, idea.votes.includes(userId))
      setIdeas(await StorageService.getCagnotteIdeas())
    } catch (err) {
      showError((err as Error).message)
    }
  }

  const handleLogout = async () => {
    try {
      await disablePush()
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut()
  }

  const me = users.find((u) => u.id === userId) ?? profile

  if (!loaded) return <FullScreenLoader />

  return (
    <div className="min-h-screen bg-[#090A0D] text-zinc-100 flex flex-col font-sans pb-24">
      <Header
        activeUser={me}
        onOpenProfile={() => setProfileModalOpen(true)}
        notificationsOn={pushEnabled}
        pollPending={Boolean(pendingPollWeek)}
        weeks={weeks}
        selectedWeek={currentSelectedWeek}
        onSelectWeek={handleSelectWeek}
        onOpenIosGuide={() => setIosModalOpen(true)}
        onOpenReminderModal={() => setReminderModalOpen(true)}
        onOpenPollModal={() => setPollModalOpen(true)}
      />

      <main className="max-w-xl mx-auto w-full px-3.5 sm:px-4 pt-3.5 flex-1">
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs font-semibold text-red-200">
            {errorMsg}
          </div>
        )}

        {pendingPollWeek && (
          <button
            onClick={() => {
              setSelectedWeek(pendingPollWeek)
              setSelectedDate(pendingPollWeek.startDate)
              setPollModalOpen(true)
            }}
            className="w-full mb-3 p-3 rounded-xl bg-[#D4F932] text-black text-left text-xs font-bold flex items-center justify-between"
          >
            <span>📜 Semaine {pendingPollWeek.weekNumber} terminée : vote ton bilan !</span>
            <span className="font-black">→</span>
          </button>
        )}

        {!pushEnabled && !pendingPollWeek && (
          <button
            onClick={() => setReminderModalOpen(true)}
            className="w-full mb-3 p-3 rounded-xl bg-[#141720] border border-[#2B3142] text-left text-xs font-semibold text-zinc-200 flex items-center justify-between"
          >
            <span>🔔 Active le rappel de 19h pour ne rien oublier</span>
            <span className="font-black text-[#D4F932]">→</span>
          </button>
        )}

        {activeTab === 'me' && (
          <div className="space-y-3.5">
            <LimitingFactorCard
              score={activeUserScore}
              userName={me.name}
              weekLabel={currentSelectedWeek.label}
            />
            <DailyLogSection
              selectedWeek={currentSelectedWeek}
              selectedDate={selectedDate}
              today={today}
              onSelectDate={setSelectedDate}
              currentEntry={currentDayEntry}
              onUpdateEntry={handleUpdateEntry}
            />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            users={users}
            selectedWeek={currentSelectedWeek}
            entries={entries}
            settlements={settlements}
          />
        )}

        {activeTab === 'cagnotte' && (
          <CagnotteView
            users={users}
            weeks={weeks}
            settlements={settlements}
            ideas={ideas}
            activeUserId={userId}
            isAdmin={me.role === 'admin'}
            onTogglePaid={handleTogglePaid}
            onAddIdea={handleAddIdea}
            onToggleIdeaVote={handleToggleIdeaVote}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-[#090A0D]/95 backdrop-blur-xl border-t border-[#232734] px-4 py-2.5 pb-safe z-40">
        <div className="max-w-xl mx-auto grid grid-cols-3">
          {(
            [
              { id: 'me', label: 'Entraînement', Icon: Dumbbell },
              { id: 'leaderboard', label: 'Classement', Icon: BarChart3 },
              { id: 'cagnotte', label: 'Cagnotte', Icon: Wallet },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                sound.vibrate(15)
                setActiveTab(id)
              }}
              className={`flex flex-col items-center py-1 transition-colors ${
                activeTab === id ? 'text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200 font-semibold'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${activeTab === id ? 'text-[#D4F932]' : ''}`} />
              <span className="text-xs font-mono tracking-tight uppercase">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <WeeklyPollModal
        isOpen={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        selectedWeek={currentSelectedWeek}
        userName={me.name}
        userId={userId}
        computedScore={activeUserScore}
        currentSettlementScore={
          settlements.find((s) => s.userId === userId && s.weekNumber === currentSelectedWeek.weekNumber)?.score
        }
        onConfirmScore={handleConfirmWeeklyScore}
      />

      <IosInstallModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />

      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        userId={userId}
        enabled={pushEnabled}
        onEnabledChange={setPushEnabled}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={me}
        email={session.user.email}
        onSave={async (v) => {
          await StorageService.updateMyProfile(userId, v)
          await onProfileChange()
          await refreshAll()
        }}
        onLogout={handleLogout}
      />
    </div>
  )
}

// ------------------------------------------------------------------------------
// Nouveau mot de passe (après clic sur le lien "mot de passe oublié")
// ------------------------------------------------------------------------------
const NewPasswordScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="min-h-screen bg-[#090A0D] flex items-center justify-center px-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-[#141720] border border-[#2B3142] p-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          const { error } = await supabase.auth.updateUser({ password })
          if (error) setError(error.message)
          else onDone()
        }}
      >
        <h2 className="text-base font-bold text-white">Nouveau mot de passe</h2>
        <input
          type="password"
          minLength={6}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button className="w-full py-3 rounded-xl bg-[#D4F932] text-black font-mono font-black text-xs uppercase">
          Enregistrer
        </button>
      </form>
    </div>
  )
}

// ------------------------------------------------------------------------------
// Racine : session → profil → app
// ------------------------------------------------------------------------------
export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const loadProfile = useCallback(async () => {
    if (!userId) return
    try {
      setProfile(await StorageService.getMyProfile(userId))
    } catch {
      setProfile(null)
    }
  }, [userId])

  useEffect(() => {
    setProfile(undefined)
    if (userId) loadProfile()
  }, [userId, loadProfile])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#090A0D] text-red-300 flex items-center justify-center p-6 text-sm text-center">
        Configuration Supabase manquante (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
      </div>
    )
  }

  if (session === undefined) return <FullScreenLoader />
  if (recovering && session) return <NewPasswordScreen onDone={() => setRecovering(false)} />
  if (!session) return <AuthScreen />
  if (profile === undefined) return <FullScreenLoader />

  if (profile === null) {
    return (
      <div className="min-h-screen bg-[#090A0D] text-zinc-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <img src="/brand/mascot.webp" alt="Mooscles" width={640} height={511} className="w-48 h-auto mx-auto mb-5" />
          <ProfileForm
            title="Rejoindre le challenge"
            subtitle="Demande le code d'invitation à l'organisateur du groupe."
            askInviteCode
            submitLabel="C'est parti !"
            onSubmit={async (v) => {
              await StorageService.joinChallenge(v.code, v.name, v.avatar, v.color)
              await loadProfile()
            }}
            footer={
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="w-full text-xs text-zinc-400 hover:text-white font-semibold"
              >
                Utiliser un autre compte
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return <MainApp key={session.user.id} session={session} profile={profile} onProfileChange={loadProfile} />
}

export default App
