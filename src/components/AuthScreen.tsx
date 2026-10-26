import React, { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const inputClass =
  'w-full bg-[#1C202C] border border-[#32384A] rounded-xl px-3.5 py-3 text-sm font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-300'

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/already registered/i.test(msg)) return 'Un compte existe déjà avec cet email. Connecte-toi.'
  if (/email not confirmed/i.test(msg)) return "Ton email n'est pas encore confirmé. Regarde ta boîte mail."
  if (/password should be at least/i.test(msg)) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (/rate limit/i.test(msg)) return 'Trop de tentatives, réessaie dans quelques minutes.'
  return msg
}

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Compte créé ! Clique sur le lien reçu par email pour le confirmer, puis connecte-toi.')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo('Email envoyé ! Clique sur le lien pour choisir un nouveau mot de passe.')
        setMode('login')
      }
    } catch (err) {
      setError(translateError((err as Error).message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090A0D] text-zinc-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#161922] border border-[#2B3142] flex items-center justify-center text-3xl">
            🐮
          </div>
          <h1 className="mt-3 font-black text-xl tracking-widest uppercase font-mono text-white">Mooscles</h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">19 Oct — 17 Déc • 250 pompes • 250 squats • 10 min</p>
        </div>

        {mode !== 'reset' && (
          <div className="grid grid-cols-2 rounded-2xl bg-[#141720] border border-[#2B3142] p-1.5 mb-4">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                }}
                className={`py-2.5 text-xs font-mono font-bold rounded-xl transition-all ${
                  mode === m ? 'bg-white text-black' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl bg-[#141720] border border-[#2B3142] p-4 space-y-3">
          {mode === 'reset' && (
            <p className="text-xs text-zinc-300">Entre ton email, on t'envoie un lien pour changer ton mot de passe.</p>
          )}
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {mode !== 'reset' && (
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Mot de passe (6 caractères min.)"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          )}

          {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
          {info && <p className="text-xs font-semibold text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#D4F932] hover:bg-[#c2e72a] disabled:opacity-60 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Se connecter
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" /> Créer mon compte
              </>
            ) : (
              'Envoyer le lien'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'reset' ? 'login' : 'reset')
              setError(null)
            }}
            className="w-full text-xs text-zinc-400 hover:text-white font-semibold pt-1"
          >
            {mode === 'reset' ? '← Retour' : 'Mot de passe oublié ?'}
          </button>
        </form>
      </div>
    </div>
  )
}
