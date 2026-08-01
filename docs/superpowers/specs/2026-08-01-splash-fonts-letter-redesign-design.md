# Splash Screen + Custom Fonts + Wider Letter — Design

**Date:** 2026-08-01
**Status:** Approved

## Goal

Introduce a new full-screen "splash" moment as the very first thing a visitor sees — a big animated Dirtyline-font headline over the hero background, with a "Tell Me More" button that launches into the existing Letter → RSVP flow. Move "Join us in Santorini / 20 years — 2007 to 2027" out of the Opening form module into this new splash. Give the Letter module its own Dirtyline title and make it wider/centered on desktop. Replace Helvetica with Geist Sans as the site's body/secondary font everywhere. Keep Dirtyline scoped to just the splash and the Letter title — no other module heading changes typeface.

All of this was iterated live in the browser-based brainstorming companion using the real font files, the real hero still frame, and the real animation timing — every visual decision below was actually seen, not just described.

## Current state

- `components/Wizard.tsx` starts at `moduleId = 'letter'`; `lib/types.ts`'s `ModuleId` union has no earlier step.
- `components/modules/OpeningModule.tsx` has the only `<h1>` in the module flow: "Join us in Santorini" / "20 years — 2007 to 2027".
- `components/modules/LetterModule.tsx` renders inside `<ModulePanel draggable>` with no heading of its own — just the letter paragraphs and a Next button.
- `components/ModulePanel.tsx` always renders at `max-w-md` (448px), pushed right via a responsive `ml-*` scale (`sm:ml-[60px]` up to `2xl:ml-[380px]`) so more of the background art shows on wide screens. This offset makes sense for the RSVP form modules, but not for the Letter, which should be centered and wider.
- `app/globals.css` sets `--font-sans: Helvetica, Arial, sans-serif` — the site's only font today, used everywhere.
- The `geist` npm package (v1.7.2, official Vercel package, `next/font/local` under the hood) is already installed.
- A licensed display font, "Dirtyline 36daysoftype 2022" (desktop + web license, commercial use allowed), has been extracted and verified: its only OpenType alternates are for uppercase B/C/D/E (confirmed by reading the font's actual GSUB substitution tables, not guessed) — there is no special "N" alternate. Uppercase and lowercase are simply two different letterform styles by design (confirmed by rendering both cases from the real font), which is why the approved title deliberately mixes case rather than being all-caps or all-lowercase.

## Approved design

### 1. New `SplashModule` — first screen in the flow

- New first `ModuleId`, `'splash'`, ahead of `'letter'`. `Wizard` starts here instead of at `'letter'`. `getNextModule('splash', draft)` returns `'letter'`; every other transition is unchanged.
- `AboutIcon`'s existing `visible={moduleId !== 'letter'}` extends to `visible={moduleId !== 'letter' && moduleId !== 'splash'}` — the splash stays a clean, icon-free moment, matching how the Letter already hides it today.
- Rendered directly over the `Hero` background (no `ModulePanel` card) — full-viewport, centered content.
- **Title:** `SAntOrIni! PaRT DeUx`, in Dirtyline, exact casing as shown (deliberately mixed-case, leaning on the font's naturally different upper/lowercase letterforms) — this replaces "Join us in Santorini" as the site's real headline moment.
- **Subhead:** `twenty years in the making`, in Dirtyline, all lowercase, cream color (`#DED5BD`, same as the title — not the muted sage originally tried), smaller size.
- **Animation**, approved exactly as previewed:
  - Title: masked (`overflow: hidden` wrapper) slide-up from `translateY(100%)` + fade, `0.7s cubic-bezier(0.25,0.1,0.25,1)`, `0.3s` delay.
  - Subhead: fade + slight rise, `0.6s ease-out`, `1.1s` delay.
  - CTA button: fades/scales in (`0.5s ease-out`, `1.6s` delay), then bobs (`translateY` 0 → -6px → 0) forever on a `2s ease-in-out infinite` loop starting at `2.1s`.
- **CTA:** a pill button reading "Tell Me More" — terracotta background, cream uppercase text, matching the site's existing pill-button style elsewhere (e.g. `ContentEditor`'s Save button). Clicking it calls `onAdvance(draft)` exactly like `LetterModule`'s existing Next button, advancing to `'letter'`.

### 2. `LetterModule` — wider, centered, new Dirtyline title

- `ModulePanel` gains a `wide?: boolean` prop. When `true`: `max-w-2xl` (672px, confirmed at this width in the live preview) instead of `max-w-md`, and **no** responsive `ml-*` offset — it stays truly centered via the outer wrapper's existing `justify-center`. When `false`/omitted, behavior is byte-identical to today (every other module is unaffected).
- `LetterModule` passes `<ModulePanel draggable wide>`.
- New title above the letter paragraphs: `Time flies. Let's have fun.` — in Dirtyline, plain sentence case (no special mixed-casing treatment here, unlike the splash — the font's ordinary capital "T" is enough).

### 3. Fonts, site-wide

- **Geist Sans replaces Helvetica everywhere** (the secondary/body font — every paragraph, label, button, input across every module and the admin dashboard). Wired via the already-installed `geist` package: `import { GeistSans } from 'geist/font/sans'` applied at the root layout, `--font-sans` in `app/globals.css` updated to `var(--font-geist-sans), Helvetica, Arial, sans-serif` (Helvetica kept only as a fallback if the font somehow fails to load — not a visible design choice).
- **Dirtyline is scoped to exactly three places:** the splash title, the splash subhead, and the Letter module's new title. Every other module heading (Hotel, Date Windows, Travel Timing, Dinner/Cruise, Closing, and Opening's own heading) keeps its current font — this was an explicit choice, not an oversight, to keep Dirtyline a "moment" rather than a running theme.
- Dirtyline is self-hosted via `next/font/local` (the font file is committed to the repo, not loaded from a third-party CDN at runtime) — licensed for this exact use (desktop + web, commercial use allowed).

### 4. Explicitly deferred (not part of this round)

`OpeningModule`'s current heading ("Join us in Santorini" / "20 years — 2007 to 2027") is now redundant with the splash and **will look duplicated** once this ships — the owner hasn't decided its replacement copy yet ("we'll get there"). This implementation round leaves `OpeningModule`'s heading exactly as it is today, unchanged, so as not to block on an undecided piece of copy. Revisiting this heading is explicitly a follow-up, not part of this plan.

## Code structure

- `lib/fonts.ts` — new: re-exports `GeistSans` from `geist/font/sans`, and defines `dirtyline` via `next/font/local` pointing at the committed font file.
- `app/fonts/dirtyline.woff2` — new: the self-hosted font file (single woff2 is sufficient for `next/font/local`'s build-time optimization).
- `app/layout.tsx` — modified: applies `GeistSans.variable` to `<html>`.
- `app/globals.css` — modified: `--font-sans` now references `var(--font-geist-sans)`; new keyframes for the splash title/subhead/CTA animations.
- `lib/types.ts` — modified: `ModuleId` gains `'splash'` as its first value.
- `lib/flow.ts` — modified: `getNextModule` gains the `'splash' → 'letter'` case.
- `components/modules/SplashModule.tsx` — new.
- `components/Wizard.tsx` — modified: initial `moduleId` state, renders `SplashModule`, extends `AboutIcon`'s `visible` condition.
- `components/ModulePanel.tsx` — modified: new `wide` prop.
- `components/modules/LetterModule.tsx` — modified: passes `wide` to `ModulePanel`, adds the new Dirtyline title.

## Testing

- `components/modules/SplashModule.test.tsx` — new: renders the title/subhead text; clicking "Tell Me More" calls `onAdvance` with the current draft unchanged (mirrors `LetterModule`'s existing test pattern).
- `components/ModulePanel.test.tsx` — extend: the `wide` prop produces `max-w-2xl` and no `ml-*` classes; omitting it (or `false`) keeps today's `max-w-md` + offset classes exactly as they are (a regression guard for every other module that does NOT pass `wide`).
- `components/modules/LetterModule.test.tsx` — extend: the new title text renders; `ModulePanel` receives `wide`.
- `lib/flow.test.ts` (if it doesn't already exist as a file — check at implementation time) or wherever `getNextModule` is currently tested — extend: `getNextModule('splash', draft)` returns `'letter'`.
- `components/Wizard.test.tsx` — extend: the app starts on the splash screen (splash text visible, Letter/Opening not yet rendered) and clicking "Tell Me More" reveals the Letter module.
- No test attempts to verify the actual visual animation (timing/easing) — that was validated live in the browser during brainstorming, not something jsdom can meaningfully assert on. Tests only confirm the right elements/classes/text exist and the flow transition works.

## Out of scope (YAGNI)

- `OpeningModule`'s heading text (explicitly deferred, see above).
- Dirtyline anywhere beyond the three approved spots.
- Any animation library (Framer Motion, etc.) — everything is plain CSS keyframes, consistent with how every other animation in this codebase (hero boats, module transitions, arrow bob) is already built.
- Re-litigating the hero boats/breathing-zoom feature — unrelated, already shipped.
