# Landing Page Updates — Design

## Purpose

A batch of 7 design/interaction refinements to the already-built, deployed santorini2027.com app: a new "Letter" opening screen that minimizes into a persistent About icon, more legible I'm in/Can't make it buttons, required-field indicators, party-size pill buttons, pill-shaped primary buttons, a draggable opening panel, and a live Santorini weather widget. This is a refinement pass on existing modules, plus two small new pieces of UI chrome (About icon, weather widget) — no changes to the RSVP data model or submission pipeline.

## 1. Letter screen → persistent About icon

**New module:** `LetterModule`, added as `lib/types.ts`'s `ModuleId` union gains `'letter'`. It becomes the true first screen — `app/page.tsx`'s initial `moduleId` state changes from `'opening'` to `'letter'`. `lib/flow.ts`'s `getNextModule('letter', draft)` unconditionally returns `'opening'` (no branching — everyone sees the letter regardless of their eventual attending answer).

`LetterModule` renders in the existing `ModulePanel` shell (its `max-h-dvh overflow-y-auto` already handles a long scrollable letter). Content is the exact text below, with line breaks preserved as paragraphs:

> Hi friend.
>
> How are you? Oh, it's just been almost 7,300 days since we were last in Greece together, when Andi and I got married under the watchful eyes of Greek Jesus. Maybe you couldn't make it. Of course it's possible that we hadn't entered each others' orbits yet. Perhaps you were young and don't remember it that clearly and want to relive it now that you can legally buy a glass of Mythos or Alfa. Who knows. A lot of life has happened since then. Births. Deaths. And while our motivations may have changed, the goal has not — a few more joyous days and nights with beloved family and friends.
>
> Twenty years ago we said we'd do it again twenty years later. And here we are. Twenty years later. How? When? Why? Einstein once said that "The only reason for time is so that everything doesn't happen at once." And so we get to do this again. Not once. But twice. Maybe three times? Let's not push it. Let's do it. Answer some questions below and we'll figure it out.
>
> Hope you can make it. I'll be loose. But the information you send our way will help Andi and I set up a few opportunities for us all to get together (outside of beach and pool hangs, hikes, etc.)
>
> With love,
>
> Steve, Andi and Nicolas

A "Next" button (matching every other module's advance button) proceeds to the OpeningModule.

**About icon:** rendered in `app/page.tsx` (or `Hero`, wherever it can sit above every module at a page level), fixed position, upper-left corner, `z-20` (above module panels), using the provided SVG (`/Users/stevework/Desktop/noun-about-4293177.svg`, a circular "i" info glyph) recolored via `fill: #8A5233` (terracotta). Tap target sized to at least 44×44px for mobile.

**Visibility:** hidden while `moduleId === 'letter'` (the letter itself IS the expanded content). Once the user advances past the Letter, the icon becomes visible for every subsequent module (`hotel`, `dateWindows`, `travelTiming`, `dinnerCruise`, `closing`) and stays visible — no logic needed to hide it again once shown, since `moduleId` only ever moves forward past `'letter'` once.

**Transition:** simple fade — matching the existing module-swap behavior already in the app (the outgoing module unmounts, the incoming module fades in via `.animate-module-in`), no new reverse/exit animation needed. The Letter unmounts, OpeningModule fades in as normal, and the About icon appears in the corner for the first time alongside it. No literal fly-to-corner morph animation.

**Reopening:** clicking the About icon at any point after the Letter opens a centered overlay (same glass-panel visual treatment: `bg-navy/[0.82]` + `backdrop-blur-md` + cream text) showing the identical letter text, with a close affordance (X button or click-outside-to-close). This is the same content as the Letter module, not separate placeholder copy.

## 2. I'm in / Can't make it — legibility

No size change from current. Selected state unchanged (solid terracotta fill, `#8A5233`, cream text). Unselected state changes from the current thin teal outline to **solid cream fill (`#DED5BD`) with navy text** — high contrast against the navy panel, addresses the legibility complaint directly. Combined with item 5 (pill shape).

## 3. Required-field indicators

Required fields get a trailing asterisk on their label, plus a small "*required" legend rendered once near the top of each module that has required fields. Required fields, by module:

- **Opening:** Name, Are you coming?
- **Opening (conditional):** Party size — required only when attending is true (already enforced by `canAdvanceFromOpening`)
- **Hotel:** Staying at the Adamastos Hotel?
- **Hotel (conditional):** Nights — required only when staying is true
- **Date windows:** at least one window selected (the asterisk applies to the module's instruction text, not an individual checkbox, since it's a "pick at least one" constraint rather than a single required field)
- **Travel timing:** the Before/After/Both/Neither selector

Not required (no asterisk): all free-text note fields (opening has none directly, but travel note and the closing note are optional), dinner/cruise toggles, hotel nights when not staying, party size when not attending.

This maps directly to the existing `canAdvanceFromX` validators in `lib/flow.ts` — the asterisked fields are exactly the ones each validator already gates on. No new validation logic, purely a visual indicator layered on top of validation that already exists.

## 4. Party-size pill buttons

Replaces `OpeningModule`'s numeric `<input type="number">` for party size with six pill buttons: **Just me**, **+1**, **+2**, **+3**, **+4**, **+5**, mapping to `partySize` values 1 through 6 respectively. Same selected/unselected color pattern as item 2: unselected = cream fill (`#DED5BD`) navy text, selected = terracotta fill (`#8A5233`) cream text. Fully rounded (pill) shape.

This caps party size at 6. The prior number input had no explicit upper bound, but a 6-person cap is reasonable for this kind of trip RSVP and matches what a fixed pill row can display cleanly; if someone's party is larger they can note it in the closing module's free-text note field.

## 5. Pill shape

Applies to: I'm in / Can't make it (item 2), and the new party-size buttons (item 4) — both already specified above as pill-shaped. Does not apply to the "Next" advance buttons or the Hotel/Travel-timing/Dinner-Cruise module buttons, which keep their current rectangular styling (out of scope for this batch — Steve's request was scoped to these two specific button groups).

## 6. Draggable opening panel

`OpeningModule`'s panel (rendered via `ModulePanel`) becomes click-and-draggable, revealing the hero video/island illustration underneath as it moves. Constraints:

- **Bounded** to the viewport — cannot be dragged fully off-screen; always at least partially visible/grabbable.
- **No snap-back** — stays wherever it's released until the module changes (advancing to Hotel resets to a fresh, centered, non-draggable panel, since only OpeningModule's panel is draggable).
- **Scope:** only `OpeningModule`'s panel. `LetterModule` and every module after Opening (`Hotel`, `DateWindows`, `TravelTiming`, `DinnerCruise`, `Closing`) remain fixed/centered, not draggable.

Implementation detail (not a product decision, left to the plan): this needs pointer-event-based drag handling (mousedown/touchstart → mousemove/touchmove → mouseup/touchend) with the panel's position tracked in local component state and clamped to viewport bounds on each move — no new dependency needed for a single draggable element with simple bounds-clamping.

## 7. Santorini weather widget

A small widget in the **upper-right** corner, mirroring the About icon's upper-left placement — same fixed position pattern, same `z-20` layer, visible on every screen including the Letter (this is ambient site chrome, not narrative content, so unlike the About icon it doesn't need to wait until after the Letter to appear).

**Content:** Steve's provided sun icon (static — always sunny, per Steve) + current temperature in Santorini, Greece + a small "SANTORINI" label underneath, mirroring the reference screenshot's icon/temp/city-name layout.

**Data source:** [Open-Meteo](https://open-meteo.com/) current-weather API — free, no API key or account required. Fixed coordinates for Santorini/Fira (`latitude=36.3932&longitude=25.4615`), Fahrenheit (`temperature_unit=fahrenheit`). Only `temperature_2m` is needed from the `current` response — no weather-code-to-icon mapping required since the icon is static.

**Fetch behavior:** client-side fetch on mount (the component is already interactive/client-rendered alongside the rest of the app). Fetched once per page load — no polling/auto-refresh interval, since this is a one-time visit experience, not a live dashboard.

**Failure handling:** if the fetch fails (network error, API down), the widget hides itself entirely rather than showing a broken/stale state — it's decorative ambiance, not required information, so failing silently is preferable to an error message competing with the RSVP flow.

## Scope note

This spec assumes the `main` branch state as of the last deployment (14-task build + final-review fixes, commit `1795b8d`/`07ff315` merged to main). All 7 items are additive/modifying changes to `OpeningModule.tsx`, `ModulePanel.tsx` (or a new shared button/pill styling), `app/page.tsx`, `app/globals.css`, `lib/types.ts`, and `lib/flow.ts`, plus two new presentational components (About icon + overlay, weather widget) — no changes to the submission pipeline, Supabase schema, admin page, or any other module beyond Opening. The weather widget is the only piece of this batch that talks to an external network service; everything else is purely local UI/state.
