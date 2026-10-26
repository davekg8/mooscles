import React from 'react'
import { X, Share, PlusSquare, Bell } from 'lucide-react'

interface IosInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

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
            Installation PWA iOS
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Ajouter Mooscles sur iPhone
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Nécessaire sur iOS pour activer les notifications de rappel à 19h00.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-5 text-xs text-zinc-300">
          <div className="p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-start gap-3">
            <span className="w-5 h-5 rounded bg-zinc-800 text-white font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
              1
            </span>
            <div>
              <p className="font-semibold text-white">Ouvrir dans Safari</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Sur iPhone, l'installation d'une PWA requiert le navigateur Safari.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-start gap-3">
            <span className="w-5 h-5 rounded bg-zinc-800 text-white font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
              2
            </span>
            <div>
              <p className="font-semibold text-white flex items-center gap-1.5">
                Bouton Partager <Share className="w-3.5 h-3.5 text-zinc-400" />
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Touchez l'icône de partage au centre de la barre d'onglets Safari.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-start gap-3">
            <span className="w-5 h-5 rounded bg-zinc-800 text-white font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
              3
            </span>
            <div>
              <p className="font-semibold text-white flex items-center gap-1.5">
                "Sur l'écran d'accueil" <PlusSquare className="w-3.5 h-3.5 text-zinc-400" />
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Faites défiler le menu et confirmez l'ajout.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181B24] border border-[#242836] flex items-start gap-3">
            <span className="w-5 h-5 rounded bg-[#D4F932] text-black font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
              4
            </span>
            <div>
              <p className="font-semibold text-white flex items-center gap-1.5">
                Autoriser les alertes <Bell className="w-3.5 h-3.5 text-[#D4F932]" />
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Lancez l'application depuis votre écran d'accueil et acceptez les notifications.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs uppercase transition-colors"
        >
          Compris
        </button>
      </div>
    </div>
  )
}
