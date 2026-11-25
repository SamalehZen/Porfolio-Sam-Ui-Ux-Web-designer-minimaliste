import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
} from '@/lib/installPrompt'

export type { BeforeInstallPromptEvent } from '@/lib/installPrompt'

const DISMISS_KEY = 'oxira:install-dismissed'
/** After a dismissal the offer stays quiet for a month before returning. */
const DISMISS_TTL = 30 * 24 * 60 * 60 * 1000

/** True once the site runs from the home screen rather than a browser tab. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayMode = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return displayMode || iosStandalone
}

/**
 * iOS Safari cannot install from script, so the offer explains the Share sheet
 * instead. Every iOS browser is WebKit, but only Safari can add to the home
 * screen, hence the exclusion list. iPadOS reports itself as a Mac, recognised
 * by its touch points.
 */
function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  const isOtherBrowser = /crios|fxios|edgios|opios|mercury/i.test(ua)
  return isIos && !isOtherBrowser
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const at = Number.parseInt(raw, 10)
    return Number.isFinite(at) && Date.now() - at < DISMISS_TTL
  } catch {
    // Storage can throw in private mode; treat it as "never dismissed".
    return false
  }
}

function rememberDismissal(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // Not being able to persist the choice only means the offer may return.
  }
}

export type InstallMode = 'native' | 'ios'

export type InstallPrompt = {
  /** Whether the install offer should be on screen. */
  visible: boolean
  /** `native` on Chrome/Edge, `ios` for the manual Share-sheet flow, else null. */
  mode: InstallMode | null
  /** Opens the native dialog; resolves with the user's answer. */
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  /** Hides the offer and remembers the choice. */
  dismiss: () => void
}

/**
 * Drives the "install this site" offer.
 *
 * Chromium: reads the deferred `beforeinstallprompt` event buffered in
 * `lib/installPrompt` so the button can call `prompt()` inside the user's click
 * — browsers ignore it otherwise.
 * iOS: no such event exists, so the offer switches to instructions.
 * Installed or recently dismissed: nothing is offered at all.
 */
export function useInstallPrompt(): InstallPrompt {
  const deferred = useSyncExternalStore(
    subscribeInstallPrompt,
    getDeferredInstallPrompt,
    getDeferredInstallPrompt,
  )
  const [installed, setInstalled] = useState(isStandalone)
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed)
  const [isIos] = useState(isIosSafari)

  useEffect(() => {
    const onInstalled = () => {
      setInstalled(true)
      clearDeferredInstallPrompt()
    }
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const onDisplayMode = () => setInstalled(isStandalone())

    window.addEventListener('appinstalled', onInstalled)
    displayMode.addEventListener('change', onDisplayMode)

    return () => {
      window.removeEventListener('appinstalled', onInstalled)
      displayMode.removeEventListener('change', onDisplayMode)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return 'unavailable' as const
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // The event can only be used once; a second click would do nothing.
    clearDeferredInstallPrompt()
    if (outcome === 'dismissed') {
      rememberDismissal()
      setDismissed(true)
    }
    return outcome
  }, [deferred])

  const dismiss = useCallback(() => {
    rememberDismissal()
    setDismissed(true)
  }, [])

  const mode: InstallMode | null = deferred ? 'native' : isIos ? 'ios' : null

  return { visible: mode !== null && !installed && !dismissed, mode, install, dismiss }
}
