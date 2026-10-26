import { supabase, VAPID_PUBLIC_KEY } from './supabaseClient'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/** L'appareil a-t-il déjà un abonnement push actif ? */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return Boolean(sub)
}

/** Demande la permission et enregistre l'appareil pour les rappels de 19h. À appeler sur un clic. */
export async function enablePush(userId: string): Promise<void> {
  if (!isPushSupported()) {
    throw new Error(
      isIos() && !isStandalone()
        ? "Sur iPhone, installe d'abord l'app sur l'écran d'accueil (Partager → Sur l'écran d'accueil), puis ouvre-la depuis l'icône."
        : 'Ce navigateur ne supporte pas les notifications push.'
    )
  }
  if (!VAPID_PUBLIC_KEY) throw new Error('Clé VAPID manquante (VITE_VAPID_PUBLIC_KEY).')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notifications refusées. Active-les dans Réglages → Notifications → Mooscles.')
  }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw new Error(error.message)
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}

async function callPush(body: Record<string, unknown>): Promise<{ sent: number }> {
  const { data, error } = await supabase.functions.invoke('push', { body })
  if (error) throw new Error(error.message)
  return data as { sent: number }
}

export const sendTestPush = () => callPush({ action: 'test' })
export const nudgeFriend = (targetUserId: string) => callPush({ action: 'nudge', targetUserId })
