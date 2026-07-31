# Hero: Ambient Boats + Breathing Zoom After Video Ends — Design

**Date:** 2026-07-31
**Status:** Approved

## Goal

Once the hero video finishes playing and freezes on its last frame, add subtle ambient motion so the background doesn't feel fully static: a gentle "breathing" zoom on the frame itself, plus small boat silhouettes drifting across the water.

Purely decorative — no new state in the RSVP flow, no interaction, no effect on any module/wizard logic.

## Current state

- `components/Hero.tsx` — a `<video autoPlay muted playsInline>` with no `loop` attribute, so it plays once and (per its own test) stays paused on the last frame with no other behavior. No `onEnded` handling exists today.
- `public/santorini-og-frame.jpg` (1920×1080) is a still frame extracted from this same video, used for the OG share image (`app/opengraph-image.tsx`). Verified via direct pixel sampling (Python/PIL) that its water regions match the colors `#05263B` (dark caldera basin) and `#C0DDE7` (lighter outer water ring).
- The video renders `fixed inset-0 h-full w-full object-cover` — it crops to fill the viewport at any aspect ratio, cropping differently on a tall phone vs. a wide desktop.

## Approved visual design

Chosen and refined live in the browser-based brainstorming companion, using real CSS animations over the actual still frame:

1. **Breathing zoom** — the whole frame slowly pulses scale 1 → ~1.035 → 1 on an ease-in-out loop (~12s cycle). Applied to the shared `.hero-stage-surface` wrapper (video + boats together) once the video ends, so the boats scale in lockstep with the water instead of drifting out of sync with it.
2. **Four boats**, using the client's four provided Noun Project SVGs (`noun-boat-175154.svg`, `noun-boat-4551761.svg`, `noun-boat-8350556.svg`, `noun-boat-8419088.svg`), all rendered in a single cream color (`#DED5BD`) with a soft drop-shadow for contrast against the water.
3. Each boat follows a **4-waypoint zigzag** within a pixel-verified water-only "pocket" — it drifts to a waypoint, pauses briefly (as if idling), then heads off at a different angle, rather than simply reversing on one line. `scaleX(-1)` flips the boat to face its direction of travel at each turn.
4. Boats never cross land: every waypoint and the straight line between consecutive waypoints was confirmed, via row-by-row pixel sampling of `santorini-og-frame.jpg`, to stay within a contiguous water-colored region for its full vertical span.

### Verified safe water pockets (percentages of the 1920×1080 frame)

Derived by sampling the JPG's pixel colors row-by-row and finding the widest contiguous water-colored run per row (see the brainstorming session's Python scan for methodology — this is not eyeballed).

| Boat | SVG | Pocket (x range, y range) | Notes |
|---|---|---|---|
| 1 | `noun-boat-175154.svg` | x 37–49%, y 59–68% | Caldera basin, lower-wide area, below the small central island |
| 4 | `noun-boat-8419088.svg` | x 38–48%, y 61–67% | Same general pocket as Boat 1, offset sub-area + different phase/timing so they don't sync or collide |
| 2 | `noun-boat-4551761.svg` | x 39–50%, y 24–34% | Caldera basin, upper area, above the small central island, below the northern peninsula's dip |
| 3 | `noun-boat-8350556.svg` | x 33–37%, y 55–56.5% | Caldera basin, middle band between the boat-1/4 pocket (below) and the boat-2 pocket (above) — relocated here from the original outer light-ring channel, which turned out to have near-zero contrast for a cream boat and was cropped off-screen on portrait viewports |

### Timing (final, after iteration)

- Breathing zoom: 12s ease-in-out, infinite.
- Boat 1: 41s per full 4-waypoint loop.
- Boat 4: 44s, 5s animation-delay (offset from Boat 1).
- Boat 2: 40s.
- Boat 3: 35s.
- All use a "hold at waypoint, then move to next" keyframe pattern (holds at 0%/10%, 25%/35%, 50%/60%, 75%/85%, loop closes at 100%) so boats visibly pause before changing direction rather than moving continuously.
- Boat sizes: Boat 1 = 26px, Boat 4 = 24px, Boat 2 = 20px, Boat 3 = 24px (bumped up from an initial 16px for visibility in its narrower pocket) — all as rendered at the frame's native 1920×1080 scale to the viewport.

## Cross-viewport alignment (the one real technical risk)

`object-fit: cover` crops the video differently depending on viewport aspect ratio. If boats are positioned via simple percentage of the raw viewport, they will NOT stay aligned with the water at every screen size, because a naive percentage overlay doesn't crop the same way `object-fit: cover` does.

**Fix:** both the video and the boat-overlay must share one "stage" element that always maintains the source's 16:9 aspect ratio while covering the viewport — the classic CSS "cover" sizing trick applied to a container, not just the video:

```css
.hero-stage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 56.25vw;       /* 100vw / (16/9) */
  min-height: 100vh;
  min-width: 177.78vh;   /* 100vh * (16/9) */
}
```

The video (now sized to fill `.hero-stage` at 100%/100%, no longer needing its own `object-fit: cover`) and the boat-overlay (each boat positioned with simple `left`/`top` percentages) both live inside `.hero-stage`, so they crop together identically on any screen size. This replaces the video's current standalone `fixed inset-0 h-full w-full object-cover` positioning.

**Scope decision:** boats show on all breakpoints, including mobile. On a very narrow/tall phone, the far-left boat (Boat 3, near the edge of the frame) may sometimes crop out of view — this is an accepted, pre-existing characteristic of covering a 16:9 image on a narrow screen (the same edges are already cropped from the video today), not a new problem introduced by this feature.

## Behavior

- On mount, the hero renders exactly as it does today: video autoplays, muted, no loop, no overlay.
- On the video's `onEnded` event: set `ended = true`. The breathing-zoom class is added to the frozen video, and the boat-overlay (initially `opacity: 0`) fades in over ~1s (a simple CSS transition) rather than popping in abruptly.
- If the user has `prefers-reduced-motion: reduce` set, none of this activates — no breathing zoom, no boats. The video still plays once and freezes on its last frame exactly as it does today; it just stays fully static afterward. Detected via a `(prefers-reduced-motion: reduce)` media query, not a JS user-agent check.

## Code structure

- `components/Hero.tsx` — modified: adds the `.hero-stage` wrapper, `onEnded` handler + `ended` state, conditionally renders the boat-overlay, applies the breathing-zoom class to the video once ended.
- A new `components/HeroBoats.tsx` — the boat-overlay itself: renders the four inlined SVGs (as React components, not `<img>`, so their fill color is controlled via CSS) positioned absolutely within `.hero-stage`, each with its own CSS animation.
- `app/globals.css` — new keyframes: `hero-breathe`, and one zigzag keyframe per boat (`boat-1-drift`, `boat-4-drift`, `boat-2-drift`, `boat-3-drift`), plus the `.hero-stage` sizing rule and a `@media (prefers-reduced-motion: reduce)` block that disables all of the above.
- The four SVG files (currently on the user's Desktop) get copied into the repo, e.g. `components/boat-svgs/` or inlined directly as JSX path data inside `HeroBoats.tsx` (implementation plan decides which — likely inlining, since these are simple single/multi-path icons with no need for separate asset files or `next/image`).

## Testing

- `components/Hero.test.tsx` — extend: firing a video `ended` event adds the breathing-zoom class / triggers the boat-overlay to render (jsdom doesn't actually animate CSS, so tests assert class names / presence of the overlay markup, not visual motion).
- `components/HeroBoats.test.tsx` — new: renders all four boats; each has the expected CSS animation class; nothing crashes with no props (this component takes none — it's pure decoration).
- No test attempts to verify pixel-level "boats stay on water" — that was established via the one-time Python pixel-sampling analysis in this design doc, not something to re-verify per test run. If the hero video/still-frame ever changes, the safe pockets in this doc would need to be re-derived the same way.

## Out of scope (YAGNI)

- No interactivity on the boats (no click/hover effects).
- No difference in boat behavior/count between mobile and desktop beyond the shared-stage alignment fix.
- No attempt to sync boat positions to the actual video's very last rendered frame pixel-for-pixel beyond using the existing `santorini-og-frame.jpg` as the reference (if that JPG isn't exactly the last frame, a quick visual check during implementation should confirm boats still read as "on the water," not a re-derivation of every pocket).
