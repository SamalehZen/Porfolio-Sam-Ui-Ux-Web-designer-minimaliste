import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

const DURATION = 900

export function useCountUp(target: number, run: boolean, decimals = 4) {
  const [value, setValue] = useState(() => (run ? target : 0))
  const started = useRef(false)

  useEffect(() => {
    if (!run || started.current) return
    started.current = true
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION)
      setValue(target * (1 - Math.pow(2, -10 * p)))
      if (p < 1) raf = requestAnimationFrame(step)
      else setValue(target)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [run, target])

  const digits = String(Math.floor(Math.abs(target))).length
  const [int, frac] = value.toFixed(decimals).split('.')
  return `${int.padStart(digits, '0')}.${frac}`
}
