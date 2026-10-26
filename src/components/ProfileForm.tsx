import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AVATARS, COLORS } from '../utils/challengeConstants'

interface ProfileFormProps {
  title: string
  subtitle?: string
  askInviteCode?: boolean
  initial?: { name: string; avatar: string; color: string }
  submitLabel: string
  onSubmit: (values: { code: string; name: string; avatar: string; color: string }) => Promise<void>
  onCancel?: () => void
  footer?: React.ReactNode
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  title,
  subtitle,
  askInviteCode,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  footer,
}) => {
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('code') ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0])
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ code: code.trim(), name: name.trim(), avatar, color })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4 space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      {askInviteCode && (
        <div>
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Code d'invitation
          </label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MOO-XXXXXX"
            autoCapitalize="characters"
            className="mt-1 w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3.5 py-3 text-sm font-mono font-bold tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-300"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Ton prénom</label>
        <input
          required
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : David"
          className="mt-1 w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3.5 py-3 text-sm font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-300"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Ton avatar</label>
        <div className="mt-1.5 grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`aspect-square rounded-xl text-lg flex items-center justify-center border transition-all ${
                avatar === a ? 'bg-white border-white' : 'bg-[#1C202C] border-[#2D3344]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Ta couleur</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl bg-[#1C202C] text-zinc-300 text-xs font-mono font-bold"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] disabled:opacity-60 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
      </div>
      {footer}
    </form>
  )
}
