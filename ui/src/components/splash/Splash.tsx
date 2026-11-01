import { useEffect, useRef, useState } from 'react'

const MIN_MS = 620
const CAP_MS = 12000

export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    let cancelled = false
    const started = performance.now()
    const ready = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
        Promise.all(
          [...document.images].map((img) =>
            img.complete ? Promise.resolve() : new Promise((r) => {
              img.addEventListener('load', r, { once: true })
              img.addEventListener('error', r, { once: true })
            }),
          ),
        ),
      ]),
      new Promise((r) => setTimeout(r, CAP_MS)),
    ])

    let timer: number | undefined
    ready.then(() => {
      if (cancelled) return
      const elapsed = performance.now() - started
      timer = window.setTimeout(
        () => {
          if (cancelled) return
          setLeaving(true)
          done.current?.()
        },
        Math.max(0, MIN_MS - elapsed),
      )
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <div className="splash-monogram">
        <span className="sr-only">Chargement</span>
<svg viewBox="0 0 48 48" aria-hidden="true" className="splash-monogram-mark">
          <rect width="48" height="48" rx="12" fill="#2563EB" />
          <rect x={9} y={9} width={7.5} height={7.5} fill="white" opacity={1} />
          <rect x={24} y={9} width={7.5} height={7.5} fill="white" opacity={0.6} />
          <rect x={16.5} y={16.5} width={7.5} height={7.5} fill="white" opacity={0.6} />
          <rect x={24} y={16.5} width={7.5} height={7.5} fill="white" opacity={0.45} />
          <rect x={31.5} y={16.5} width={7.5} height={7.5} fill="white" opacity={0.3} />
          <rect x={9} y={24} width={7.5} height={7.5} fill="white" opacity={0.6} />
          <rect x={16.5} y={24} width={7.5} height={7.5} fill="white" opacity={0.45} />
          <rect x={24} y={24} width={7.5} height={7.5} fill="white" opacity={0.3} />
          <rect x={31.5} y={24} width={7.5} height={7.5} fill="white" opacity={0.15} />
          <rect x={16.5} y={31.5} width={7.5} height={7.5} fill="white" opacity={0.3} />
          <rect x={24} y={31.5} width={7.5} height={7.5} fill="white" opacity={0.15} />
        </svg>
        <span className="splash-brand">Oxira</span>
      </div>
    </div>
  )
}
