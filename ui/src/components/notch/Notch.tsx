import { useEffect, useRef, useState } from 'react'
import avatarUrl from '@/assets/notch/avatar.jpg'
import '@/styles/notch.css'

const SUN = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="#fff" />
    <g stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </g>
  </svg>
)

export default function Notch() {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const spring = useRef({ x: 0, v: 0, raf: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const st = spring.current
    if (st.raf) cancelAnimationFrame(st.raf)
    const target = open ? 1 : 0
    let last = performance.now()
    const k = 95
    const c = 17.5
    const write = () => {
      const p = st.x
      el.style.width = `${(237 + 39 * p).toFixed(2)}px`
      el.style.height = `${(55 + 44 * p).toFixed(2)}px`
      el.style.setProperty('--p', p.toFixed(4))
      el.style.setProperty('--sh', `${(48 + 24 * p).toFixed(2)}px`)
      el.style.setProperty('--s', (1 + 0.5 * p).toFixed(4))
      const pb = p <= 0.78 ? 0 : Math.min(1, (p - 0.78) / 0.2)
      el.style.setProperty('--pb', pb.toFixed(3))
    }
    write()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033)
      last = now
      st.v += (k * (target - st.x) - c * st.v) * dt
      st.x += st.v * dt
      if (Math.abs(st.v) < 0.002 && Math.abs(target - st.x) < 0.001) {
        st.x = target
        st.v = 0
        write()
        st.raf = 0
        return
      }
      write()
      st.raf = requestAnimationFrame(step)
    }
    st.raf = requestAnimationFrame(step)
    return () => {
      if (st.raf) cancelAnimationFrame(st.raf)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('touchstart', onDown as unknown as EventListener, true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('touchstart', onDown as unknown as EventListener, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    tick()
    const id = window.setInterval(tick, 30000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      ref={ref}
      className={`notch${open ? ' is-open' : ''}`}
      style={{ width: 237, height: 55 }}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          setOpen((v) => !v)
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label="Profil et disponibilité"
    >
      <div className="notch-inner">
        <div className="notch-top">
          <div className="notch-user">
            <div className="notch-avatar">
              <img src={avatarUrl} alt="Samaleh Mohamed Hassan Arka" width={39} height={39} />
            </div>
            <div className="notch-info">
              <p className="notch-name">Samaleh</p>
              <p className="notch-role">Designer</p>
            </div>
          </div>
          <p className="notch-time">{time}</p>
        </div>
        <div className="notch-bottom" aria-hidden={!open}>
          <div className="notch-weather">
            <span>DJ •, 31°C, Ensoleillé</span>
            {SUN}
          </div>
          <div className="notch-avail">
            <span className="notch-pulse"><i /><i /></span>
            <span>Disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}
