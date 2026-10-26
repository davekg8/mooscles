import React, { useState } from 'react'
import { X, Send, Check, BellRing, BellOff, Loader2 } from 'lucide-react'
import { FUN_REMINDER_MESSAGES } from '../utils/challengeConstants'
import { sound } from '../utils/audio'
import {
  disablePush,
  enablePush,
  isIos,
  isPushSupported,
  isStandalone,
  notificationPermission,
  sendTestPush,
} from '../services/pushService'

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

const ReminderModalContent: React.FC<Omit<ReminderModalProps, 'isOpen'>> = ({
  onClose,
  userId,
  enabled,
  onEnabledChange,
}) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testSent, setTestSent] = useState(false)
  const needsInstall = isIos() && !isStandalone()

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleEnable = () =>
    run(async () => {
      await enablePush(userId)
      onEnabledChange(true)
      sound.playSuccess()
    })

  const handleDisable = () =>
    run(async () => {
      await disablePush()
      onEnabledChange(false)
    })

  const handleTest = () =>
    run(async () => {
      sound.vibrate([40, 20, 60])
      const { sent } = await sendTestPush()
      if (sent === 0) throw new Error("Aucun appareil n'a reçu la notif. Réactive les rappels.")
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    })

  const permission = notificationPermission()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#12141A] border border-[#202430] rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[#181B24] border border-[#242836] text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Relance Quotidienne
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">Rappel à 19h00</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chaque soir à 19h si tu n'as rien saisi dans la journée, et chaque lundi pour le bilan de la semaine et
            ce que tu dois à la cagnotte.
          </p>
        </div>

        <div className="mb-3.5 p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Sur cet appareil :</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              enabled
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1C1F2B] text-zinc-300 border border-[#2A2E3D]'
            }`}
          >
            {enabled ? 'Rappels activés' : permission === 'denied' ? 'Bloquées' : 'Désactivés'}
          </span>
        </div>

        {needsInstall && (
          <div className="mb-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 leading-relaxed">
            📲 Sur iPhone, les notifications ne marchent que si l'app est installée : bouton Partager → « Sur l'écran
            d'accueil », puis ouvre Mooscles depuis l'icône.
          </div>
        )}

        <div className="space-y-1.5 mb-5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
            Exemples :
          </span>
          {FUN_REMINDER_MESSAGES.slice(0, 3).map((msg, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#181B24] border border-[#242836] text-xs font-mono text-zinc-300 leading-relaxed"
            >
              {msg}
            </div>
          ))}
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-red-400">{error}</p>}

        {!enabled ? (
          <button
            onClick={handleEnable}
            disabled={busy || !isPushSupported()}
            className="w-full py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] disabled:opacity-50 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
            Activer les rappels de 19h
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleTest}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] disabled:opacity-60 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : testSent ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Notification envoyée !
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> M'envoyer une notif de test
                </>
              )}
            </button>
            <button
              onClick={handleDisable}
              disabled={busy}
              className="w-full py-2.5 rounded-xl border border-[#32384A] text-zinc-400 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              <BellOff className="w-3.5 h-3.5" /> Désactiver sur cet appareil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, ...rest }) =>
  isOpen ? <ReminderModalContent {...rest} /> : null
