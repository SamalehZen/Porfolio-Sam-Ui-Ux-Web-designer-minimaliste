import { useCallback, useEffect, useRef, useState } from 'react'
import PlaneWindowScene from '@/components/cabin/PlaneWindowScene'
import { cloud, windowBack, windowFront, windowShutter } from '@/assets'
import {
  CLIP_GLASS_INNER,
  CLIP_PANE,
  DESIGN_H,
  DESIGN_W,
  GLASS,
  GLASS_RADIUS,
  SHADE_TRAVEL,
  SPRING,
  clipInset,
} from '@/config/geometry'
import { prefersReducedMotion } from '@/lib/motion'

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

function useShade(initial: number, onChange: (v: number, settled: boolean) => void) {
  const [shade, setShade] = useState(initial)
  const [dragging, setDragging] = useState(false)
  const cur = useRef(initial)
  const vel = useRef(0)
  const raf = useRef(0)
  const target = useRef<number | null>(null)
  const drag = useRef<{ y: number; from: number; t: number; armed: boolean } | null>(null)

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
    target.current = null
  }, [])

  const settle = useCallback(
    (to: number, dur = 900) => {
      if (raf.current) cancelAnimationFrame(raf.current)
      if (prefersReducedMotion()) {
        cur.current = to
        setShade(to)
        return
      }
      const from = cur.current
      const diff = to - from
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - start) / dur, 1)
        cur.current = from + diff * easeInOutCubic(p)
        setShade(cur.current)
        if (p < 1) {
          raf.current = requestAnimationFrame(step)
          return
        }
        cur.current = to
        setShade(to)
        vel.current = 0
        raf.current = 0
        target.current = null
      }
      raf.current = requestAnimationFrame(step)
    },
    [],
  )

  const springTo = useCallback((to: number) => {
    target.current = to
    if (raf.current) return
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const t = target.current ?? cur.current
      const a = SPRING.stiffness * (t - cur.current) - SPRING.damping * vel.current
      vel.current += a * dt
      const next = cur.current + vel.current * dt
      if (Math.abs(vel.current) < SPRING.stopV && Math.abs(t - next) < SPRING.stopX) {
        cur.current = t
        setShade(t)
        vel.current = 0
        raf.current = 0
        target.current = null
        return
      }
      cur.current = Math.max(0, Math.min(1, next))
      setShade(cur.current)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    onChange(shade, !raf.current)
  }, [shade, onChange])

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    },
    [],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      stop()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setDragging(true)
      vel.current = 0
      drag.current = { y: e.clientY, from: cur.current, t: performance.now(), armed: false }
    },
    [stop],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = drag.current
      if (!d) return
      const dy = e.clientY - d.y
      const c = Math.max(0, Math.min(1, d.from + dy / SHADE_TRAVEL))
      const finish = (to: number) => {
        setDragging(false)
        drag.current = null
        cur.current = c
        setShade(c)
        settle(to, Math.max(260, 900 * Math.abs(to - c)))
      }
      if (!d.armed && Math.abs(c - d.from) > 0.1) d.armed = true
      if (d.armed) {
        if (c <= 0.1) return finish(0)
        if (c >= 0.9) return finish(1)
      }
      const flip = d.from < 0.5 ? 1 : 0
      if (flip === 1 ? c >= 0.5 : c <= 0.5) return finish(flip)
      const now = performance.now()
      const dt = (now - d.t) / 1000
      if (dt > 0) vel.current = (c - cur.current) / dt
      if (c === 0 || c === 1) vel.current = 0
      d.t = now
      cur.current = c
      setShade(c)
    },
    [settle],
  )

  const lastUp = useRef(0)
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      lastUp.current = performance.now()
      if (!drag.current) return
      setDragging(false)
      drag.current = null
      e.currentTarget.releasePointerCapture?.(e.pointerId)
      if (vel.current > 1.6) return springTo(1)
      if (vel.current < -1.6) return springTo(0)
      springTo(cur.current > 0.5 ? 1 : 0)
    },
    [springTo],
  )

  const toggle = useCallback(() => {
    stop()
    settle(cur.current > 0.5 ? 0 : 1)
  }, [settle, stop])

  const onClick = useCallback(() => {
    if (performance.now() - lastUp.current < 500) return
    toggle()
  }, [toggle])

  return {
    shade,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick,
    },
  }
}

const FALLBACK_CLOUDS = [
  { left: '-30%', top: '34%', width: '105%', opacity: 0.7 },
  { left: '30%', top: '30%', width: '100%', opacity: 0.6 },
  { left: '-15%', top: '46%', width: '135%', opacity: 0.95 },
]

function SkyFallback() {
  return (
    <>
      {FALLBACK_CLOUDS.map((c, i) => (
        <img
          key={i}
          src={cloud}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{ position: 'absolute', pointerEvents: 'none', ...c }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: '64% 0 0 0',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #FFFFFF 70%)',
        }}
      />
    </>
  )
}

function PaneImage({
  src,
  shade,
  dim,
  style,
}: {
  src: string
  shade: number
  dim: number
  style?: React.CSSProperties
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        filter: `brightness(${1 - shade * dim})`,
        ...style,
      }}
    />
  )
}

export default function PlaneWindow({
  paused = false,
  initialShade = 0,
  onShadeChange,
}: {
  paused?: boolean
  initialShade?: number
  onShadeChange: (v: number, settled: boolean) => void
}) {
  const [use3d] = useState(() => canRender3D())
  const { shade, dragging, handlers } = useShade(initialShade, onShadeChange)
  const closed = shade > 0.92

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        width: '200px',
        height: '300px',
        margin: '0 auto',
        isolation: 'isolate',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: CLIP_PANE,
          WebkitClipPath: CLIP_PANE,
          background:
            'linear-gradient(to bottom, #5CADF4 0%, #94CCFB 33%, #C8E6FB 45%, #FFFFFF 50%)',
        }}
      >
        {use3d ? (
          <PlaneWindowScene paused={paused || closed} />
        ) : (
          <SkyFallback />
        )}
      </div>

      <PaneImage src={windowBack} shade={shade} dim={0.86} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: CLIP_GLASS_INNER,
          WebkitClipPath: CLIP_GLASS_INNER,
          pointerEvents: 'none',
        }}
      >
        <PaneImage
          src={windowShutter}
          shade={shade}
          dim={0.82}
          style={{ transform: `translate3d(0, ${-(1 - shade) * 0.57 * 100}%, 0)` }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${GLASS.left / 3}px`,
            top: `${GLASS.top / 3}px`,
            width: `${(GLASS.right - GLASS.left) / 3}px`,
            height: `${(GLASS.bottom - GLASS.top) / 3}px`,
            borderRadius: `${GLASS_RADIUS / 3}px`,
            pointerEvents: 'none',
            boxShadow:
              'inset 0 0 11px rgba(28, 25, 22, 0.42), inset 0 0 3px rgba(28, 25, 22, 0.30)',
            maskImage: P(currentMask()),
            WebkitMaskImage: P(currentMask()),
            maskSize: '200px 300px',
            WebkitMaskSize: '200px 300px',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: `${-GLASS.left / 3}px ${-GLASS.top / 3 - (1 - shade) * SHADE_TRAVEL}px`,
            WebkitMaskPosition: `${-GLASS.left / 3}px ${-GLASS.top / 3 - (1 - shade) * SHADE_TRAVEL}px`,
          }}
        />
      </div>

      <PaneImage src={windowFront} shade={shade} dim={0.8} />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: P(windowFront),
          WebkitMaskImage: P(windowFront),
          maskSize: 'cover',
          WebkitMaskSize: 'cover',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
          opacity: shade * 0.55,
          background:
            'linear-gradient(to bottom, #6a6e78 0%, #878b95 38%, #a2a7ae 100%)',
        }}
      />

      <button
        type="button"
        {...handlers}
        aria-pressed={shade > 0.5}
        title={shade > 0.5 ? 'Ouvrir le store' : 'Fermer le store'}
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: clipInset(GLASS, GLASS_RADIUS, 6),
          WebkitClipPath: clipInset(GLASS, GLASS_RADIUS, 6),
          background: 'none',
          border: 0,
          padding: 0,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          {shade > 0.5 ? 'Ouvrir le store' : 'Fermer le store'}
        </span>
      </button>
    </div>
  )
}

function P(src: string) {
  return `url(${src})`
}

let cachedMask = ''
function currentMask() {
  if (!cachedMask) cachedMask = windowShutter
  return cachedMask
}

export function canRender3D() {
  if (prefersReducedMotion()) return false
  const cores = navigator.hardwareConcurrency
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  // deviceMemory is Chromium-only: its absence must not disable the gateway
  // (Safari/Firefox expose no deviceMemory but render WebGL fine).
  if (cores && mem && cores <= 2 && mem <= 2) return false
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext) {
      const r = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
      if (/swiftshader|llvmpipe|softwarepipe|basic render|generic renderer/i.test(r)) return false
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export { DESIGN_W, DESIGN_H }
