import { useRef } from 'react'
import FlightPath from '@/components/timeline/FlightPath'
import Footer from '@/components/layout/Footer'
import FooterFx from '@/components/layout/FooterFx'
import Memories from '@/components/memories/Memories'
import PlaneWindow from '@/components/cabin/PlaneWindow'
import Timeline from '@/components/timeline/Timeline'
import { useClock } from '@/hooks/useClock'
import { useCountUp } from '@/hooks/useCountUp'

function FlightPlan() {
  return (
    <div className="plan-head reveal" aria-hidden="true">
      <span className="plan-label">Plan de vol</span>
      <svg className="plan-plane" viewBox="0 0 16 15" fill="none" aria-hidden="true">
        <path
          d="M8 0c.73 0 1.32 1.05 1.32 2.35v2.2l6.13 3.54c.25.14.4.4.4.69v1.1a.44.44 0 0 1-.56.42L9.32 8.5v3.06l1.9 1.33c.15.11.24.28.24.47v.79a.44.44 0 0 1-.56.42L8 13.79l-2.9.78a.44.44 0 0 1-.56-.42v-.79c0-.19.09-.36.24-.47l1.9-1.33V8.5L.71 10.3a.44.44 0 0 1-.56-.42v-1.1c0-.29.15-.55.4-.69l6.13-3.54v-2.2C6.68 1.05 7.27 0 8 0Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export default function Folio({
  booting,
  inert,
  onShadeChange,
  initialShade,
  onReset,
  mainRef,
}: {
  booting: boolean
  inert: boolean
  onShadeChange: (v: number, settled: boolean) => void
  initialShade: number
  onReset?: () => void
  mainRef: React.RefObject<HTMLElement | null>
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  const { lat, lng, zone } = useClock()
  const latText = useCountUp(lat, !booting)
  const lngText = useCountUp(lng, !booting)

  return (
    <main
      className={`folio${booting ? ' booting' : ''}`}
      ref={mainRef}
      aria-hidden={inert || undefined}
      inert={inert ? true : undefined}
    >
      <aside className="folio-sticky">
        <span className="fs-rail" aria-hidden="true" />
        <div className="fs-lines">
          <p className="fs-brand">Oxira</p>
          <p className="fs-name">Samaleh Mohamed Hassan Arka</p>
          <p>Djibouti</p>
          <p aria-hidden="true">
            {latText}° N, {lngText}° E
          </p>
          <p className="sr-only">11.5721° north, 43.1456° east</p>
          <p>{zone}</p>
        </div>
      </aside>

      <div className="folio-col">
        <div className="folio-window reveal">
          <PlaneWindow paused={booting} initialShade={initialShade} onShadeChange={onShadeChange} />
        </div>

        <div className="folio-intro reveal">
          <p className="folio-tagline">Designer UI/UX &amp; Développeur créatif</p>
          <p className="folio-sub">
            Je conçois des interfaces depuis 8 ans avec une rigueur d’ingénieur, obsédé par les détails et le pourquoi derrière chaque produit.
          </p>
        </div>

        <div className="folio-track" ref={trackRef}>
          <FlightPlan />
          <FlightPath trackRef={trackRef} tailRef={tailRef} />
          <Timeline />
          <div className="folio-outro reveal">
            <div className="outro-text" ref={tailRef}>
              <p className="outro-title">Merci d’avoir voyagé. À très bientôt.</p>
              <p className="outro-sub">Quelques souvenirs entre le décollage et l’atterrissage.</p>
            </div>
            <Memories />
          </div>
        </div>
      </div>

      <FooterFx />
      <Footer onReset={onReset} />
    </main>
  )
}
