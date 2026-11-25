/**
 * Buffers the one-shot `beforeinstallprompt` event.
 *
 * Chrome fires it at most once per page load and never replays it, so an effect
 * that subscribes after React has mounted can miss it entirely — leaving an
 * eligible visitor with no offer at all. The listener is therefore installed
 * from `main.tsx` before the first render, and the captured event is handed out
 * through this tiny store.
 */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
let watching = false
const listeners = new Set<() => void>()

const emit = () => {
  for (const listener of listeners) listener()
}

/** Starts capturing the event. Safe to call more than once. */
export function watchInstallPrompt(): void {
  if (watching || typeof window === 'undefined') return
  watching = true

  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppress the browser's own mini-infobar so the in-site card owns the offer.
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    emit()
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Stable snapshot for `useSyncExternalStore`: the event object, or null. */
export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred
}

/** The event is single-use, so it is dropped once it has been prompted. */
export function clearDeferredInstallPrompt(): void {
  deferred = null
  emit()
}
