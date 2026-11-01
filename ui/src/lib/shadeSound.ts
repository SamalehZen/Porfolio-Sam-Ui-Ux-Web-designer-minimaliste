/**
 * Cabin shade cue. A short recording, played at low volume every time the
 * shade settles fully open or fully closed (i.e. when the theme flips).
 */
let player: HTMLAudioElement | null = null
let failed = false

export function playShade() {
  if (failed || typeof Audio === 'undefined') return
  try {
    if (!player) {
      player = new Audio(`${import.meta.env.BASE_URL}shade-on.m4a`)
      player.preload = 'auto'
      player.volume = 0.2
      player.addEventListener('error', () => {
        failed = true
        player = null
      }, { once: true })
    }
    player.currentTime = 0
    player.play().catch(() => {})
  } catch {
    failed = true
  }
}
