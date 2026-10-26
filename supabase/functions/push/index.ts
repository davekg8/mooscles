// 🐮 Mooscles — notifications push
//
// Actions (POST JSON) :
//   { action: "daily" }                 → rappel de 19h (appelé par pg_cron avec le header x-cron-secret)
//   { action: "nudge", targetUserId }   → "secouer un pote" (utilisateur connecté)
//   { action: "test" }                  → notif de test sur ses propres appareils (utilisateur connecté)

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CHALLENGE_START = '2026-10-19'
const CHALLENGE_END = '2026-12-17'
const TIER = { pushups: 50, squats: 50, plank: 120 }

const DAILY_MESSAGES = [
  "Il est 19h ! Tes pecs et tes cuisses t'attendent 🐮",
  "1 € économisé = 50 pompes. À toi de jouer 💰",
  "Pas d'excuses, même 20 pompes devant Netflix ça compte ⏰",
  "Ton corps ou la cagnotte va te remercier. Choisis ton camp 🔥",
  "Tes potes valident leurs squats. Tu vas te laisser distancer ? 👀",
  "2 minutes de gainage et c'est un palier de plus 🫡",
]

const NUDGE_MESSAGES = [
  'te secoue ! Bouge-toi 🫨',
  "trouve que t'es un peu mou cette semaine 🐌",
  "a déjà fait ses pompes. Et toi ? 💪",
  'te rappelle que la cagnotte a faim 🤑',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Date et heure à Paris
function parisNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 }
}

function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function weekOf(date: string) {
  if (date < CHALLENGE_START || date > CHALLENGE_END) return null
  const diff = Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(CHALLENGE_START + 'T12:00:00Z')) / 86400000)
  const n = Math.floor(diff / 7) + 1
  const start = addDays(CHALLENGE_START, (n - 1) * 7)
  let end = addDays(start, 6)
  if (end > CHALLENGE_END) end = CHALLENGE_END
  return { n, start, end }
}

function tierOf(p: number, s: number, g: number) {
  return Math.min(5, Math.floor(p / TIER.pushups), Math.floor(s / TIER.squats), Math.floor(g / TIER.plank))
}

async function getConfig() {
  const { data, error } = await admin.rpc('get_server_config')
  if (error) throw error
  return data as Record<string, string>
}

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

async function sendTo(subs: Sub[], payload: Record<string, unknown>) {
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 4 },
        )
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        } else {
          console.error('push error', code, (err as Error).message)
        }
      }
    }),
  )
  return sent
}

async function subsFor(userIds: string[]) {
  if (userIds.length === 0) return [] as Sub[]
  const { data } = await admin.from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id', userIds)
  return (data ?? []) as Sub[]
}

async function authedUser(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return null
  const { data: profile } = await admin.from('profiles').select('id,name').eq('id', data.user.id).maybeSingle()
  return profile as { id: string; name: string } | null
}

async function runDaily(force: boolean) {
  const now = parisNow()
  if (!force && now.hour !== 19) return { skipped: `il est ${now.hour}h à Paris` }

  const today = now.date
  const yesterday = addDays(today, -1)
  const currentWeek = weekOf(today)
  const endedWeek = weekOf(yesterday)
  const bilanWeek = endedWeek && endedWeek.end === yesterday ? endedWeek : null

  if (!currentWeek && !bilanWeek) return { skipped: 'hors challenge' }

  const [{ data: profiles }, { data: entries }, { data: settlements }] = await Promise.all([
    admin.from('profiles').select('id,name'),
    admin.from('daily_entries').select('user_id,date,pushups,squats,plank_seconds').gte('date', CHALLENGE_START),
    admin.from('weekly_settlements').select('user_id,week_number,fine_amount,is_paid'),
  ])

  const payloads = new Map<string, Record<string, unknown>>()

  for (const p of profiles ?? []) {
    const mine = (entries ?? []).filter((e) => e.user_id === p.id)
    const sum = (from: string, to: string) =>
      mine.filter((e) => e.date >= from && e.date <= to).reduce(
        (acc, e) => ({ p: acc.p + e.pushups, s: acc.s + e.squats, g: acc.g + e.plank_seconds }),
        { p: 0, s: 0, g: 0 },
      )

    // Lundi (ou 18 déc.) : bilan de la semaine finie + rappel de payer
    if (bilanWeek) {
      const voted = (settlements ?? []).some((s) => s.user_id === p.id && s.week_number === bilanWeek.n)
      const owed = (settlements ?? [])
        .filter((s) => s.user_id === p.id && !s.is_paid)
        .reduce((acc, s) => acc + Number(s.fine_amount), 0)
      if (!voted) {
        const t = sum(bilanWeek.start, bilanWeek.end)
        const tier = tierOf(t.p, t.s, t.g)
        payloads.set(p.id, {
          title: `📜 Bilan semaine ${bilanWeek.n}`,
          body: `D'après tes saisies : ${tier}/5 → ${5 - tier} €. Viens voter en ton âme et conscience ☁️`,
          url: '/?poll=' + bilanWeek.n,
        })
        continue
      }
      if (owed > 0) {
        payloads.set(p.id, {
          title: '💰 Cagnotte Mooscles',
          body: `Tu dois encore ${owed} € à la cagnotte. Dans la joie et la bonne humeur 😇`,
          url: '/?tab=cagnotte',
        })
        continue
      }
    }

    // Rappel quotidien si rien saisi aujourd'hui
    if (currentWeek) {
      const todayEntry = mine.find((e) => e.date === today)
      const didSomething = todayEntry && (todayEntry.pushups + todayEntry.squats + todayEntry.plank_seconds > 0)
      if (didSomething) continue
      const t = sum(currentWeek.start, today)
      const tier = tierOf(t.p, t.s, t.g)
      const daysLeft = Math.round((Date.parse(currentWeek.end) - Date.parse(today)) / 86400000)
      let body = pick(DAILY_MESSAGES)
      if (tier < 5) {
        const next = tier + 1
        const miss = [
          Math.max(0, next * TIER.pushups - t.p) && `${Math.max(0, next * TIER.pushups - t.p)} pompes`,
          Math.max(0, next * TIER.squats - t.s) && `${Math.max(0, next * TIER.squats - t.s)} squats`,
          Math.max(0, next * TIER.plank - t.g) && `${Math.ceil(Math.max(0, next * TIER.plank - t.g) / 60)} min de gainage`,
        ].filter(Boolean)
        body += `\nPalier ${tier}/5 — pour le ${next}/5 : ${miss.join(', ')}.`
      } else {
        body = "5/5 cette semaine, t'es une machine. Saisis quand même ta séance 🏆"
      }
      if (daysLeft === 0 && tier < 5) body = `⚠️ Dernier jour de la semaine ! ` + body
      payloads.set(p.id, { title: `Mooscles 🐮 — Semaine ${currentWeek.n}`, body, url: '/' })
    }
  }

  const subs = await subsFor([...payloads.keys()])
  let sent = 0
  for (const [userId, payload] of payloads) {
    sent += await sendTo(subs.filter((s) => s.user_id === userId), payload)
  }
  return { today, users: payloads.size, sent }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  try {
    const cfg = await getConfig()
    webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private)

    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    if (action === 'daily') {
      if (req.headers.get('x-cron-secret') !== cfg.cron_secret) return json({ error: 'forbidden' }, 403)
      return json(await runDaily(Boolean(body.force)))
    }

    const me = await authedUser(req)
    if (!me) return json({ error: 'Connexion requise' }, 401)

    if (action === 'test') {
      const sent = await sendTo(await subsFor([me.id]), {
        title: 'Mooscles 🐮',
        body: `Ça marche ${me.name} ! Rendez-vous tous les jours à 19h 💪`,
        url: '/',
      })
      return json({ sent })
    }

    if (action === 'nudge') {
      const target = String(body.targetUserId ?? '')
      if (!target || target === me.id) return json({ error: 'Cible invalide' }, 400)
      const sent = await sendTo(await subsFor([target]), {
        title: '🫨 Relance Mooscles',
        body: `${me.name} ${pick(NUDGE_MESSAGES)}`,
        url: '/',
      })
      return json({ sent })
    }

    return json({ error: 'Action inconnue' }, 400)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message }, 500)
  }
})
