# Feature Plan: Animated Handwriting Background Component

**Type:** `feature`
**Branch:** `feature/handwriting-background`
**Project:** YLS (Your Letter Service) — Next.js 15, React 18, TypeScript, Tailwind CSS v3, Supabase
**Prepared:** 2026-03-21
**Status:** Ready to implement

---

## 1. Overview & Goal

Build an animated background component for the YLS website that displays flowing cursive handwriting text fragments (real estate letter phrases) appearing and fading at random positions across the screen. The visitor can also interact by drawing their own ink strokes with the mouse.

This reinforces the core YLS brand identity: personal, handwritten direct-mail letters to property owners.

---

## 2. Visual Specification

### Behavior
- Multiple cursive text fragments appear simultaneously at random screen positions
- Each fragment is animated **stroke by stroke** (like a pen writing it in real time)
- After completing, each fragment **fades out smoothly**
- New fragments immediately begin writing elsewhere — **continuous, looping, never stops**
- Fragments vary in size and slight rotation for a natural scattered-letter feel
- **Mouse interaction:** When the visitor moves the mouse, they leave soft ink trails on the background (as if writing themselves)

### Style
- **Mood:** Light, minimal — faint ink on a light background
- **Visibility:** Clearly legible to the visitor, but clearly a background (does not compete with foreground UI)
- **Ink color:** Soft navy or warm charcoal (e.g., `rgba(30, 58, 138, 0.18)` or `rgba(60, 40, 20, 0.15)`) — adjust to match brand
- **Font:** Vara.js built-in cursive font (Pacifico-based, most natural-looking option)
- **Fragments:** Staggered — 3–5 fragments visible on screen at any given time

### Text Fragments (initial set — add more as needed)
```
"Dear Joe,"
"I want to buy your house"
"If you'd like to sell your property"
"We pay cash for homes"
"No repairs needed"
"Close on your timeline"
"Your neighbor recently sold"
"I noticed your property at"
"Please give me a call"
"Sincerely,"
"We make fair cash offers"
"No agents, no fees"
"Any condition, any situation"
"I've been looking in your neighborhood"
"This offer won't expire"
```

> **Action:** When implementing, import the full fragment list from a config file so the client can easily update copy without touching component code.

---

## 3. Project Context

### Existing File to Check First
```
components/ambient-background.tsx
```
⚠️ **IMPORTANT:** Before building, read this file. It may already implement background animation. The new component should either:
- **Replace it** if it's a placeholder or unrelated effect, OR
- **Coexist alongside it** if it serves a different purpose (e.g., color/gradient ambient glow)

Do NOT delete it — move to `archive/` if replacing.

### Where This Component Will Be Used
The handwriting background should appear on **public-facing pages** only:
- `app/page.tsx` — Main landing page (primary target)
- `app/login/page.tsx` — Login page (optional, lighter opacity)
- `app/register/page.tsx` — Register/signup page (optional)

It should **NOT** appear inside the authenticated dashboard area.

### Stack Notes
- **Next.js 15** (App Router) — use `'use client'` directive since this is canvas-based
- **TypeScript strict mode** — all types must be explicit, no `any`
- **Tailwind CSS v3** — use for positioning/z-index utilities only; animation is JS-driven
- **No SSR** — canvas components cannot SSR; use dynamic import with `ssr: false`

---

## 4. Libraries to Install

### Primary: Vara.js
**Purpose:** Stroke-by-stroke cursive handwriting text animation

```bash
npm install vara
```

- GitHub: https://github.com/akzhy/Vara
- Docs: https://vara.js.org
- License: MIT
- Works by loading a JSON font file and animating SVG paths letter by letter
- Supports: font size, stroke width, stroke color, animation duration, delay between letters, text alignment
- React usage: initialize inside `useEffect` after mount

**Font file needed:**
Vara uses a custom JSON font. The default font (`Pacifico`) is fetched from a CDN URL or can be self-hosted. For production:
1. Download `Pacifico.json` from the Vara.js GitHub repository (`/fonts/` folder)
2. Place in `public/fonts/Pacifico.json`
3. Reference as `/fonts/Pacifico.json` (local, no CDN dependency)

### Secondary: Atrament
**Purpose:** Natural ink drawing on canvas for mouse interaction

```bash
npm install atrament
```

- GitHub: https://github.com/jakubfiala/atrament
- NPM: https://www.npmjs.com/package/atrament
- License: MIT
- Named after Slovak/Polish word for "ink"
- Draws directly onto an HTML canvas bitmap — feels like real ink pen on paper
- Handles: mouse events, touch events, pressure-sensitive tablets
- Key settings: `weight` (stroke width), `opacity`, `smoothing`, `color`, `mode`

---

## 5. Architecture

### Component Structure

```
components/
  handwriting-background/
    HandwritingBackground.tsx     ← Main component (use client)
    HandwritingBackground.types.ts ← TypeScript interfaces
    fragments.ts                  ← Text fragments config array
    useHandwritingLoop.ts         ← Custom hook: Vara.js animation loop
    useAtramentCanvas.ts          ← Custom hook: Atrament mouse ink
```

### Two-Layer Canvas Approach

```
┌─────────────────────────────────────────────────┐
│  Layer 2 (top): Atrament Canvas                 │
│  z-index: 1 | pointer-events: auto              │
│  Captures mouse — visitor draws ink trails      │
├─────────────────────────────────────────────────┤
│  Layer 1 (bottom): Vara.js SVG Container        │
│  z-index: 0 | pointer-events: none              │
│  Animated cursive text fragments                │
└─────────────────────────────────────────────────┘
     Both layers: position: fixed, inset: 0
     Parent wrapper: z-index behind page content
```

### Fragment Lifecycle (per fragment)
```
1. Pick random text from fragments array (avoid repeating last 3)
2. Pick random x/y position (with edge padding, e.g., 5%–85% of viewport)
3. Pick random font size (18px–36px) and slight rotation (-8deg to +8deg)
4. Initialize Vara instance on a temp SVG node at that position
5. Animate: Vara writes the text stroke by stroke
6. On complete: CSS transition fades the SVG node opacity 1 → 0 over 2s
7. On fade complete: remove SVG node, schedule next fragment (50–200ms delay)
8. Maintain 3–5 concurrent fragments at all times
```

---

## 6. Implementation Phases

### Phase 1 — Project Setup & Font Hosting
**Goal:** Install libraries, host font locally, verify no conflicts with existing `ambient-background.tsx`

Steps:
1. Read `components/ambient-background.tsx` — document what it does
2. Run `npm install vara atrament`
3. Download Vara Pacifico font JSON:
   - URL: `https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Pacifico/PacificoSILOFL.json`
   - Save to: `public/fonts/Pacifico.json`
4. Create folder `components/handwriting-background/`
5. Create `fragments.ts` with initial text fragment array (typed as `string[]`)
6. Verify TypeScript types exist for both libraries:
   - Vara: types may need to be declared manually in a `.d.ts` file if not bundled
   - Atrament: has its own TypeScript declarations

**Checkpoint:** `npm run typecheck:ui` passes, font file accessible at `/fonts/Pacifico.json`

---

### Phase 2 — Vara.js Animation Loop (Text Writing)
**Goal:** Build the handwriting text animation layer

Steps:
1. Create `HandwritingBackground.types.ts`:
   ```ts
   export interface FragmentInstance {
     id: string
     text: string
     x: number
     y: number
     fontSize: number
     rotation: number
     opacity: number
     state: 'writing' | 'fading' | 'done'
   }
   ```

2. Create `useHandwritingLoop.ts` custom hook:
   - Manages array of active `FragmentInstance` objects in `useRef` (not state, to avoid rerenders)
   - `spawnFragment()`: picks random text/position/size, creates a `<div>` node, initializes `new Vara(container, fontUrl, [{ text, fontSize, strokeWidth, color, duration }])`
   - Vara `ready` callback: starts fade-out CSS transition
   - Fragment cleanup: after fade transition ends, remove DOM node, call `spawnFragment()` again
   - On mount: spawn initial 3–5 fragments with staggered 400ms delays
   - On unmount: clean up all DOM nodes and cancel pending timers

3. Create `HandwritingBackground.tsx`:
   ```tsx
   'use client'
   // Fixed-position wrapper div (z-index: 0, pointer-events: none)
   // Passes containerRef to useHandwritingLoop
   // Renders Atrament canvas on top (Phase 3)
   ```

4. Test fragment spawning in isolation — verify:
   - Cursive text appears and animates correctly
   - Fade-out works
   - No memory leaks (fragments clean up)
   - No overlap with UI content (z-index correct)

**Checkpoint:** Open `app/page.tsx`, add `<HandwritingBackground />`, verify animation runs in browser (use Playwright to screenshot)

---

### Phase 3 — Atrament Mouse Ink Layer
**Goal:** Add visitor-interactive ink drawing on top

Steps:
1. Create `useAtramentCanvas.ts` custom hook:
   - Takes a `canvasRef: RefObject<HTMLCanvasElement>`
   - On mount:
     ```ts
     import Atrament from 'atrament'
     const atrament = new Atrament(canvas, {
       width: window.innerWidth,
       height: window.innerHeight,
       color: 'rgba(30, 58, 138, 0.25)',  // soft navy ink
       weight: 2,
       smoothing: 0.85,
       opacity: 0.8,
     })
     ```
   - Handle `resize`: update canvas dimensions on window resize
   - Optional: slowly fade old ink strokes over time (clear canvas with low-opacity fill on interval)
   - On unmount: remove event listeners, destroy Atrament instance

2. Add `<canvas>` element to `HandwritingBackground.tsx`:
   - `position: fixed`, `inset: 0`, `z-index: 1`
   - `pointer-events: auto` (captures mouse)
   - Pass ref to `useAtramentCanvas`

3. Add visual hint for first-time visitors (optional):
   - Small tooltip or cursor change (`cursor: crosshair`) indicating the background is interactive
   - Auto-dismisses after 5 seconds

**Checkpoint:** Visitor can draw ink strokes with mouse; Vara text still animates beneath; both layers coexist

---

### Phase 4 — Integration & Polish
**Goal:** Wire into actual pages, tune visual settings

Steps:
1. **Dynamic import** in `app/page.tsx` to prevent SSR errors:
   ```tsx
   import dynamic from 'next/dynamic'
   const HandwritingBackground = dynamic(
     () => import('@/components/handwriting-background/HandwritingBackground'),
     { ssr: false }
   )
   ```

2. **Z-index audit:** Ensure the background sits behind all page content:
   - Background wrapper: `z-index: 0`
   - Page content wrapper: `z-index: 10` or higher
   - Check `app/layout.tsx` for existing stacking contexts

3. **Performance tuning:**
   - Cap concurrent fragments at 5 maximum
   - Use `requestAnimationFrame` for any manual animation
   - Pause animation when tab is not visible (`document.addEventListener('visibilitychange', ...)`)
   - Reduce fragment count on mobile (max 2)

4. **Responsive behavior:**
   - On mobile: disable Atrament (touch conflicts with scroll) OR implement touch-only drawing mode
   - Reduce font size range on small screens (14px–22px)

5. **Accessibility:**
   - Add `aria-hidden="true"` to the entire background wrapper
   - Add `role="presentation"` to canvas elements
   - Ensure no keyboard focus lands on background elements

6. **Opacity / color refinement:**
   - Test in both light and dark contexts
   - Add a `variant` prop: `'light' | 'dark'` for flexible reuse
   - Default: `'light'` (faint ink on white/cream background)

**Checkpoint:** Run full browser test with Playwright. Screenshot landing page. Verify no console errors.

---

### Phase 5 — Cleanup & Config
**Goal:** Make the component easily maintainable by the client

Steps:
1. Extract all tunable values to a single `HANDWRITING_CONFIG` object at top of `HandwritingBackground.tsx` or in a separate `config.ts`:
   ```ts
   export const HANDWRITING_CONFIG = {
     maxConcurrentFragments: 5,
     minFontSize: 18,
     maxFontSize: 36,
     inkColor: 'rgba(30, 58, 138, 0.18)',
     mouseInkColor: 'rgba(30, 58, 138, 0.28)',
     fadeDuration: 2000,        // ms
     fragmentSpawnDelay: 150,   // ms between spawning new fragments
     animationDuration: 3000,   // ms for Vara to write each fragment
     mobileCap: 2,
   }
   ```

2. Document `fragments.ts` with a comment explaining how to add/edit phrases

3. Final `npm run typecheck:ui` — zero errors
4. Final `npm run lint` — zero warnings
5. Final `npm run build` — successful production build

---

## 7. Files to Create

| File | Purpose |
|------|---------|
| `components/handwriting-background/HandwritingBackground.tsx` | Main component |
| `components/handwriting-background/HandwritingBackground.types.ts` | TypeScript interfaces |
| `components/handwriting-background/fragments.ts` | Text fragment array |
| `components/handwriting-background/useHandwritingLoop.ts` | Vara.js animation hook |
| `components/handwriting-background/useAtramentCanvas.ts` | Atrament ink drawing hook |
| `public/fonts/Pacifico.json` | Self-hosted Vara font file |

## Files to Modify

| File | Change |
|------|--------|
| `app/page.tsx` | Add `<HandwritingBackground />` via dynamic import |
| `package.json` | Add `vara` and `atrament` dependencies |

## Files to Review Before Starting

| File | Reason |
|------|--------|
| `components/ambient-background.tsx` | May conflict or need to coexist — read before building |
| `app/layout.tsx` | Check z-index stacking context |
| `app/page.tsx` | Understand current page structure before adding component |
| `tailwind.config.ts` | Check if custom z-index scale is defined |

---

## 8. TypeScript Declarations (if needed)

Vara.js may not have bundled TypeScript types. If `import Vara from 'vara'` fails type-check, create:

```ts
// types/vara.d.ts
declare module 'vara' {
  interface VaraTextOptions {
    text: string
    fontSize?: number
    strokeWidth?: number
    color?: string
    duration?: number
    delay?: number
    x?: number
    y?: number
    textAlign?: 'left' | 'center' | 'right'
  }

  interface VaraOptions {
    fontSize?: number
    strokeWidth?: number
    color?: string
    duration?: number
    delay?: number
    textAlign?: 'left' | 'center' | 'right'
  }

  class Vara {
    constructor(
      container: string | HTMLElement,
      fontSource: string,
      texts: VaraTextOptions[],
      options?: VaraOptions
    )
    ready(callback: () => void): void
    animationEnd(callback: (i: number, o: object) => void): void
    get(index: number): SVGElement
    playAll(): void
    stopAll(): void
  }

  export default Vara
}
```

---

## 9. Potential Gotchas

| Issue | Solution |
|-------|---------|
| Vara requires DOM — fails on SSR | Use `dynamic(() => import(...), { ssr: false })` |
| Vara loads font from URL on each instance | Self-host font at `/fonts/Pacifico.json` and cache in module scope |
| Multiple Vara instances create memory leaks | Store instances in `useRef`, destroy on cleanup |
| Atrament touch events conflict with page scroll | Disable on mobile or add `touch-action: none` selectively |
| Canvas not resizing on window resize | Add `resize` event listener in `useAtramentCanvas`, update canvas dimensions |
| Fragment text renders off-screen | Clamp x/y to `5%–80%` of viewport width/height |
| Animation continues in background tabs | Listen to `visibilitychange` event, pause/resume loop |
| `ambient-background.tsx` conflict | Read file first — coordinate z-index and positioning |

---

## 10. Verification Checklist (run before closing branch)

- [ ] `npm run typecheck:ui` — zero errors
- [ ] `npm run lint` — zero warnings
- [ ] `npm run build` — successful
- [ ] Playwright screenshot: landing page shows handwriting animation
- [ ] Playwright: mouse drawing works (draw a stroke, verify ink appears)
- [ ] Playwright: no console errors
- [ ] Mobile viewport (375px): verify reduced fragment count, no layout break
- [ ] Verify `aria-hidden="true"` on background wrapper
- [ ] Verify background does not intercept clicks on foreground UI elements
- [ ] Verify animation pauses when tab is hidden, resumes when tab is visible
- [ ] Verify no memory leaks after 60 seconds (fragments clean up correctly)

---

## 11. Sources & References

### Libraries
- **Vara.js** — https://github.com/akzhy/Vara
- **Vara.js docs** — https://vara.js.org
- **Vara.js font files** — https://github.com/akzhy/Vara/tree/master/fonts
- **Vara.js React example** — https://dev.to/dminhvu/animated-handwriting-text-in-react-with-varajs-40p
- **Atrament** — https://github.com/jakubfiala/atrament
- **Atrament NPM** — https://www.npmjs.com/package/atrament
- **Atrament CSS Script overview** — https://www.cssscript.com/canvas-drawing-handwriting-atrament/

### Techniques & Background Research
- **SVG stroke-dashoffset handwriting technique** — https://css-tricks.com/how-to-get-handwriting-animation-with-irregular-svg-strokes/
- **Handwriting animation with SVG masking** — https://www.motiontricks.com/animated-handwriting-effect-part-1/
- **GSAP handwriting effect reference** — https://gsap.com/community/forums/topic/35840-animated-handwriting-effect-with-complicated-font-multiple-masks-and-open-paths/
- **signature-animation React component** — https://github.com/Ayo-Osota/signature-animation
- **Shader web background (alternative approach)** — https://xemantic.github.io/shader-web-background/
- **Codrops WebGL/canvas tutorials** — https://tympanus.net/codrops/tag/webgl/
- **FreeFrontend WebGL examples** — https://freefrontend.com/webgl/

### Next.js / React Integration
- **Next.js dynamic imports (ssr: false)** — https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- **useEffect cleanup patterns** — https://react.dev/reference/react/useEffect#usage
- **Canvas in React** — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

## 12. Git Workflow

Per project rules (CLAUDE.md Rule 8):

```
/git-workflow-planning:start feature handwriting-background
# ... implement phases 1–5 ...
/git-workflow-planning:checkpoint 1 project-setup-font-hosting
/git-workflow-planning:checkpoint 2 vara-animation-loop
/git-workflow-planning:checkpoint 3 atrament-mouse-ink
/git-workflow-planning:checkpoint 4 integration-polish
/git-workflow-planning:checkpoint 5 cleanup-config
/git-workflow-planning:finish
```
