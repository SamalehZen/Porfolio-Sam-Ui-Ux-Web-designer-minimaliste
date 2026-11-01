/**
 * Interface sound palette.
 *
 * Small WebAudio synthesiser: every cue is built from oscillators and filtered
 * noise bursts, so nothing has to be downloaded. Presets mirror the envelope
 * values used across the interface, expressed in seconds and linear gain.
 */

type Tone = {
  kind: 'tone'
  waveform: OscillatorType
  frequency: number
  detune?: number
  glideTo?: number
  glideTime?: number
  attack: number
  decay: number
  peak: number
  offset?: number
}

type Noise = {
  kind: 'noise'
  filterType: BiquadFilterType
  filterFrequency: number
  filterQ?: number
  attack: number
  decay: number
  peak: number
  offset?: number
}

type Shimmer = { delay: number; feedback: number; wet: number; lowpass: number }

export type CueName = 'press' | 'error' | 'sparkle' | 'chime'

type Preset = { masterGain: number; layers: (Tone | Noise)[]; shimmer?: Shimmer }

const PRESETS: Record<CueName, Preset> = {
  press: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
    ],
  },
  error: {
    masterGain: 0.42,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.13 },
      { kind: 'tone', waveform: 'triangle', frequency: 440, offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 },
      { kind: 'tone', waveform: 'triangle', frequency: 349.23, offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 },
    ],
  },
  sparkle: {
    masterGain: 0.5,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
      { kind: 'tone', waveform: 'sine', frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
      { kind: 'tone', waveform: 'sine', frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
      { kind: 'tone', waveform: 'sine', frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 },
    ],
    shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
  },
  chime: {
    masterGain: 0.5,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
    ],
    shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
  },
}

const TAIL = 0.05
const SHIM_SPACING = 0.05
const SHIM_EPSILON = 0.001

let ctx: AudioContext | null = null
let unsupported = false

function getContext(): AudioContext | null {
  if (unsupported || typeof window === 'undefined') return null
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    unsupported = true
    return null
  }
  try {
    ctx = new Ctor()
  } catch {
    unsupported = true
  }
  return ctx
}

/** Called from the first user gesture so mobile browsers unlock audio. */
export function unlockAudio() {
  const c = getContext()
  if (c && c.state !== 'running') c.resume().catch(() => {})
}

function toneLayer(c: AudioContext, dest: AudioNode, l: Tone, at: number) {
  const osc = c.createOscillator()
  osc.type = l.waveform
  osc.frequency.setValueAtTime(l.frequency, at)
  if (l.detune) osc.detune.value = l.detune
  if (l.glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(l.glideTo, at + (l.glideTime ?? l.attack + l.decay))
  }
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(l.peak, at + l.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + l.attack + l.decay)
  osc.connect(gain).connect(dest)
  osc.start(at)
  osc.stop(at + l.attack + l.decay + TAIL)
}

function noiseLayer(c: AudioContext, dest: AudioNode, l: Noise, at: number) {
  const length = l.attack + l.decay + TAIL
  const frames = Math.max(1, Math.floor(length * c.sampleRate))
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = 2 * Math.random() - 1
  const source = c.createBufferSource()
  source.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = l.filterType
  filter.frequency.value = l.filterFrequency
  if (l.filterQ !== undefined) filter.Q.value = l.filterQ
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(l.peak, at + l.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + l.attack + l.decay)
  source.connect(filter).connect(gain).connect(dest)
  source.start(at)
  source.stop(at + length)
}

function shimmer(c: AudioContext, dest: AudioNode, out: AudioNode, s: Shimmer) {
  const delay = c.createDelay(1)
  delay.delayTime.value = s.delay
  const lowpass = c.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = s.lowpass
  const feedback = c.createGain()
  feedback.gain.value = s.feedback
  const wet = c.createGain()
  wet.gain.value = s.wet
  dest.connect(delay)
  delay.connect(lowpass)
  lowpass.connect(feedback)
  feedback.connect(delay)
  lowpass.connect(wet)
  wet.connect(out)
  return [delay, lowpass, feedback, wet]
}

function layerDuration(p: Preset) {
  return Math.max(...p.layers.map((l) => (l.offset ?? 0) + l.attack + l.decay + TAIL))
}

function shimmerTail(s?: Shimmer) {
  if (!s || s.feedback <= 0) return 0
  if (s.feedback >= 1) return s.delay
  return s.delay * (1 + Math.ceil(Math.log(SHIM_EPSILON) / Math.log(s.feedback)))
}

/** Plays one of the interface cues. No-op until the browser allows audio. */
export function playCue(name: CueName) {
  const c = getContext()
  if (!c) return
  if (c.state !== 'running') {
    c.resume().then(() => playCue(name)).catch(() => {})
    return
  }
  const preset = PRESETS[name]
  const start = c.currentTime
  const master = c.createGain()
  master.gain.value = preset.masterGain
  master.connect(c.destination)
  const shim = preset.shimmer ? shimmer(c, master, c.destination, preset.shimmer) : []
  for (const layer of preset.layers) {
    const at = start + (layer.offset ?? 0)
    if (layer.kind === 'tone') toneLayer(c, master, layer, at)
    else noiseLayer(c, master, layer, at)
  }
  const life = (layerDuration(preset) + shimmerTail(preset.shimmer) + SHIM_SPACING) * 1000
  window.setTimeout(() => {
    master.disconnect()
    shim.forEach((node) => node.disconnect())
  }, life)
}
