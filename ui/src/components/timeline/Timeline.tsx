import { useState } from 'react'
import { TIMELINE, type Entry, type Study } from '@/content/portfolio'

const LIFT = -4
const SCALE = 1.05
const FALLOFF = 0.45

function Avatar({
  logo,
  active,
  index,
  hovered,
  onEnter,
  onLeave,
}: {
  logo: { src: string; name?: string }
  active: boolean
  index: number
  hovered: number | null
  onEnter: () => void
  onLeave: () => void
}) {
  const shift =
    hovered == null ? 0 : LIFT * Math.pow(FALLOFF, Math.abs(index - hovered))
  return (
    <span
      className="tl-avatar t-avatar"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={
        {
          '--shift': `${shift.toFixed(3)}px`,
          '--scale-active': active ? SCALE : 1,
          transitionTimingFunction: 'var(--avatar-ease-in)',
          zIndex: active ? 2 : 1,
        } as React.CSSProperties
      }
    >
      <span className="tl-logo" aria-hidden="true">
        <img src={logo.src} alt="" draggable="false" />
      </span>
    </span>
  )
}

function Case({ study, href }: { study: Study; href?: string }) {
  const Tag = href ? 'a' : 'div'
  return (
    <li className="tl-case">
      <Tag
        className={`case${href ? ' case--live' : ''}`}
        aria-label={study.title}
        data-project-inactive={href ? undefined : 'true'}
        {...(href ? { href } : {})}
      >
        <span className="tl-dot tl-dot-case" aria-hidden="true" />
        <span className="case-shots" aria-hidden="true">
          {study.shots.map((s, i) => (
            <span className="cs-shot" key={i}>
              <img src={s} alt="" draggable="false" />
            </span>
          ))}
        </span>
        <span className="case-text">
          <span className="case-title">{study.title}</span>
          <span className="case-desc">{study.desc}</span>
        </span>
      </Tag>
    </li>
  )
}

function EntryRow({ entry }: { entry: Entry }) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <li className="tl-entry">
      <span className="tl-logos" onPointerLeave={() => setHovered(null)}>
        {entry.logos.map((logo, i) => (
          <Avatar
            key={i}
            logo={logo}
            index={i}
            hovered={hovered}
            active={hovered === i}
            onEnter={() => setHovered(i)}
            onLeave={() => setHovered(null)}
          />
        ))}
      </span>
      <span className="tl-head">
        <span className="tl-year">
          <span className="tl-route">{entry.route}</span>
          <span className="tl-yearnum">{entry.year}</span>
        </span>
        <span className={`tl-dot tl-dot-${entry.current ? 'now' : 'past'}`} aria-hidden="true" />
        <span className="tl-company">
          {entry.company}
        </span>
        {entry.current && <span className="tl-badge">Actuel</span>}
      </span>
      <div className="tl-body">
        <p className="tl-role">{entry.role}</p>
        <p className="tl-desc">{entry.desc}</p>
      </div>
      {entry.cases.length > 0 && (
        <ul className="tl-cases">
          {entry.cases.map((c, i) => (
            <Case key={`${c.title}-${i}`} study={c} href={i === 0 && entry.current ? `${import.meta.env.BASE_URL}carousel/` : undefined} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Timeline() {
  return (
    <ol className="folio-timeline">
      {TIMELINE.map((e) => (
        <EntryRow key={e.company} entry={e} />
      ))}
    </ol>
  )
}
