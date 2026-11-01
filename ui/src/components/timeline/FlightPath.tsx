import { useEffect, useRef } from 'react'

const DESKTOP_PATH = 'M43 0V7.3A39 39 0 0 1 21.71 42.05A39 39 0 0 0 0.5 76.75V110'
const CURVE_H = 110
const R = 30
const STRAIGHT = 15
const MOBILE_H = STRAIGHT + R * 2 // 75
const SMOOTH = 0.12

function mobilePath(width: number) {
  const t = width + 0.5
  return `M${t} 0V${STRAIGHT}A${R} ${R} 0 0 1 ${t - R} ${STRAIGHT + R}H${0.5 + R}A${R} ${R} 0 0 0 0.5 ${MOBILE_H}`
}

export default function FlightPath({
  trackRef,
  tailRef,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>
  tailRef: React.RefObject<HTMLDivElement | null>
}) {
  const root = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const dotsRef = useRef<SVGPathElement>(null)
  const lit = useRef<SVGPathElement>(null)
  const rail = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const tail = tailRef.current
    if (!track || !tail) return
    const measureTail = () => {
      // Layout-based (transforms from the reveal animation must not skew this).
      let y = 0
      let el: HTMLElement | null = tail
      while (el && el !== track) {
        y += el.offsetTop
        el = el.offsetParent as HTMLElement | null
        if (el === document.body) break
      }
      const centre = y + tail.offsetHeight / 2
      track.style.setProperty('--rail-tail', `${(track.offsetHeight - centre).toFixed(1)}px`)
    }
    measureTail()
    const ro = new ResizeObserver(measureTail)
    ro.observe(tail)
    ro.observe(track)
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'itemReveal' || e.animationName === 'itemRevealReduced') measureTail()
    }
    track.addEventListener('animationend', onEnd)
    const raf = requestAnimationFrame(measureTail)
    return () => {
      ro.disconnect()
      track.removeEventListener('animationend', onEnd)
      cancelAnimationFrame(raf)
    }
  }, [trackRef, tailRef])

  useEffect(() => {
    const container = root.current
    const s = svg.current
    const litPath = lit.current
    const dotsPath = dotsRef.current
    const railEl = rail.current
    const track = trackRef.current
    if (!container || !s || !litPath || !dotsPath || !railEl || !track) return

    let pathLen = 118
    let curveH = CURVE_H
    let railH = 0
    let topAbs = 0
    let dots: { el: Element; y: number; lit: boolean }[] = []

    function classic() {
      curveH = CURVE_H
      s!.removeAttribute('style')
      s!.setAttribute('viewBox', `0 0 44 ${CURVE_H}`)
      for (const p of [dotsPath, litPath]) p!.setAttribute('d', DESKTOP_PATH)
    }

    function shape() {
      const centre = getComputedStyle(track!).getPropertyValue('--plan-centre').trim() === '1'
      if (!centre) return classic()
      const plane = track!.querySelector('.plan-plane')
      if (!plane) return
      const pr = plane.getBoundingClientRect()
      const rr = railEl!.getBoundingClientRect()
      const w = Math.max(R * 2, pr.left + pr.width / 2 - (rr.left + rr.width / 2))
      curveH = MOBILE_H
      s!.setAttribute('viewBox', `0 0 ${w + 1} ${MOBILE_H}`)
      s!.style.width = `${w + 1}px`
      s!.style.height = `${MOBILE_H}px`
      const d = mobilePath(w)
      for (const p of [dotsPath, litPath]) p!.setAttribute('d', d)
    }

    const measure = () => {
      shape()
      pathLen = litPath!.getTotalLength() || 118
      railH = railEl!.offsetHeight
      topAbs = container!.getBoundingClientRect().top + window.scrollY
      dots = [...track!.querySelectorAll('.tl-dot')].map((el) => {
        const r = el.getBoundingClientRect()
        return {
          el,
          y: r.top + r.height / 2 + window.scrollY,
          lit: el.classList.contains('is-lit'),
        }
      })
    }

    let cur = 0
    let target = 0
    let raf = 0

    const tick = () => {
      raf = 0
      const diff = target - cur
      cur = Math.abs(diff) < 2e-4 ? target : cur + diff * SMOOTH
      const dist = cur * (pathLen + railH)
      const cp = Math.min(1, Math.max(0, dist / pathLen))
      const rp = railH ? Math.min(1, Math.max(0, (dist - pathLen) / railH)) : 0
      container!.style.setProperty('--curve-p', cp.toFixed(4))
      container!.style.setProperty('--rail-p', rp.toFixed(4))
      const edge = topAbs + curveH * cp + railH * rp
      for (const d of dots) {
        const on = d.y <= edge
        if (on !== d.lit) {
          d.lit = on
          d.el.classList.toggle('is-lit', on)
        }
      }
      if (cur !== target) raf = requestAnimationFrame(tick)
    }

    const progress = (y: number) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      return max <= 0 ? 1 : Math.min(1, Math.max(0, y / max))
    }

    const onScroll = () => {
      target = progress(window.scrollY)
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const refresh = () => {
      measure()
      onScroll()
    }

    measure()
    cur = progress(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', refresh)
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'itemReveal' || e.animationName === 'itemRevealReduced') refresh()
    }
    track.addEventListener('animationend', onAnimEnd)
    const ro = new ResizeObserver(refresh)
    ro.observe(document.body)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', refresh)
      track.removeEventListener('animationend', onAnimEnd)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [trackRef])

  return (
    <div className="folio-path" ref={root} aria-hidden="true">
      <svg className="path-curve" viewBox={`0 0 44 ${CURVE_H}`} fill="none" ref={svg}>
        <path className="pc-dots" d={DESKTOP_PATH} ref={dotsRef} />
        <path className="pc-lit" d={DESKTOP_PATH} pathLength="1" ref={lit} />
      </svg>
      <div className="path-rail" ref={rail}>
        <div className="path-lit" />
      </div>
      <svg className="path-tip" viewBox="0 0 7 3" fill="none">
        <path d="M0.5 0.5 3.5 2.5 6.5 0.5" />
      </svg>
    </div>
  )
}
