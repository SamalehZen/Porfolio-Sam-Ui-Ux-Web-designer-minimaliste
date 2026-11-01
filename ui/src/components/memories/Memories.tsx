import { useState } from 'react'
import { MEMORIES } from '@/content/portfolio'

const POS = [
  { x: -55.8, y: 0.2, r: -7.65 },
  { x: -26.1, y: -1.7, r: -3 },
  { x: 0, y: -2.1, r: 0 },
  { x: 26.2, y: -1.4, r: 3 },
  { x: 55.9, y: 0.2, r: 7.54 },
]
const PUSH = 9
const FALLOFF = 0.5

export default function Memories() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="memories" onPointerLeave={() => setActive(null)}>
      {MEMORIES.map((m, i) => {
        const p = POS[i] ?? POS[POS.length - 1]
        const isActive = active === i
        const rel = active == null ? 0 : i - active
        const push = rel === 0 ? 0 : Math.sign(rel) * PUSH * Math.pow(FALLOFF, Math.abs(rel) - 1)
        return (
          <span
            key={i}
            className={`mem-card${isActive ? ' is-active' : ''}`}
            onPointerEnter={() => setActive(i)}
            style={
              {
                '--x': `${(p.x + push).toFixed(2)}px`,
                '--y': `${(isActive ? p.y - 11 : p.y).toFixed(2)}px`,
                '--r': `${(isActive ? p.r * 0.3 : p.r).toFixed(2)}deg`,
                '--s': isActive ? 1.12 : 1,
                zIndex: isActive ? 10 : POS.length - i,
              } as React.CSSProperties
            }
          >
            <img src={m.src} alt={m.caption} draggable="false" />
            {isActive && m.caption && (
              <span className="mem-tip" aria-hidden="true">
                {m.caption}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
