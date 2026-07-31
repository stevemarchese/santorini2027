# Hero Boats + Breathing Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Once the hero video ends and freezes, add a subtle breathing zoom to the frame plus four small cream-colored boats that drift across the water in pixel-verified safe pockets, with everything disabled for `prefers-reduced-motion` users.

**Architecture:** A new standalone `components/HeroBoats.tsx` renders the four boat SVGs (inlined as JSX, following the existing `AboutIcon.tsx` pattern of a local glyph component with `fill="currentColor"`) positioned/animated purely via CSS classes in `app/globals.css`. `components/Hero.tsx` is restructured to wrap the video in a `.hero-stage`/`.hero-stage-surface` pair that keeps a fixed 16:9 aspect ratio while covering the viewport (so boat positions stay aligned with the water at any screen size), adds an `onEnded` handler, detects `prefers-reduced-motion` via `matchMedia` in an effect, and conditionally renders `<HeroBoats />` plus a breathing-zoom class on the video.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4 (arbitrary values + custom CSS in `globals.css` for keyframes, since Tailwind has no keyframe-authoring utility).

## Global Constraints

- Boats must stay within these pixel-verified water pockets (percentages of the 1920×1080 source frame) — never cross land:
  - Boat 1 (`noun-boat-175154.svg`): x 37–49%, y 59–68%.
  - Boat 4 (`noun-boat-8419088.svg`): x 38–48%, y 61–67%.
  - Boat 2 (`noun-boat-4551761.svg`): x 39–50%, y 24–34%.
  - Boat 3 (`noun-boat-8350556.svg`): x 21–27%, y 47–55%.
- All boats render in a single color: cream (`text-cream` / `#DED5BD` via `fill="currentColor"`).
- `prefers-reduced-motion: reduce` must fully disable both the breathing zoom and the boats overlay — detected via `window.matchMedia`, not CSS-only, so the boats never even mount for these users.
- The video's positioning changes from standalone `fixed inset-0 h-full w-full object-cover` to a shared `.hero-stage` (fixed, viewport-clipping) + `.hero-stage-surface` (always-16:9, covers viewport) pair, so the video and boat overlay share one coordinate system at every screen size.
- The existing `Hero.test.tsx` assertions (video has `autoplay`, `muted`, no `loop`) must keep passing unchanged.
- The boats overlay fades in over ~1s once it mounts, rather than appearing abruptly.

---

## File Structure

- `components/HeroBoats.tsx` — CREATE: four inlined boat SVGs, each in its own positioned/animated wrapper div.
- `components/HeroBoats.test.tsx` — CREATE: renders all four, checks positioning classes and that the overlay is decorative (`aria-hidden`, `pointer-events-none`).
- `app/globals.css` — MODIFY (both tasks): boat keyframes/positioning classes (Task 1), then hero-stage sizing + breathing-zoom keyframe (Task 2).
- `components/Hero.tsx` — MODIFY: `.hero-stage`/`.hero-stage-surface` wrapper, `onEnded` + `prefers-reduced-motion` state, conditional breathing-zoom class + `<HeroBoats />`.
- `components/Hero.test.tsx` — MODIFY: add `prefers-reduced-motion` mocking, assert breathing-zoom class and boats mount/don't-mount correctly.

---

## Task 1: `HeroBoats` component

**Files:**
- Create: `components/HeroBoats.tsx`
- Create: `components/HeroBoats.test.tsx`
- Modify: `app/globals.css` (append boat keyframes/classes — do not touch the existing `@theme`/`module-in`/`arrow-bob`/`blob-panel` rules)

**Interfaces:**
- Consumes: nothing (no props, purely decorative, self-contained).
- Produces: default-exported `HeroBoats` component, consumed by Task 2's `Hero.tsx` as `<HeroBoats />`. Relies on the CSS classes `.hero-boat`, `.hero-boat-1`, `.hero-boat-2`, `.hero-boat-3`, `.hero-boat-4`, and `.animate-hero-boats-fadein` — all defined in this task's `globals.css` changes.

- [ ] **Step 1: Write the failing test** — create `components/HeroBoats.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HeroBoats from './HeroBoats';

describe('HeroBoats', () => {
  it('renders all four boats with their positioning classes', () => {
    const { container } = render(<HeroBoats />);
    expect(container.querySelectorAll('svg')).toHaveLength(4);
    expect(container.querySelector('.hero-boat-1')).not.toBeNull();
    expect(container.querySelector('.hero-boat-2')).not.toBeNull();
    expect(container.querySelector('.hero-boat-3')).not.toBeNull();
    expect(container.querySelector('.hero-boat-4')).not.toBeNull();
  });

  it('is purely decorative and does not intercept clicks', () => {
    const { container } = render(<HeroBoats />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper.className).toContain('pointer-events-none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/HeroBoats.test.tsx`
Expected: FAIL — cannot resolve `./HeroBoats`.

- [ ] **Step 3: Append boat keyframes/classes to `app/globals.css`**

Append at the end of the existing file (after the `.blob-panel` rule):

```css
/* Hero ambient boats */
@keyframes hero-boats-fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-hero-boats-fadein {
  animation: hero-boats-fadein 1s ease-out forwards;
}

.hero-boat {
  position: absolute;
}

@keyframes hero-boat-1-drift {
  0%   { left: 49%; top: 60%; transform: scaleX(-1); }
  10%  { left: 49%; top: 60%; transform: scaleX(-1); }
  25%  { left: 38%; top: 67%; transform: scaleX(-1); }
  35%  { left: 38%; top: 67%; transform: scaleX(1); }
  50%  { left: 45%; top: 59%; transform: scaleX(1); }
  60%  { left: 45%; top: 59%; transform: scaleX(-1); }
  75%  { left: 37%; top: 64%; transform: scaleX(-1); }
  85%  { left: 37%; top: 64%; transform: scaleX(1); }
  100% { left: 49%; top: 60%; transform: scaleX(1); }
}

.hero-boat-1 {
  left: 49%;
  top: 60%;
  animation: hero-boat-1-drift 41s ease-in-out infinite;
}

@keyframes hero-boat-4-drift {
  0%   { left: 48%; top: 62%; transform: scaleX(1); }
  10%  { left: 48%; top: 62%; transform: scaleX(1); }
  25%  { left: 38%; top: 66%; transform: scaleX(1); }
  35%  { left: 38%; top: 66%; transform: scaleX(-1); }
  50%  { left: 44%; top: 61%; transform: scaleX(-1); }
  60%  { left: 44%; top: 61%; transform: scaleX(1); }
  75%  { left: 39%; top: 65%; transform: scaleX(1); }
  85%  { left: 39%; top: 65%; transform: scaleX(-1); }
  100% { left: 48%; top: 62%; transform: scaleX(-1); }
}

.hero-boat-4 {
  left: 48%;
  top: 62%;
  animation: hero-boat-4-drift 44s ease-in-out infinite;
  animation-delay: 5s;
}

@keyframes hero-boat-2-drift {
  0%   { left: 39%; top: 25%; transform: scaleX(1); }
  10%  { left: 39%; top: 25%; transform: scaleX(1); }
  25%  { left: 50%; top: 33%; transform: scaleX(1); }
  35%  { left: 50%; top: 33%; transform: scaleX(-1); }
  50%  { left: 41%; top: 27%; transform: scaleX(-1); }
  60%  { left: 41%; top: 27%; transform: scaleX(1); }
  75%  { left: 48%; top: 32%; transform: scaleX(1); }
  85%  { left: 48%; top: 32%; transform: scaleX(-1); }
  100% { left: 39%; top: 25%; transform: scaleX(-1); }
}

.hero-boat-2 {
  left: 39%;
  top: 25%;
  animation: hero-boat-2-drift 40s ease-in-out infinite;
}

@keyframes hero-boat-3-drift {
  0%   { left: 21%; top: 47%; }
  10%  { left: 21%; top: 47%; }
  25%  { left: 26%; top: 55%; }
  35%  { left: 26%; top: 55%; }
  50%  { left: 22%; top: 49%; }
  60%  { left: 22%; top: 49%; }
  75%  { left: 27%; top: 54%; }
  85%  { left: 27%; top: 54%; }
  100% { left: 21%; top: 47%; }
}

.hero-boat-3 {
  left: 21%;
  top: 47%;
  animation: hero-boat-3-drift 35s ease-in-out infinite;
}
```

- [ ] **Step 4: Write the implementation** — create `components/HeroBoats.tsx`

```tsx
function BoatOne() {
  return (
    <svg viewBox="0 0 1200 1200" fill="currentColor" aria-hidden="true">
      <path d="m902.5 537.5-122.5-167.5c-7.5-10-17.5-15-30-15h-410c-20 0-37.5 17.5-37.5 37.5s17.5 37.5 37.5 37.5h35c2.5 0 7.5 2.5 7.5 5l20 175c0 2.5-2.5 7.5-5 7.5-110 20-197.5 40-227.5 55-2.5 0-2.5 2.5-2.5 2.5l-72.5 115c0 2.5-2.5 2.5-5 2.5h-67.5c-5 0-7.5 5-5 10l17.5 40c0 2.5 2.5 5 5 5h947.5c2.5 0 2.5 0 5-2.5 20-25 202.5-232.5 195-297.5-2.5-25-122.5-22.5-277.5-5-2.5-2.5-5-2.5-7.5-5zm-95 15c-45 5-90 12.5-135 20-2.5 0-7.5-2.5-7.5-5l-17.5-127.5c0-5 2.5-7.5 7.5-7.5h72.5c2.5 0 5 0 5 2.5l80 107.5c2.5 2.5 0 7.5-5 10zm-342.5-122.5h100c2.5 0 7.5 2.5 7.5 5l20 140c0 2.5-2.5 7.5-5 7.5-35 5-67.5 12.5-100 17.5-5 0-7.5-2.5-7.5-5l-20-157.5c-2.5-5 0-7.5 5-7.5z" />
    </svg>
  );
}

function BoatTwo() {
  return (
    <svg viewBox="0 0 1200 1200" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="m188.79 1054.7c11.195 43.055 29.664 87.41 60.156 117.4 0 0 359.79-35.711 540.94-52.957 59.219-41.867 146.41-134.07 194.47-329.26 0 0-7.4531 208.34-147.93 324.87 7.668-0.71875 14.688-1.3672 20.918-1.9453 133.06-12.098 175.64-238.54 143.93-356.8 0 0-445.11 215.28-812.46 298.66zm725.26-296.14c-44.93-210.82-191.16-660.68-627.63-730.66 0 0 191.74 571.07-16.598 970.82 39.781-10.801 79.273-22.609 118.48-35.102 44.785-14.258 89.391-29.449 133.78-45.359 40.07-158 59.113-431.97-109.88-793.59 0 0 258.38 353.45 172.3 770.66 72.758-27.395 144.87-56.594 216.07-87.012 37.801-16.129 75.816-32.652 113.47-49.715z"
      />
    </svg>
  );
}

function BoatThree() {
  return (
    <svg viewBox="0 0 1200 1200" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="m1073.5 880.13c-1.4531-3.9844-5.8594-6.0469-9.8438-4.6406-68.578 24.797-107.39 8.2969-148.5-9.1406-3.1406-1.3594-6.3281-2.6719-9.5156-4.0312 9.6094-6.2812 18.984-13.125 27.984-21.094 12.469-11.016 24.375-23.766 35.438-38.438 19.078-25.312 30.984-52.641 42.891-79.922 12.469-28.547 24.844-57 45.328-83.719l-315.74 22.547-132.37 73.219c-0.89062 0.46875-1.875 0.79688-2.9531 0.89062-70.078 6.4219-139.55 10.453-208.4 11.906-66.469 1.4531-132.32 0.51562-197.48-2.8125-2.6719 28.969-2.1094 57.188 5.4375 80.719 6.4688 20.156 18.375 36.938 38.062 47.906-30.797 2.2969-63.938-1.2656-101.58-17.203-3.8906-1.6406-8.4375 0.1875-10.078 4.0781s0.1875 8.4375 4.0781 10.078c78.094 33.094 139.78 16.031 194.21 0.9375 47.531-13.172 88.641-24.516 133.69-3.2812 69.141 32.578 105.94 44.906 137.44 44.906 25.266 0 47.109-7.9219 79.5-19.734 21.141-7.6875 47.484-17.25 82.594-27.234 66.984-19.078 105.14-2.8594 145.55 14.297 42 17.859 85.453 36.328 159.74 9.4688 3.9844-1.4531 6.0469-5.8594 4.6406-9.8438zm-168.14-205.45c5.1562-6.4219 12.375-10.406 20.484-10.406s15.328 3.9844 20.484 10.406c4.7812 6 7.7812 14.203 7.7812 23.156s-2.9531 17.156-7.7812 23.156c-5.1562 6.4219-12.375 10.406-20.484 10.406s-15.328-3.9844-20.484-10.406c-4.7812-6-7.7812-14.203-7.7812-23.156s2.9531-17.156 7.7812-23.156zm-81.188 3.9375c5.1562-6.4219 12.375-10.406 20.484-10.406s15.328 3.9844 20.484 10.406c4.7812 6 7.7812 14.203 7.7812 23.156s-2.9531 17.156-7.7812 23.156c-5.1562 6.4219-12.375 10.406-20.484 10.406s-15.328-3.9844-20.484-10.406c-4.7812-6-7.7812-14.203-7.7812-23.156s2.9531-17.156 7.7812-23.156zm-214.92-51.938h-306.89l17.156-36c0.89062-1.875 2.1562-3.3281 3.7031-4.3125s3.375-1.5 5.4375-1.5h197.95c4.8281 0 9.3281-1.3125 13.219-3.7031s7.0781-5.9062 9.375-10.312l43.453-84.984c0.89062-1.7812 2.2031-3.1406 3.7031-4.125 1.5-0.9375 3.3281-1.4531 5.2969-1.4531h60.094v-172.36c-31.875 0.42187-46.031 8.2031-59.484 15.656-16.594 9.1875-32.156 17.812-81.188 10.312v-66.281c35.484 3.6562 55.922-6.4688 74.859-15.844 18.797-9.3281 36.141-17.812 65.812-10.734v-0.79687c0-4.2656 3.4219-7.6875 7.6875-7.6875s7.6875 3.4219 7.6875 7.6875v240h103.73c1.7812 0 3.375 0.375 4.7344 1.0781 1.4062 0.75 2.625 1.8281 3.6094 3.2812l22.5 32.531h-137.02c-3.6562 0-7.125 1.0312-10.125 2.9531-3 1.9219-5.4375 4.5938-7.0781 7.9688l-21.188 43.5c-1.5 3.0938-2.1562 6.375-2.0156 9.6562s1.125 6.5156 2.9062 9.4688c1.7812 2.9531 4.1719 5.2969 6.9844 6.8906s6 2.4844 9.375 2.4844h209.81c1.7344 0 3.3281-0.5625 4.5938-1.5469l25.312 36.656-154.22 11.016c-1.0781 0.09375-2.1094 0.375-3.1406 0.9375l-61.922 34.266-45.656-46.594c-2.5781-2.625-5.4844-4.6406-8.6719-6-3.2344-1.3594-6.6562-2.0625-10.266-2.0625zm65.297-93.75h147.89l35.531 51.375h-204.56c-0.75 0-1.4062-0.14062-1.9219-0.42188-0.51562-0.28125-0.98437-0.79688-1.3594-1.4062s-0.60938-1.2656-0.60938-1.875c-0.046874-0.60938 0.14063-1.2656 0.46875-1.9688l21.141-43.5c0.375-0.75 0.84375-1.3125 1.3594-1.6406 0.5625-0.32812 1.2656-0.51562 2.0625-0.51562zm242.72 178.13c-2.625-3.3281-4.2656-7.9688-4.2656-13.219s1.6406-9.8906 4.2656-13.219c2.2969-2.8594 5.3438-4.6406 8.5781-4.6406s6.2812 1.7812 8.5781 4.6406c2.625 3.3281 4.2656 7.9688 4.2656 13.219s-1.6406 9.8906-4.2656 13.219c-2.2969 2.8594-5.3438 4.6406-8.5781 4.6406s-6.2812-1.7812-8.5781-4.6406zm-81.188 3.9375c-2.625-3.3281-4.2656-7.9688-4.2656-13.219s1.6406-9.8906 4.2656-13.219c2.2969-2.8594 5.3438-4.6406 8.5781-4.6406s6.2812 1.7812 8.5781 4.6406c2.625 3.3281 4.2656 7.9688 4.2656 13.219s-1.6406 9.8906-4.2656 13.219c-2.2969 2.8594-5.3438 4.6406-8.5781 4.6406s-6.2812-1.7812-8.5781-4.6406zm231.84 219.32c1.4531 3.9844-0.60938 8.3906-4.5938 9.7969-74.25 26.859-116.48 8.9062-159.71-9.4688-38.812-16.5-78.516-33.375-145.55-14.297-35.297 10.031-61.359 19.5-82.594 27.234-73.453 26.719-92.297 33.562-216.94-25.219-45.094-21.281-87.562-9.5156-133.74 3.2812-55.5 15.375-116.11 32.156-194.16-0.9375-3.8906-1.6406-5.7188-6.1406-4.0781-10.031s6.1406-5.7188 10.031-4.0781c73.172 30.984 131.06 14.953 184.13 0.28125 49.031-13.594 94.125-26.062 144.37-2.3906 118.88 56.016 136.5 49.641 205.18 24.656 21.656-7.875 48.188-17.531 83.625-27.609 72.188-20.531 114.42-2.5781 155.76 14.953 40.406 17.203 79.922 33.938 148.5 9.1406 3.9844-1.4531 8.3906 0.60938 9.7969 4.5938zm-670.45-202.26c68.016-1.4531 136.6-5.3906 205.78-11.719l56.484-31.266-42.375-43.219c-1.1719-1.1719-2.3906-2.0625-3.7031-2.625s-2.7656-0.84375-4.4531-0.84375h-309.79l-1.5 90c33.047 0.46875 66.234 0.375 99.562-0.375zm104.62-65.344c0-4.3594 3.4219-7.875 7.6875-7.875h36.234c4.2656 0 7.6875 3.5156 7.6875 7.875v37.172c0 4.3594-3.4219 7.875-7.6875 7.875h-36.234c-4.2656 0-7.6875-3.5156-7.6875-7.875zm-72.516 0c0-4.3594 3.4219-7.875 7.6875-7.875h36.234c4.2656 0 7.6875 3.5156 7.6875 7.875v37.172c0 4.3594-3.4219 7.875-7.6875 7.875h-36.234c-4.2656 0-7.6875-3.5156-7.6875-7.875zm-72.516 0c0-4.3594 3.4219-7.875 7.6875-7.875h36.234c4.2656 0 7.6875 3.5156 7.6875 7.875v37.172c0 4.3594-3.4219 7.875-7.6875 7.875h-36.234c-4.2656 0-7.6875-3.5156-7.6875-7.875z"
      />
    </svg>
  );
}

function BoatFour() {
  return (
    <svg viewBox="0 0 1200 1200" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="m1002.8 449.86c10.359 0 18.75 8.3906 18.75 18.75s-8.3906 18.75-18.75 18.75h-112.45c-10.359 0-18.75-8.3906-18.75-18.75s8.3906-18.75 18.75-18.75z" />
      <path
        fillRule="evenodd"
        d="m965.34 513.61v-89.531c0-6.4688 5.25-11.719 11.719-11.719h126.52c3.0938 0 6.0938 1.2188 8.2969 3.4219s3.4219 5.1562 3.4219 8.2969v96.375c0 3.0938-1.2188 6.0938-3.4219 8.2969s-5.1562 3.4219-8.2969 3.4219h-44.578c0-1.6875-0.046875-3.375-0.046875-5.0625-0.046875-5.1562-2.25-10.078-6.0469-13.547-3.7969-3.5156-8.9062-5.25-14.016-4.875-25.078 1.8281-49.547 3.4688-73.5 4.9688z"
      />
      <path
        fillRule="evenodd"
        d="m1087.2 550.92v224.63c0 6.4688-5.25 11.719-11.719 11.719h-23.438c-6.4688 0-11.719-5.25-11.719-11.719v-79.266c2.9531-8.0625 5.5312-16.688 7.7344-25.922 7.5469-31.688 10.734-71.016 10.969-119.39h28.125z"
      />
      <path
        fillRule="evenodd"
        d="m1150.4 712.26c3.0938 0 6.0938 1.2188 8.2969 3.4219s3.4219 5.1562 3.4219 8.2969v23.438c0 3.0938-1.2188 6.0938-3.4219 8.2969s-5.1562 3.4219-8.2969 3.4219h-44.531v-46.875z"
      />
      <path
        fillRule="evenodd"
        d="m1036.5 626.06c-10.5 93.609-45.141 135.71-130.03 149.16-147.05 23.344-600.52 13.312-701.9-36.281-103.08-50.438-145.31-128.26-160.18-223.82 306.52 124.22 569.76 141.32 992.11 110.95z"
      />
      <path
        fillRule="evenodd"
        d="m41.578 493.74c-2.2969-20.484-3.5156-41.719-3.9375-63.609-0.09375-3.9375 1.8281-7.6406 5.0625-9.8438 3.2344-2.25 7.3594-2.6719 11.016-1.2188 301.13 121.6 560.63 138.56 973.97 109.22 3.2344-0.23438 6.4219 0.89062 8.8125 3.0938s3.75 5.2969 3.75 8.5312c0.09375 24.703-0.51562 47.062-2.0156 67.266-425.06 30.797-687.74 13.688-996.71-113.44z"
      />
    </svg>
  );
}

export default function HeroBoats() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-0 animate-hero-boats-fadein" aria-hidden="true">
      <div className="hero-boat hero-boat-1 h-[26px] w-[26px] text-cream drop-shadow">
        <BoatOne />
      </div>
      <div className="hero-boat hero-boat-4 h-6 w-6 text-cream drop-shadow">
        <BoatFour />
      </div>
      <div className="hero-boat hero-boat-2 h-5 w-5 text-cream drop-shadow">
        <BoatTwo />
      </div>
      <div className="hero-boat hero-boat-3 h-6 w-6 text-cream drop-shadow">
        <BoatThree />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/HeroBoats.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (141 + 2 = 143); tsc reports no errors.

- [ ] **Step 7: Commit**

```bash
git add components/HeroBoats.tsx components/HeroBoats.test.tsx app/globals.css
git commit -m "Add HeroBoats ambient boat overlay component"
```

---

## Task 2: Wire into `Hero`, hero-stage sizing, reduced-motion

**Files:**
- Modify: `components/Hero.tsx` (full rewrite)
- Modify: `components/Hero.test.tsx` (full rewrite)
- Modify: `app/globals.css` (append hero-stage + breathing-zoom rules)

**Interfaces:**
- Consumes: `HeroBoats` (Task 1, no props).
- Produces: no new exports — `Hero` is already imported by `components/Wizard.tsx` with the same signature (no props), unchanged.

- [ ] **Step 1: Write the failing tests** — replace the entire contents of `components/Hero.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Hero from './Hero';

function stubMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('Hero', () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it('renders a video that autoplays, is muted, and does not loop', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('muted');
    expect(video).not.toHaveAttribute('loop');
  });

  it('adds the breathing-zoom class and renders the boats overlay once the video ends', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.className).not.toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(0);

    fireEvent.ended(video);

    expect(video.className).toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });

  it('does not add breathing zoom or boats when prefers-reduced-motion is set', () => {
    stubMatchMedia(true);
    const { container } = render(<Hero />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.ended(video);

    expect(video.className).not.toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Hero.test.tsx`
Expected: FAIL — current `Hero.tsx` has no `onEnded` handling, no breathing-zoom class, no boats overlay, and `window.matchMedia` isn't called.

- [ ] **Step 3: Append hero-stage + breathing-zoom rules to `app/globals.css`**

Append at the end of the file (after Task 1's boat rules):

```css
/* Hero stage: keeps the video + boats overlay in one 16:9 coordinate
   system that covers the viewport identically at any screen size */
.hero-stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero-stage-surface {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 56.25vw; /* 100vw / (16/9) */
  min-height: 100vh;
  min-width: 177.78vh; /* 100vh * (16/9) */
}

@keyframes hero-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.035); }
}

.animate-hero-breathe {
  animation: hero-breathe 12s ease-in-out infinite;
}
```

- [ ] **Step 4: Write the implementation** — replace the entire contents of `components/Hero.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import HeroBoats from '@/components/HeroBoats';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('muted', 'muted');
    }
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const showMotion = ended && !reducedMotion;

  return (
    <div className="hero-stage">
      <div className="hero-stage-surface">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover${showMotion ? ' animate-hero-breathe' : ''}`}
          src="/santorini_2027.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setEnded(true)}
        />
        {showMotion && <HeroBoats />}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/Hero.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (145 total: 143 after Task 1, + 2 net new since `Hero.test.tsx` grew from 1 test to 3); tsc reports no errors.

- [ ] **Step 7: Copy the boat SVG source files into the repo for provenance**

The four SVGs used in `HeroBoats.tsx` originated from the user's Desktop. Copy them into the repo so they're tracked alongside the component that uses their path data (not imported at runtime — `HeroBoats.tsx` inlines the path data directly — this is purely for provenance/future editing):

```bash
mkdir -p components/boat-svgs
cp /Users/stevework/Desktop/noun-boat-175154.svg components/boat-svgs/
cp /Users/stevework/Desktop/noun-boat-4551761.svg components/boat-svgs/
cp /Users/stevework/Desktop/noun-boat-8350556.svg components/boat-svgs/
cp /Users/stevework/Desktop/noun-boat-8419088.svg components/boat-svgs/
```

- [ ] **Step 8: Commit**

```bash
git add components/Hero.tsx components/Hero.test.tsx app/globals.css components/boat-svgs
git commit -m "Wire HeroBoats + breathing zoom into Hero, respect prefers-reduced-motion"
```

---

## Local Preview

After both tasks: `npm run dev`, visit `http://localhost:3000`, let the hero video play to the end (or scrub/wait), and confirm the breathing zoom + four boats appear smoothly. Test `prefers-reduced-motion` via Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce" and reload — confirm no zoom, no boats.

---

## Self-Review Notes

- **Spec coverage:** breathing zoom (Task 2), four boats in pixel-verified pockets with drift/pause/turn zigzag (Task 1), cream color (Task 1), `prefers-reduced-motion` fully disabling both via JS `matchMedia` (Task 2), shared `.hero-stage`/`.hero-stage-surface` for cross-viewport alignment (Task 2), ~1s fade-in (Task 1's `animate-hero-boats-fadein`), boats-on-all-breakpoints scope decision (inherent — no breakpoint-specific code added, matching the "show everywhere" decision). All covered.
- **Type consistency:** `HeroBoats` (no props) is referenced identically in Task 1's test and Task 2's `Hero.tsx` import.
- **Existing behavior preserved:** `Hero.test.tsx`'s original assertions (autoplay/muted/no-loop) are carried over verbatim in Task 2's rewritten test file.
- **jsdom note:** `window.matchMedia` is not implemented by jsdom and must be stubbed per-test (Task 2 test file does this via `vi.stubGlobal`, following the existing `vi.stubGlobal('fetch', ...)` pattern already used in `ContentEditor.test.tsx`) — this is a new global not yet in `vitest.setup.ts`; since only this one component needs it, a per-test stub is used rather than a shared setup addition (YAGNI).
