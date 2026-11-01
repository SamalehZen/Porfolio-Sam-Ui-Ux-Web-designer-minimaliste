# Architecture

## Rendering model

A single React tree composed at `src/app/App.tsx`. The app runs a small phase
machine:

    splash  ->  gate  ->  site

- `splash` shows the boot screen and preloads typefaces plus the first paint
  assets. The document is locked (`html.is-covered`) while it is up.
- `gate` mounts the boarding-pass scene. It is skipped for reduced-motion or
  non-WebGL environments, in which case the phase machine goes straight to
  `site`.
- `site` is the folio itself: window, timeline, outro, footer.

Everything is client-side. There are no routes and no server logic; the page
is one document with progressive enhancement.

## State ownership

| Concern | Owner | Notes |
| --- | --- | --- |
| Phase, theme, gate availability | `app/App.tsx` | writes `data-theme` and `localStorage` |
| Shade position, spring | `components/cabin/PlaneWindow.tsx` | reports shade to the app, which drives the theme |
| Scroll progress, path lighting | `components/timeline/FlightPath.tsx` | reads scroll, writes CSS custom properties |
| Notch open/closed, clock | `components/notch/Notch.tsx` | self-contained, closes on outside pointer |
| Gate status (idle/near/error/granted) | `components/boarding-pass/AccessPass.tsx` | owns the three.js scene |

No global store: each feature owns its state and communicates through props or
CSS custom properties.

## Styling strategy

- Tailwind provides spacing, layout and typography utilities, with the theme
  filled from measured values (`tailwind.config.js`).
- `styles/folio.css` holds the measured rules that utilities cannot express:
  masks, layered shadows, the flight-path rails, the footer blur stack.
- Dynamic values (spring progress, path progress) travel as CSS custom
  properties (`--p`, `--sh`, `--curve-p`, `--rail-p`), so animation never
  re-renders React.

## Animation strategy

| Technique | Used for | Why |
| --- | --- | --- |
| CSS keyframes | reveals, splash, tooltips | declarative, zero JS |
| `requestAnimationFrame` springs | shade, notch | frame-accurate, no state churn |
| Web Animations / three.js | boarding-pass morph | continuous 3D simulation |
| SVG dash + CSS variables | flight path | resolution independent |

The spring integrator is shared (`components/notch`, `components/cabin`) with
the stiffness/damping constants documented next to their use.

## 3D

Two independent `@react-three/fiber` canvases:

1. **Cabin** (`components/cabin/PlaneWindowScene.tsx`) - a water shader plus a
   `drei` cloud field, paused when the shade is closed or while booting.
2. **Gate** (`components/boarding-pass/AccessPass.tsx`) - card, reader,
   lighting, bloom. The card is driven by a hand-written integrator instead of
   a physics engine to keep the bundle small and deterministic.

Both are lazy in practice (they only mount when their phase is reached) and
fall back to static artwork when WebGL is unavailable.

## Build and delivery

    ui/          Vite base '/ok/'  ->  component.hypeer.cloud/ok/
    ui/ (BASE=/) Vite base '/'     ->  hypeer.cloud/

`public/` is copied verbatim, which is how the Fan Carousel demo keeps its own
`app.js` / `app.css` outside the React bundle.
