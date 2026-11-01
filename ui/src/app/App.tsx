import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import AccessPass from '@/components/boarding-pass/AccessPass'
import Folio from '@/sections/Folio'
import Notch from '@/components/notch/Notch'
import Splash from '@/components/splash/Splash'
import { canRender3D } from '@/components/cabin/PlaneWindow'
import { prefersReducedMotion } from '@/lib/motion'

const GRANTED_KEY = 'mikescv-pass-unlocked'
const DARK_KEY = 'mikescv-cabin-dark'

export default function App() {
  const [phase, setPhase] = useState<'splash' | 'pass' | 'site'>('splash')
  const [splash, setSplash] = useState(true)
  const [passEnabled, setPassEnabled] = useState(() => {
    try {
      return !localStorage.getItem(GRANTED_KEY) && canRender3D()
    } catch {
      return false
    }
  })
  const [initialShade] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 1 : 0,
  )
  const veil = useRef<HTMLDivElement>(null)
  const recolourTimer = useRef(0)
  const mainRef = useRef<HTMLElement>(null)

  const covered = phase !== 'site'

  useEffect(() => {
    document.documentElement.classList.toggle('is-covered', covered)
    return () => document.documentElement.classList.remove('is-covered')
  }, [covered])

  useEffect(() => {
    document.title = 'Oxira — Samaleh Mohamed Hassan Arka'
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const applyTheme = useCallback((dark: boolean) => {
    const root = document.documentElement
    root.classList.remove('is-recolouring')
    void root.offsetWidth
    root.classList.add('is-recolouring')
    clearTimeout(recolourTimer.current)
    recolourTimer.current = window.setTimeout(
      () => root.classList.remove('is-recolouring'),
      520 + 60,
    )
    if (dark) root.dataset.theme = 'dark'
    else delete root.dataset.theme
    try {
      if (dark) localStorage.setItem(DARK_KEY, '1')
      else localStorage.removeItem(DARK_KEY)
    } catch {
      /* storage can be unavailable */
    }
    const v = veil.current
    if (v) {
      v.style.transition = 'opacity 300ms var(--ease-out, ease-out)'
      v.style.opacity = '0'
      window.setTimeout(() => {
        if (v) v.style.transition = ''
      }, 340)
    }
  }, [])

  const onShadeChange = useCallback(
    (v: number, settled: boolean) => {
      if (settled) {
        if (v >= 0.999) return applyTheme(true)
        if (v <= 0.001) return applyTheme(false)
      }
      const el = veil.current
      if (!el) return
      const dark = document.documentElement.dataset.theme === 'dark'
      el.style.transition = ''
      el.style.backgroundColor = dark ? '#faf5f5' : '#191817'
      el.style.opacity = String(dark ? 1 - v : v)
    },
    [applyTheme],
  )

  const onGranted = useCallback(() => {
    try {
      localStorage.setItem(GRANTED_KEY, '1')
    } catch {
      /* ignore */
    }
    setPhase('site')
  }, [])

  const onSplashDone = useCallback(() => {
    setPhase(passEnabled ? 'pass' : 'site')
    window.setTimeout(() => setSplash(false), 280)
  }, [passEnabled])

  const onReset = useCallback(() => {
    try {
      localStorage.removeItem(GRANTED_KEY)
      localStorage.removeItem(DARK_KEY)
    } catch {
      /* ignore */
    }
    // Replay the gateway in place (no reload) when WebGL is available.
    if (canRender3D()) {
      applyTheme(false)
      window.scrollTo(0, 0)
      setPassEnabled(true)
      setPhase('pass')
    } else {
      location.reload()
    }
  }, [applyTheme])

  const booting = covered

  return (
    <>
      <Notch />
      <Folio
        mainRef={mainRef}
        booting={booting}
        inert={booting}
        initialShade={initialShade}
        onShadeChange={onShadeChange}
        onReset={onReset}
      />
      {passEnabled && phase !== 'site' && (
        <Suspense fallback={null}>
          <AccessPass onGranted={onGranted} onSkip={onGranted} />
        </Suspense>
      )}
      {splash && <Splash onDone={onSplashDone} />}
      <div
        ref={veil}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none', opacity: 0 }}
      />
      {prefersReducedMotion() ? null : null}
    </>
  )
}
