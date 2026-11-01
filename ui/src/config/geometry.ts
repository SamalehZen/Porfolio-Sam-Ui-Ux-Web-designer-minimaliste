// Measured design constants, taken from the reference implementation's
// computed geometry (600 × 900 design space rendered at 200 × 300 CSS px).

export const WINDOW_W = 200
export const WINDOW_H = 300
export const DESIGN_W = 600
export const DESIGN_H = 900

export const GLASS = { top: 132, bottom: 716, left: 79, right: 520 }
export const GLASS_RADIUS = 170
export const PANE = { top: 179, bottom: 653, left: 118, right: 481 }
export const PANE_RADIUS = 150

export const SHADE_TRAVEL = 300 * ((723 - 210) / 900) // 171px
export const SHADE_EPS = 0.92

export const SPRING = { stiffness: 190, damping: 26, stopV: 0.002, stopX: 0.001 }
export const DRAG = { flickV: 1.6, flipPoint: 0.5, minMs: 260, maxMs: 900, arm: 0.1 }

export function clipInset(
  rect: { top: number; bottom: number; left: number; right: number },
  radius: number,
  n = 0,
) {
  const top = ((rect.top - n) / DESIGN_H) * 100
  const right = ((DESIGN_W - rect.right - n) / DESIGN_W) * 100
  const bottom = ((DESIGN_H - rect.bottom - n) / DESIGN_H) * 100
  const left = ((rect.left - n) / DESIGN_W) * 100
  return `inset(${top}% ${right}% ${bottom}% ${left}% round ${(radius + n) / 3}px)`
}

export const CLIP_GLASS = clipInset(GLASS, GLASS_RADIUS, 0)
export const CLIP_GLASS_INNER = clipInset(GLASS, GLASS_RADIUS, 6)
export const CLIP_PANE = clipInset(PANE, PANE_RADIUS, 2)

// Boarding-pass gateway scene (measured world units).
export const PASS = {
  cardW: 3.2,
  cardH: +((3.2 * 240) / 492).toFixed(4),
  cardThickness: 0.014,
  cardRadius: 0.11,
  readerW: 3.2,
  readerTilt: 0.22,
  hoverY: 0.9,
  readerY: -1.2,
  slotY: -1.05,
  slotTol: 0.15,
  traverseSpan: 2.6,
  respawnMs: 50,
  fadeInS: 0.45,
  traverseZ: 0.2,
  maxDist: 132,
  minDist: 55,
  fitSpan: 6.6,
}
