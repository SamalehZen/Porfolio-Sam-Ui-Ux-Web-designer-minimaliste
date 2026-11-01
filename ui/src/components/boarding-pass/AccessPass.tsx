import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, useTexture } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { boardingPass, boardingPassBack } from '@/assets'
import { PASS } from '@/config/geometry'
import { playCue, unlockAudio } from '@/lib/audio'

/* ------------------------------------------------------------------ */
/* Measured scene constants                                            */
/* ------------------------------------------------------------------ */
const Rg = PASS.cardW
const jI = PASS.cardH
const $B = PASS.cardThickness
const TI = PASS.readerW
const hB = PASS.readerTilt
const PC = TI / 2 + Rg / 2
const xg = PASS.slotY + jI / 2
const A0 = (y: number) => (y - PASS.readerY) * Math.tan(hB)

const SE = 0.045
const bC = 0.35
const $w = bC - SE // 0.305
const wE = 0.12
const Aa = 0.03
const Ia = 2 * SE + wE + 2 * Aa
const ga = -wE / 2
const Wg = 0.92
const cC = 0.01
const oi = 0.3
const Ca = oi - SE // 0.255
const Ba = (SE + oi) / 2 // 0.1725
const iQ = 0.1
const Q0 = bC - iQ / 2 // 0.3
const UC = TI / 2 - 0.13 // 1.47
const sB = cC + Wg / 2 // 0.47
const Qa = 0.332
const Si = 0.09
const Ea = Qa - Si / 2 // 0.287
const E0 = sB - 0.002 // 0.468
const zC = 0.345
const i0 = 0.13
const D0 = 0.1
const o0 = 0.78
const S0 = -0.4
const ia = 0.05
const wi = 0.3
const ai = ia + wi / 2 // 0.2
const DQ = TI - 0.04 // 3.16

const CAM_DIST = (w: number, h: number) =>
  Math.max(55, Math.min(132, Math.min(w / 6.0, h / PASS.fitSpan)))

/* ------------------------------------------------------------------ */
/* Procedural device textures (measured reproduction)                  */
/* ------------------------------------------------------------------ */
function useBodyTexture(base: string, speckles: number) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const r = Math.random() * 70 + 45
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(172, 140, 74, ${Math.random() * 0.035 + 0.012})`)
      g.addColorStop(1, 'rgba(172, 140, 74, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = 0; i < speckles; i++) {
      ctx.fillStyle = `rgba(100, 90, 64, ${Math.random() * 0.1 + 0.035})`
      const r = Math.random() * 1.1 + 0.3
      ctx.beginPath()
      ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2)
      ctx.fill()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [base, speckles])
}

function useBumpTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')!
    ctx.fillStyle = 'rgb(199,199,199)'
    ctx.fillRect(0, 0, 512, 512)
    const q = 256
    const s = document.createElement('canvas')
    s.width = s.height = q
    const sc = s.getContext('2d')!
    const img = sc.createImageData(q, q)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 199 + (Math.random() - 0.5) * 20
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    sc.putImageData(img, 0, 0)
    ctx.globalAlpha = 0.4
    ctx.drawImage(s, 0, 0, 512, 512)
    ctx.globalAlpha = 1
    ctx.lineCap = 'round'
    const scratch = (len: number, spread: number, width: number, alpha: number) => {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const a = (Math.random() - 0.5) * spread
      const dx = Math.cos(a) * len
      const dy = Math.sin(a) * len
      ctx.lineWidth = width
      ctx.strokeStyle = `rgba(${Math.random() < 0.55 ? '255,255,255' : '90,90,90'}, ${alpha})`
      for (const [ox, oy] of [
        [0, 0],
        [-512, 0],
        [0, -512],
      ]) {
        ctx.beginPath()
        ctx.moveTo(x + ox, y + oy)
        ctx.lineTo(x + dx + ox, y + dy + oy)
        ctx.stroke()
      }
    }
    for (let i = 0; i < 420; i++) scratch(14 + Math.random() * 90, 0.5, 0.9 + Math.random() * 0.9, Math.random() * 0.34 + 0.14)
    for (let i = 0; i < 46; i++) scratch(120 + Math.random() * 320, 0.22, 1.2, Math.random() * 0.2 + 0.08)
    for (let i = 0; i < 16; i++) scratch(5 + Math.random() * 20, 2.4, 2.2, Math.random() * 0.3 + 0.25)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3.4, 0.68)
    tex.anisotropy = 8
    return tex
  }, [])
}

type Status = 'idle' | 'near' | 'error' | 'granted'

const LCD: Record<Status, { label: string; color: string }> = {
  idle: { label: 'READY', color: '#7d857c' },
  near: { label: 'READING', color: '#d9a013' },
  error: { label: 'ERROR', color: '#e0483a' },
  granted: { label: 'SUCCESS', color: '#35c56d' },
}

function useLcd() {
  return useMemo(() => {
    const make = (label: string, color: string) => {
      const c = document.createElement('canvas')
      c.width = 512
      c.height = 128
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      const draw = () => {
        const ctx = c.getContext('2d')!
        ctx.clearRect(0, 0, 512, 128)
        ctx.fillStyle = '#0d0f0d'
        ctx.fillRect(0, 0, 512, 128)
        ctx.fillStyle = 'rgba(255,255,255,0.025)'
        for (let y = 0; y < 128; y += 4) ctx.fillRect(0, y, 512, 1)
        ctx.font = '400 62px "MB LCD", "MB Mono", ui-monospace, monospace'
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '8px'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = color
        ctx.shadowBlur = 16
        ctx.fillStyle = color
        ctx.fillText(label, 262, 70)
        tex.needsUpdate = true
      }
      draw()
      return { tex, draw }
    }
    const set = {
      idle: make(LCD.idle.label, LCD.idle.color),
      near: make(LCD.near.label, LCD.near.color),
      error: make(LCD.error.label, LCD.error.color),
      granted: make(LCD.granted.label, LCD.granted.color),
    }
    document.fonts
      ?.load('400 62px "MB LCD"')
      .then(() => {
        Object.values(set).forEach((v) => v.draw())
      })
      .catch(() => {})
    return set
  }, [])
}

/* ------------------------------------------------------------------ */
/* Card shader (rounded corners + measured curvature)                  */
/* ------------------------------------------------------------------ */
function makeCardMaterial(opts: THREE.MeshStandardMaterialParameters, uniforms: Record<string, THREE.IUniform>) {
  const mat = new THREE.MeshStandardMaterial({ transparent: true, ...opts })
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uCurve; uniform float uSlant; uniform float uHalfW;
         varying vec2 vCardXY;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `float _nx = position.x / uHalfW;
         float _ddx = 2.0 * uCurve * _nx + uSlant;
         vec3 objectNormal = normalize(vec3(-_ddx, 0.0, 1.0));`,
      )
      .replace(
        '#include <begin_vertex>',
        `vCardXY = position.xy;
         vec3 transformed = vec3(position);
         transformed.z += uHalfW * (uCurve * (_nx * _nx - 0.3333) + uSlant * _nx);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uHalfW; uniform float uHalfH; uniform float uRadius;
         varying vec2 vCardXY;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         vec2 _q = abs(vCardXY) - (vec2(uHalfW, uHalfH) - uRadius);
         float _d = length(max(_q, 0.0)) + min(max(_q.x, _q.y), 0.0) - uRadius;
         float _aa = fwidth(_d);
         float _mask = 1.0 - smoothstep(-_aa, _aa, _d);
         if (_mask < 0.01) discard;
         diffuseColor.a *= _mask;`,
      )
  }
  return mat
}

/* ------------------------------------------------------------------ */
/* Contact shadow under the pass                                       */
/* ------------------------------------------------------------------ */
function SlotShadow({ contact }: { contact: React.RefObject<{ x: number; lift: number; fade: number }> }) {
  const uniforms = useMemo(
    () => ({
      uX: { value: 0 },
      uLift: { value: 1 },
      uFade: { value: 0 },
      uHalfW: { value: Rg / 2 },
    }),
    [],
  )
  useFrame(() => {
    const c = contact.current
    if (!c) return
    uniforms.uX.value = c.x
    uniforms.uLift.value = c.lift
    uniforms.uFade.value = c.fade
  })
  return (
    <mesh position={[0, sB + 0.004, ai]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[DQ, wi]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec2 vP;
          void main() {
            vP = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vP;
          uniform float uX;
          uniform float uLift;
          uniform float uFade;
          uniform float uHalfW;
          void main() {
            float blur = mix(0.05, 0.62, uLift);
            float dz = ${ai.toFixed(3)} - vP.y;
            float ax = 1.0 - smoothstep(uHalfW - blur, uHalfW + blur, abs(vP.x - uX));
            float az = exp(-dz / (blur * 0.55 + 0.05));
            float edge = 1.0 - smoothstep(${(DQ / 2 - 0.07).toFixed(3)}, ${(DQ / 2).toFixed(3)}, abs(vP.x));
            float a = ax * az * edge * mix(0.46, 0.07, uLift) * uFade;
            gl_FragColor = vec4(0.13, 0.115, 0.08, a);
          }
        `}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Reader                                                              */
/* ------------------------------------------------------------------ */
function Reader({
  status,
  contact,
}: {
  status: Status
  contact: React.RefObject<{ x: number; lift: number; fade: number }>
}) {
  const body = useBodyTexture('#e8ddc6', 900)
  const inner = useBodyTexture('#d7cbaf', 700)
  const bump = useBumpTexture()
  const lcd = useLcd()
  const ringColor =
    status === 'granted' ? '#1e9e52' : status === 'near' ? '#d9a013' : status === 'error' ? '#e0483a' : '#b3aea1'

  const mats = useMemo(() => {
    const outer = new THREE.MeshStandardMaterial({
      map: body,
      bumpMap: bump,
      bumpScale: 0.5,
      roughnessMap: bump,
      roughness: 1,
      metalness: 0.02,
      envMapIntensity: 0.45,
    })
    const shell = new THREE.MeshStandardMaterial({
      map: inner,
      bumpMap: bump,
      bumpScale: 0.4,
      roughnessMap: bump,
      roughness: 1,
      metalness: 0.02,
      envMapIntensity: 0.45,
    })
    return { outer, shell }
  }, [body, inner, bump])

  return (
    <group position={[0, PASS.readerY, 0]} rotation={[hB, 0, 0]}>
      <SlotShadow contact={contact} />
      <RoundedBox args={[TI, Wg, Ca]} radius={0.07} smoothness={6} position={[0, cC, Ba]} castShadow receiveShadow material={mats.shell} />
      <RoundedBox args={[TI, Wg, $w]} radius={0.08} smoothness={6} position={[0, cC, -0.1975 - wE]} castShadow receiveShadow material={mats.shell} />
      <RoundedBox
        args={[UC * 2, E0 - zC, Si]}
        radius={0.02}
        smoothness={5}
        position={[0, (E0 + zC) / 2, Ea]}
        castShadow
        receiveShadow
        material={mats.outer}
      />
      <RoundedBox
        args={[UC * 2, zC - i0, iQ]}
        radius={0.022}
        smoothness={5}
        position={[0, (zC + i0) / 2, Q0]}
        castShadow
        receiveShadow
        material={mats.outer}
      />
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[UC - o0, D0 - S0, iQ]}
          radius={0.022}
          smoothness={5}
          position={[(s * (UC + o0)) / 2, (D0 + S0) / 2, Q0]}
          castShadow
          receiveShadow
          material={mats.outer}
        />
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          {Array.from({ length: 12 }, (_, k) => (
            <mesh key={k} position={[s * (0.72 + k * 0.056), sB - 0.013, 0.195]}>
              <boxGeometry args={[0.018, 0.03, 0.185]} />
              <meshStandardMaterial color="#5b5341" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[s * UC, sB - 0.006, 0.175]}>
            <boxGeometry args={[0.014, 0.02, 0.25]} />
            <meshStandardMaterial color="#8c8267" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.15, ga]}>
        <boxGeometry args={[TI - 0.06, 0.6, Ia]} />
        <meshStandardMaterial color="#1c1b19" roughness={0.7} />
      </mesh>
      <RoundedBox args={[1.46, 0.44, 0.1]} radius={0.03} smoothness={4} position={[0, -0.14, 0.265]}>
        <meshStandardMaterial color="#232322" roughness={0.5} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, -0.14, 0.318]}>
        <planeGeometry args={[1.32, 0.33]} />
        <meshBasicMaterial map={lcd[status].tex} toneMapped={false} />
      </mesh>
      <group position={[1.35, -0.14, bC]}>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.066, 32]} />
          <meshStandardMaterial color="#141412" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <torusGeometry args={[0.052, 0.012, 12, 32]} />
          <meshStandardMaterial color="#4a4a46" roughness={0.35} metalness={0.65} />
        </mesh>
        <mesh position={[0, 0, 0.018]} scale={[1, 1, 0.32]}>
          <sphereGeometry args={[0.038, 24, 24]} />
          <meshPhysicalMaterial
            color={ringColor}
            emissive={ringColor}
            emissiveIntensity={status === 'idle' ? 0.2 : 2.6}
            roughness={0.12}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.04}
            toneMapped={false}
          />
        </mesh>
        {status !== 'idle' && (
          <>
            <mesh position={[0, 0, 0.038]}>
              <circleGeometry args={[0.11, 28]} />
              <meshBasicMaterial color={ringColor} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
            </mesh>
            <pointLight color={ringColor} intensity={0.5} distance={0.7} decay={2} position={[0, 0, 0.08]} />
          </>
        )}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Boarding pass card                                                  */
/* ------------------------------------------------------------------ */
type Mode = 'hover' | 'drag' | 'fall' | 'placed' | 'granted'

function BoardingPass({
  setStatus,
  onGranted,
  contact,
}: {
  setStatus: (s: Status | ((p: Status) => Status)) => void
  onGranted: () => void
  contact: React.RefObject<{ x: number; lift: number; fade: number }>
}) {
  const group = useRef<THREE.Group>(null)
  const front = useTexture(boardingPass)
  const back = useTexture(boardingPassBack)
  const { camera, size } = useThree()
  front.colorSpace = THREE.SRGBColorSpace
  back.colorSpace = THREE.SRGBColorSpace
  back.wrapS = THREE.RepeatWrapping
  back.repeat.x = -1
  front.anisotropy = back.anisotropy = 16

  const uniforms = useMemo(
    () => ({
      uCurve: { value: 0 },
      uSlant: { value: 0 },
      uHalfW: { value: Rg / 2 },
      uHalfH: { value: jI / 2 },
      uRadius: { value: PASS.cardRadius },
    }),
    [],
  )

  const mats = useMemo(
    () => [
      makeCardMaterial(
        { map: front, roughness: 1, metalness: 0, envMapIntensity: 0.18, side: THREE.FrontSide, shadowSide: THREE.DoubleSide },
        uniforms,
      ),
      makeCardMaterial(
        { map: back, roughness: 1, metalness: 0, envMapIntensity: 0.18, side: THREE.BackSide },
        uniforms,
      ),
    ],
    [front, back, uniforms],
  )

  const cardGeo = useMemo(() => new THREE.PlaneGeometry(Rg, jI, 90, 18), [])

  const mode = useRef<Mode>('hover')
  const [modeState, setMode] = useState<Mode>('hover')
  const pos = useRef(new THREE.Vector3(0, PASS.hoverY, 0))
  const vel = useRef(new THREE.Vector3())
  const angVel = useRef(new THREE.Vector3())
  const rotZ = useRef(0)
  const rotX = useRef(0)
  const grab = useRef(new THREE.Vector3())
  const prevX = useRef(0)
  const prevY = useRef(PASS.hoverY)
  const span = useRef<{ min: number; max: number } | null>(null)
  const granted = useRef(false)
  const fade = useRef(0)
  const respawnTimer = useRef(0)
  const wasInZone = useRef(false)
  const rot = useRef(new THREE.Euler())
  const sway = useRef({ curve: 0, curveV: 0, slant: 0, slantV: 0, x: 0, vx: 0, y: PASS.hoverY, vy: 0 })

  // Camera fit (measured formula).
  useEffect(() => {
    const dist = CAM_DIST(size.width, size.height)
    const visibleH = size.height / dist
    const camY = -25 / dist
    ;(camera as THREE.PerspectiveCamera).position.set(0, camY, visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(12.5))))
    camera.updateProjectionMatrix()
    const readerBottom = PASS.readerY - Wg / 2
    const px = size.height / 2 - (readerBottom - camY) * dist
    document.documentElement.style.setProperty('--reader-bottom-px', `${px}px`)
  }, [camera, size.width, size.height])

  const setModeBoth = useCallback((m: Mode) => {
    mode.current = m
    setMode(m)
  }, [])

  const respawn = useCallback(() => {
    window.clearTimeout(respawnTimer.current)
    fade.current = 0
    setStatus('idle')
    respawnTimer.current = window.setTimeout(() => {
      pos.current.set(0, PASS.hoverY, 0)
      vel.current.set(0, 0, 0)
      angVel.current.set(0, 0, 0)
      rotZ.current = 0
      rotX.current = 0
      setModeBoth('hover')
    }, PASS.respawnMs)
  }, [setStatus, setModeBoth])

  const grant = useCallback(() => {
    if (granted.current) return
    granted.current = true
    window.clearTimeout(respawnTimer.current)
    playCue('sparkle')
    setStatus('granted')
    window.setTimeout(onGranted, 1000)
  }, [onGranted, setStatus])

  useEffect(() => {
    document.body.style.cursor = modeState === 'drag' ? 'grabbing' : modeState === 'hover' ? 'grab' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [modeState])

  useEffect(() => () => window.clearTimeout(respawnTimer.current), [])

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    unlockAudio()
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    window.clearTimeout(respawnTimer.current)
    grab.current.copy(e.point).sub(pos.current)
    prevX.current = pos.current.x
    prevY.current = pos.current.y
    span.current = Math.abs(pos.current.y - jI / 2 - PASS.slotY) < PASS.slotTol ? { min: pos.current.x, max: pos.current.x } : null
    setModeBoth('drag')
  }

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    try {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (granted.current) {
      if (Math.abs(pos.current.y - jI / 2 - PASS.slotY) < PASS.slotTol) {
        pos.current.y = PASS.slotY + jI / 2
        rotX.current = hB
        rotZ.current = 0
        setModeBoth('placed')
      }
      return
    }
    const inSlot = Math.abs(pos.current.y - jI / 2 - PASS.slotY) < PASS.slotTol
    if (!span.current && inSlot) span.current = { min: pos.current.x, max: pos.current.x }
    if (span.current && inSlot && Math.max(span.current.max, pos.current.x) - Math.min(span.current.min, pos.current.x) > PASS.traverseSpan) {
      grant()
      return
    }
    span.current = null
    if (inSlot) {
      // Inserted: the pass must stay put in the reader (no gravity, upright).
      vel.current.set(0, 0, 0)
      angVel.current.set(0, 0, 0)
      pos.current.y = PASS.slotY + jI / 2
      pos.current.z = A0(pos.current.y)
      rotX.current = hB
      rotZ.current = 0
      rot.current.set(hB, 0, 0)
      playCue('press')
      setStatus((s) => (s === 'granted' || s === 'error' ? s : 'idle'))
      setModeBoth('placed')
    } else {
      setModeBoth('fall')
      playCue('error')
      angVel.current.set(0.9, 0.5, (Math.random() - 0.5) * 1.4)
      vel.current.set(-rotZ.current * 1.6, 0.3, 0)
      setStatus((s) => (s === 'granted' ? s : 'error'))
      window.clearTimeout(respawnTimer.current)
      respawnTimer.current = window.setTimeout(() => {
        setStatus((s) => (s === 'error' ? 'idle' : s))
        respawn()
      }, 1800)
    }
  }

  const tmp = useMemo(() => ({
    v: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    q: new THREE.Vector3(),
  }), [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05) || 0.016
    const t = state.clock.elapsedTime
    const m = mode.current

    if (m === 'hover' || m === 'drag') {
      if (fade.current < 1) fade.current = Math.min(1, fade.current + delta / PASS.fadeInS)
    }
    const fadeNow = granted.current ? 1 : fade.current
    mats.forEach((mat) => {
      mat.opacity = fadeNow
    })

    if (m === 'hover') {
      pos.current.set(Math.sin(t * 0.5) * 0.05, PASS.hoverY + Math.sin(t * 1.2) * 0.1, 0)
      rotX.current = Math.sin(t * 0.7) * 0.09
      rot.current.set(Math.sin(t * 0.7) * 0.09, Math.sin(t * 0.4) * 0.06, Math.sin(t * 0.9) * 0.08)
    } else if (m === 'drag') {
      tmp.v.set(state.pointer.x, state.pointer.y, 0.5).unproject(camera)
      tmp.dir.copy(tmp.v).sub(camera.position).normalize()
      tmp.q.copy(tmp.v).add(tmp.dir.multiplyScalar(-camera.position.z / tmp.dir.z))
      const cos = Math.cos(rotZ.current)
      const sin = Math.sin(rotZ.current)
      let x = tmp.q.x - (grab.current.x * cos - grab.current.y * sin)
      let y = tmp.q.y - (grab.current.x * sin + grab.current.y * cos)
      let inSlot = false
      if (Math.abs(x) < PC && y < xg) {
        if (prevY.current >= xg - 0.12) {
          y = xg
          inSlot = true
        } else {
          x = Math.sign(x || 1) * Math.max(Math.abs(x), PC)
        }
      }
      prevY.current = y
      const dx = x - prevX.current
      prevX.current = x
      const targetSlant = inSlot
        ? THREE.MathUtils.clamp(
            ((-dx / dt) * 0.024 + rotZ.current * 0.28) as number,
            -0.5,
            0.5,
          )
        : 0
      const targetTilt = inSlot ? hB : 0
      rotZ.current += (THREE.MathUtils.clamp(x * 0.28, -0.35, 0.35) + THREE.MathUtils.clamp(-dx * 4, -0.3, 0.3) - rotZ.current) * Math.min(1, dt * 4.5)
      rotX.current += (targetTilt - rotX.current) * Math.min(1, dt * 10)
      pos.current.set(x, y, inSlot ? A0(y) : pos.current.z)
      rot.current.set(rotX.current, 0, rotZ.current)

      if (!granted.current) {
        const inZone = Math.abs(y - jI / 2 - PASS.slotY) < PASS.slotTol
        if (inZone && !wasInZone.current) playCue('press')
        wasInZone.current = inZone
        setStatus((s) => (s === 'granted' ? s : inZone ? 'near' : s === 'error' ? s : 'idle'))
        if (inZone) {
          if (!span.current) span.current = { min: x, max: x }
          span.current.min = Math.min(span.current.min, x)
          span.current.max = Math.max(span.current.max, x)
          if (span.current.max - span.current.min > PASS.traverseSpan) {
            grant()
          }
        } else {
          span.current = null
          setStatus((s) => (s === 'granted' || s === 'error' ? s : 'idle'))
        }
      }
      // keep targetSlant referenced
      void targetSlant
    } else if (m === 'fall') {
      vel.current.y -= 18 * 0.8 * dt
      pos.current.addScaledVector(vel.current, dt)
      rot.current.x += angVel.current.x * dt
      rot.current.y += angVel.current.y * dt
      rot.current.z += angVel.current.z * dt
    } else if (m === 'placed') {
      pos.current.set(0, PASS.slotY + jI / 2, A0(PASS.slotY + jI / 2))
      rot.current.set(hB, 0, 0)
    }

    g.position.copy(pos.current)
    g.rotation.copy(rot.current)

    // contact shadow uniforms
    contact.current = {
      x: pos.current.x,
      lift: THREE.MathUtils.clamp((pos.current.y - jI / 2 - PASS.slotY) / 1.7, 0, 1),
      fade: fadeNow,
    }

    // curvature follows vertical velocity
    const s = sway.current
    const vy = (pos.current.y - s.y) / dt
    const vx = (pos.current.x - s.x) / dt
    s.y = pos.current.y
    s.x = pos.current.x
    const curveTarget = 0.16 + THREE.MathUtils.clamp(((vy - s.vy) / dt) * 0.024, -0.6, 0.6)
    const slantTarget = THREE.MathUtils.clamp(-((vx - s.vx) / dt) * 0.024, -0.5, 0.5)
    s.vy = vy
    s.vx = vx
    s.curveV += ((curveTarget - s.curve) * 120 - s.curveV * 13) * dt
    s.curve += s.curveV * dt
    s.slantV += ((slantTarget - s.slant) * 120 - s.slantV * 13) * dt
    s.slant += s.slantV * dt
    const ease = THREE.MathUtils.smoothstep(pos.current.y, 0.25, 0.6)
    uniforms.uCurve.value = s.curve * ease
    uniforms.uSlant.value = s.slant * ease
  })

  return (
    <group
      ref={group}
      position={[0, PASS.hoverY, 0]}
      onPointerOver={() => {
        if (mode.current === 'hover') setModeBoth('hover')
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <mesh geometry={cardGeo} material={mats[0]} position={[0, 0, $B / 2]} renderOrder={-2} castShadow />
      <mesh geometry={cardGeo} material={mats[1]} position={[0, 0, -$B / 2]} renderOrder={-2} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */
function CameraFit() {
  const { size, camera } = useThree()
  useEffect(() => {
    const dist = CAM_DIST(size.width, size.height)
    const visibleH = size.height / dist
    const camY = -25 / dist
    ;(camera as THREE.PerspectiveCamera).position.set(0, camY, visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(12.5))))
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return null
}

function AreaLight() {
  const ref = useRef<THREE.RectAreaLight>(null)
  useEffect(() => {
    ref.current?.lookAt(0, -0.4, 0)
  }, [])
  return <rectAreaLight ref={ref} position={[0, 4.2, 3]} width={7} height={4} intensity={1.7} color="#fffdf7" />
}

export default function AccessPass({
  onGranted,
  onSkip,
}: {
  onGranted: () => void
  onSkip: () => void
}) {
  const [status, setStatus] = useState<Status>('idle')
  const contact = useRef({ x: 0, lift: 1, fade: 0 })
  const timers = useRef<number[]>([])
  const grantedRef = useRef(false)

  useEffect(() => {
    RectAreaLightUniformsLib.init()
  }, [])

  const grant = useCallback(() => {
    if (grantedRef.current) return
    grantedRef.current = true
    setStatus('granted')
    const t = window.setTimeout(onGranted, 1000)
    timers.current.push(t)
  }, [onGranted])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  return (
    <div className="pass-stage" style={{ background: '#faf5f5' }}>
      <div className="pass-canvas">
        <Canvas
          shadows="soft"
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 13], fov: 25 }}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        >
          <CameraFit />
          <ambientLight intensity={0.72} />
          <directionalLight
            position={[4, 6, 6]}
            intensity={1.55}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
            shadow-normalBias={0.045}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-3.4}
            shadow-camera-right={3.4}
            shadow-camera-top={3.4}
            shadow-camera-bottom={-3.4}
          />
          <AreaLight />
          <Suspense fallback={null}>
            <BoardingPass setStatus={setStatus} onGranted={grant} contact={contact} />
            <Reader status={status} contact={contact} />
          </Suspense>
          <color attach="background" args={['#faf5f5']} />
          <EffectComposer multisampling={4}>
            <Bloom intensity={0.15} luminanceThreshold={1} luminanceSmoothing={0.05} mipmapBlur />
          </EffectComposer>
          <Environment resolution={128}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer intensity={1.4} position={[0, 3, 6]} scale={[8, 3, 1]} />
              <Lightformer intensity={1} position={[-6, 0, 4]} rotation={[0, Math.PI / 6, 0]} scale={[6, 3, 1]} />
              <Lightformer intensity={1} position={[6, 2, 4]} rotation={[0, -Math.PI / 6, 0]} scale={[6, 3, 1]} />
            </group>
          </Environment>
        </Canvas>
      </div>
      <p className={`pass-hint${status === 'granted' ? '' : ' shimmer'}`} aria-hidden="true">
        {status === 'granted' ? 'Accès autorisé' : 'Glissez le pass pour entrer'}
      </p>
      <button className="skip-link" onClick={onSkip}>
        Passer
      </button>
      <div className={`pass-fade${status === 'granted' ? ' on' : ''}`} />
      <span className="sr-only" aria-live="polite">
        {status === 'granted' ? 'Accès autorisé' : status === 'near' ? 'Lecture du pass' : status === 'error' ? 'Lecture du pass impossible' : ''}
      </span>
    </div>
  )
}
