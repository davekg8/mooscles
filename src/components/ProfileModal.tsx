import React from 'react'
import { LogOut, X } from 'lucide-react'
import type { UserProfile } from '../types'
import { ProfileForm } from './ProfileForm'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  email?: string
  onSave: (values: { name: string; avatar: string; color: string }) => Promise<void>
  onLogout: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, email, onSave, onLogout }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-lg bg-[#181B24] border border-[#242836] text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <ProfileForm
          title="Mon profil"
          subtitle={`${email ?? ''}${profile.role === 'admin' ? ' • Trésorier de la cagnotte 💰' : ''}`}
          initial={{ name: profile.name, avatar: profile.avatar, color: profile.color }}
          submitLabel="Enregistrer"
          onSubmit={async (v) => {
            await onSave({ name: v.name, avatar: v.avatar, color: v.color })
            onClose()
          }}
          footer={
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl border border-[#32384A] text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Se déconnecter
            </button>
          }
        />
      </div>
    </div>
  )
}
