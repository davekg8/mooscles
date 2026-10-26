import React, { useState } from 'react'
import { X, Send, Check } from 'lucide-react'
import { FUN_REMINDER_MESSAGES } from '../utils/challengeConstants'
import { sound } from '../utils/audio'

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const [testSent, setTestSent] = useState(false)
  const [permissionState, setPermissionState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const handleTestNotification = async () => {
    sound.vibrate([40, 20, 60])
    sound.playClick()

    const randomMsg =
      FUN_REMINDER_MESSAGES[Math.floor(Math.random() * FUN_REMINDER_MESSAGES.length)]

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification('Mooscles 🐮', {
          body: randomMsg,
          icon: '/favicon.svg',
        })
      } else if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission()
        setPermissionState(res)
        if (res === 'granted') {
          new Notification('Mooscles 🐮', {
            body: randomMsg,
            icon: '/favicon.svg',
          })
        }
      }
    }

    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
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
            Relance Quotidienne
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Rappel à 19h00
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Notification de rappel envoyée chaque jour à 19h00 si la séance n'est pas encore saisie.
          </p>
        </div>

        {/* Status */}
        <div className="mb-3.5 p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Permissions du navigateur :</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              permissionState === 'granted'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1C1F2B] text-zinc-300 border border-[#2A2E3D]'
            }`}
          >
            {permissionState === 'granted' ? 'Autorisées' : 'À autoriser'}
          </span>
        </div>

        {/* Humorous Examples Preview */}
        <div className="space-y-1.5 mb-5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
            Exemples de notifications envoyées :
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

        {/* Test Notification Action */}
        <button
          onClick={handleTestNotification}
          className="w-full py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          {testSent ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" /> Notification envoyée !
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Tester la notification en direct
            </>
          )}
        </button>
      </div>
    </div>
  )
}
