# Landing Page Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 7 landing-page refinements to the deployed santorini2027.com app: a Letter opening screen that minimizes into a persistent About icon, legible pill-shaped I'm in/Can't make it buttons, required-field indicators, party-size pill buttons, a draggable opening panel, and a live Santorini weather widget.

**Architecture:** All changes are additive/modifying within the existing Next.js App Router structure — one new module (`LetterModule`), two new page-level widgets (`AboutIcon`, `WeatherWidget`), styling/interaction changes to `OpeningModule` and `ModulePanel`, and small text additions to `HotelModule`/`DateWindowsModule`/`TravelTimingModule`. No backend, schema, or submission-pipeline changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest + React Testing Library (unchanged from the existing app).

## Global Constraints

- Palette (exact, already defined in `app/globals.css`): navy `#082534`, terracotta `#8A5233`, teal `#265F6E`, cream `#DED5BD`, sage `#9FB3AF`. No new colors introduced.
- Letter text is exact — copy verbatim, no paraphrasing (see Task 2).
- About icon: upper-left, fixed position, terracotta fill, hidden while the Letter is showing, visible on every module after it, reopens the same letter text in an overlay.
- Weather widget: upper-right, fixed position, visible on every screen including the Letter, Fahrenheit, fixed Santorini coordinates (lat `36.3932`, lon `25.4615`), Open-Meteo API (no key), static sun icon (cream fill, terracotta acceptable as a fallback if cream doesn't read well), fetched once on mount, fails silently (renders nothing) on error.
- Party size: 6 pill buttons — "Just me", "+1", "+2", "+3", "+4", "+5" — mapping to values 1–6.
- I'm in / Can't make it and the party-size buttons: pill-shaped (`rounded-full`); unselected = cream fill/navy text, selected = terracotta fill/cream text.
- Draggable panel: `OpeningModule`'s panel only, bounded to the viewport, no snap-back on release.
- Required-field asterisks map 1:1 to the existing `canAdvanceFromX` validators in `lib/flow.ts` — no new validation logic, purely a visual indicator.

---

## File Structure

```
lib/
  letter-content.ts          (new: shared LETTER_PARAGRAPHS constant)
  types.ts                   (modify: ModuleId gains 'letter')
  flow.ts                    (modify: getNextModule gains 'letter' -> 'opening')
  flow.test.ts                (modify: new test for the letter case)
components/
  ModulePanel.tsx             (modify: optional draggable prop)
  ModulePanel.test.tsx        (modify: drag behavior tests)
  AboutIcon.tsx                (new: icon + overlay, self-contained)
  AboutIcon.test.tsx           (new)
  WeatherWidget.tsx            (new: fetch + render)
  WeatherWidget.test.tsx       (new)
  modules/
    LetterModule.tsx           (new)
    LetterModule.test.tsx      (new)
    OpeningModule.tsx          (modify: pill restyle, party-size pills, draggable, asterisks)
    OpeningModule.test.tsx     (modify: update existing test, add new tests)
    HotelModule.tsx            (modify: asterisks)
    HotelModule.test.tsx       (modify: add legend test)
    DateWindowsModule.tsx      (modify: asterisk)
    DateWindowsModule.test.tsx (modify: add legend test)
    TravelTimingModule.tsx     (modify: asterisk)
    TravelTimingModule.test.tsx (modify: add legend test)
app/
  page.tsx                    (modify: initial moduleId, Letter case, AboutIcon + WeatherWidget)
```

---

### Task 1: Shared letter content + flow state for the Letter module

**Files:**
- Create: `lib/letter-content.ts`
- Modify: `lib/types.ts`
- Modify: `lib/flow.ts`
- Modify: `lib/flow.test.ts`

**Interfaces:**
- Produces: `LETTER_PARAGRAPHS: string[]` (consumed by `LetterModule` in Task 2 and `AboutIcon` in Task 3); `ModuleId` gains `'letter'` as a member (consumed by `app/page.tsx` in Task 2); `getNextModule('letter', draft)` always returns `'opening'`.

- [ ] **Step 1: Write `lib/letter-content.ts`**

```ts
export const LETTER_PARAGRAPHS: string[] = [
  'Hi friend.',
  "How are you? Oh, it's just been almost 7,300 days since we were last in Greece together, when Andi and I got married under the watchful eyes of Greek Jesus. Maybe you couldn't make it. Of course it's possible that we hadn't entered each others' orbits yet. Perhaps you were young and don't remember it that clearly and want to relive it now that you can legally buy a glass of Mythos or Alfa. Who knows. A lot of life has happened since then. Births. Deaths. And while our motivations may have changed, the goal has not — a few more joyous days and nights with beloved family and friends.",
  'Twenty years ago we said we\'d do it again twenty years later. And here we are. Twenty years later. How? When? Why? Einstein once said that "The only reason for time is so that everything doesn\'t happen at once." And so we get to do this again. Not once. But twice. Maybe three times? Let\'s not push it. Let\'s do it. Answer some questions below and we\'ll figure it out.',
  "Hope you can make it. I'll be loose. But the information you send our way will help Andi and I set up a few opportunities for us all to get together (outside of beach and pool hangs, hikes, etc.)",
  'With love,',
  'Steve, Andi and Nicolas',
];
```

- [ ] **Step 2: Write the failing test — add to `lib/flow.test.ts`**

Add this `describe` block (alongside the existing ones in the file):

```ts
describe('getNextModule — letter', () => {
  it('routes letter unconditionally to opening', () => {
    expect(getNextModule('letter', EMPTY_DRAFT)).toBe('opening');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/flow.test.ts`
Expected: FAIL — TypeScript error / runtime error, since `'letter'` isn't a valid `ModuleId` yet and `getNextModule` doesn't handle it.

- [ ] **Step 4: Add `'letter'` to `ModuleId` in `lib/types.ts`**

Modify the `ModuleId` type:

```ts
export type ModuleId = 'letter' | 'opening' | 'hotel' | 'dateWindows' | 'travelTiming' | 'dinnerCruise' | 'closing';
```

- [ ] **Step 5: Add the letter case to `getNextModule` in `lib/flow.ts`**

Modify the `switch` in `getNextModule`:

```ts
export function getNextModule(current: ModuleId, draft: DraftResponse): ModuleId {
  switch (current) {
    case 'letter':
      return 'opening';
    case 'opening':
      return draft.attending ? 'hotel' : 'closing';
    case 'hotel':
      return 'dateWindows';
    case 'dateWindows':
      return 'travelTiming';
    case 'travelTiming':
      return 'dinnerCruise';
    case 'dinnerCruise':
      return 'closing';
    case 'closing':
      return 'closing';
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/flow.test.ts`
Expected: PASS, all tests green (15 total: 14 existing + 1 new).

- [ ] **Step 7: Commit**

```bash
git add lib/letter-content.ts lib/types.ts lib/flow.ts lib/flow.test.ts
git commit -m "Add letter content and letter module state to the flow machine"
```

---

### Task 2: LetterModule — the new first screen

**Files:**
- Create: `components/modules/LetterModule.tsx`
- Create: `components/modules/LetterModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `LETTER_PARAGRAPHS` (`lib/letter-content.ts`), `ModulePanel` (`components/ModulePanel.tsx`), the same `{ draft: DraftResponse, onAdvance: (updated: DraftResponse) => void }` prop shape every other module uses.
- Produces: `<LetterModule draft={draft} onAdvance={advance} />`, rendered as the new initial module in `app/page.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LetterModule from './LetterModule';
import { EMPTY_DRAFT } from '@/lib/types';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

describe('LetterModule', () => {
  it('renders the letter text and advances the unchanged draft on Next', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<LetterModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    expect(screen.getByText(LETTER_PARAGRAPHS[0])).toBeInTheDocument();
    expect(screen.getByText(LETTER_PARAGRAPHS[LETTER_PARAGRAPHS.length - 1])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/LetterModule.tsx`**

```tsx
'use client';
import ModulePanel from '@/components/ModulePanel';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel>
      {LETTER_PARAGRAPHS.map((paragraph, index) => (
        <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
          {paragraph}
        </p>
      ))}
      <button
        type="button"
        onClick={() => onAdvance(draft)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

Modify `app/page.tsx`: add the import, change the initial `moduleId` state, and add the render line as the first conditional.

```tsx
import LetterModule from '@/components/modules/LetterModule';
```

```tsx
  const [moduleId, setModuleId] = useState<ModuleId>('letter');
```

```tsx
      <Hero />
      {moduleId === 'letter' && <LetterModule draft={draft} onAdvance={advance} />}
      {moduleId === 'opening' && <OpeningModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/modules/LetterModule.tsx components/modules/LetterModule.test.tsx app/page.tsx
git commit -m "Add LetterModule as the new first screen"
```

---

### Task 3: AboutIcon — persistent icon + letter overlay

**Files:**
- Create: `components/AboutIcon.tsx`
- Create: `components/AboutIcon.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `LETTER_PARAGRAPHS` (`lib/letter-content.ts`).
- Produces: `<AboutIcon visible={boolean} />`, rendered in `app/page.tsx` right after `<Hero />`, with `visible={moduleId !== 'letter'}`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutIcon from './AboutIcon';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

describe('AboutIcon', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<AboutIcon visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens an overlay with the letter text when clicked, and closes it', async () => {
    const user = userEvent.setup();
    render(<AboutIcon visible={true} />);

    expect(screen.queryByText(LETTER_PARAGRAPHS[0])).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /about this trip/i }));
    expect(screen.getByText(LETTER_PARAGRAPHS[0])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByText(LETTER_PARAGRAPHS[0])).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/AboutIcon.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/AboutIcon.tsx`**

The SVG path below is the exact path data from `/Users/stevework/Desktop/noun-about-4293177.svg` (a circular "i" info glyph), recolored via `fill="currentColor"` and the wrapping button's `text-terracotta` class.

```tsx
'use client';
import { useState } from 'react';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

function AboutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" className={className} fill="currentColor" aria-hidden="true">
      <path d="m600 285.12c-173.53 0-314.88 141.35-314.88 314.88s141.35 314.88 314.88 314.88 314.88-141.35 314.88-314.88-141.35-314.88-314.88-314.88zm0 125.95c8.3516 0 16.363 3.3164 22.266 9.2227 5.9062 5.9023 9.2227 13.914 9.2227 22.262 0 8.3516-3.3164 16.363-9.2227 22.266-5.9023 5.9062-13.914 9.2227-22.266 9.2227-8.3477 0-16.359-3.3164-22.266-9.2227-5.9023-5.9023-9.2227-13.914-9.2227-22.266 0-8.3477 3.3203-16.359 9.2227-22.262 5.9062-5.9062 13.918-9.2227 22.266-9.2227zm0 94.465v-0.003906c8.3516 0 16.363 3.3203 22.266 9.2227 5.9062 5.9062 9.2227 13.914 9.2227 22.266v220.42c0 8.3516-3.3164 16.359-9.2227 22.266-5.9023 5.9062-13.914 9.2227-22.266 9.2227-8.3477 0-16.359-3.3164-22.266-9.2227-5.9023-5.9062-9.2227-13.914-9.2227-22.266v-220.42c0-8.3516 3.3203-16.359 9.2227-22.266 5.9062-5.9023 13.918-9.2227 22.266-9.2227z" />
    </svg>
  );
}

interface AboutIconProps {
  visible: boolean;
}

export default function AboutIcon({ visible }: AboutIconProps) {
  const [open, setOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About this trip"
        className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center text-terracotta"
      >
        <AboutGlyph className="h-7 w-7" />
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="max-h-dvh w-full max-w-md overflow-y-auto border-l-4 border-terracotta bg-navy/[0.94] p-8 backdrop-blur-md">
            {LETTER_PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
                {paragraph}
              </p>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/AboutIcon.test.tsx`
Expected: PASS, both tests green.

- [ ] **Step 5: Wire into `app/page.tsx`**

Modify `app/page.tsx`: add the import and render line right after `<Hero />`.

```tsx
import AboutIcon from '@/components/AboutIcon';
```

```tsx
      <Hero />
      <AboutIcon visible={moduleId !== 'letter'} />
      {moduleId === 'letter' && <LetterModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/AboutIcon.tsx components/AboutIcon.test.tsx app/page.tsx
git commit -m "Add persistent About icon with letter overlay"
```

---

### Task 4: WeatherWidget — live Santorini temperature

**Files:**
- Create: `components/WeatherWidget.tsx`
- Create: `components/WeatherWidget.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `fetchSantoriniTemperature(): Promise<number>` (exported for direct testing), `<WeatherWidget />` (no props — always rendered unconditionally, visible on every screen including the Letter).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';

describe('WeatherWidget', () => {
  it('renders the temperature after a successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ current: { temperature_2m: 81.4 } }),
      })
    );

    render(<WeatherWidget />);

    expect(await screen.findByText('81°F')).toBeInTheDocument();
    expect(screen.getByText('Santorini')).toBeInTheDocument();
  });

  it('renders nothing if the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/WeatherWidget.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/WeatherWidget.tsx`**

The SVG paths below are the exact path data from `/Users/stevework/Desktop/noun-sun-376691.svg`.

```tsx
'use client';
import { useEffect, useState } from 'react';

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" className={className} fill="currentColor" aria-hidden="true">
      <path d="m1126.8 600c0-48-175.2-67.199-188.4-109.2-14.398-44.398 115.2-163.2 88.801-200.4-27.602-37.199-180 49.199-217.2 22.801-37.199-26.398-1.1992-199.2-45.602-213.6-44.402-14.402-116.4 145.2-164.4 145.2s-120-159.6-163.2-146.4c-44.398 14.398-8.3984 187.2-45.602 213.6-37.199 27.602-190.8-60-217.2-22.801s103.2 154.8 88.801 200.4c-14.402 43.199-189.6 62.398-189.6 110.4s175.2 67.199 188.4 109.2c14.398 44.398-115.2 163.2-88.801 200.4 27.602 37.199 180-49.199 217.2-22.801 37.199 26.398 1.1992 199.2 45.602 213.6 44.402 14.402 116.4-145.2 164.4-145.2s120 159.6 163.2 146.4c44.398-14.398 8.3984-187.2 45.602-213.6 37.199-27.602 190.8 60 217.2 22.801s-103.2-154.8-88.801-200.4c14.402-43.199 189.6-62.398 189.6-110.4zm-526.8 296.4c-163.2 0-296.4-132-296.4-296.4s132-296.4 296.4-296.4 296.4 132 296.4 296.4-133.2 296.4-296.4 296.4z" />
      <path d="m825.6 598.8c0 124.59-101.01 225.6-225.6 225.6s-225.6-101-225.6-225.6c0-124.6 101.01-225.6 225.6-225.6s225.6 101 225.6 225.6z" />
    </svg>
  );
}

const SANTORINI_LATITUDE = 36.3932;
const SANTORINI_LONGITUDE = 25.4615;

export async function fetchSantoriniTemperature(): Promise<number> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${SANTORINI_LATITUDE}&longitude=${SANTORINI_LONGITUDE}&current=temperature_2m&temperature_unit=fahrenheit`
  );
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.current.temperature_2m;
}

export default function WeatherWidget() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchSantoriniTemperature()
      .then(setTemperature)
      .catch(() => setFailed(true));
  }, []);

  if (failed || temperature === null) return null;

  return (
    <div className="fixed right-4 top-4 z-20 flex flex-col items-center text-cream">
      <SunGlyph className="h-7 w-7" />
      <span className="mt-1 text-sm font-bold">{Math.round(temperature)}°F</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-sage">Santorini</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/WeatherWidget.test.tsx`
Expected: PASS, both tests green.

- [ ] **Step 5: Wire into `app/page.tsx`**

Modify `app/page.tsx`: add the import and render line right after `<AboutIcon .../>` (unconditional — no `visible` prop, shown on every screen).

```tsx
import WeatherWidget from '@/components/WeatherWidget';
```

```tsx
      <Hero />
      <AboutIcon visible={moduleId !== 'letter'} />
      <WeatherWidget />
      {moduleId === 'letter' && <LetterModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/WeatherWidget.tsx components/WeatherWidget.test.tsx app/page.tsx
git commit -m "Add live Santorini weather widget"
```

---

### Task 5: I'm in / Can't make it — pill shape + legible unselected state

**Files:**
- Modify: `components/modules/OpeningModule.tsx`
- Modify: `components/modules/OpeningModule.test.tsx`

**Interfaces:**
- No interface changes — purely styling. `OpeningModuleProps` and the `canAdvanceFromOpening` delegation are unchanged.

- [ ] **Step 1: Write the failing test — add to `components/modules/OpeningModule.test.tsx`**

Add this test inside the existing `describe('OpeningModule', ...)` block:

```tsx
  it('renders the unselected attending buttons as legible cream pills', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    const imInButton = screen.getByRole('button', { name: /i'm in/i });
    expect(imInButton.className).toContain('rounded-full');
    expect(imInButton.className).toContain('bg-cream');
    expect(imInButton.className).toContain('text-navy');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: FAIL — current classes are `border border-teal text-teal`, not `rounded-full`/`bg-cream`/`text-navy`.

- [ ] **Step 3: Update the attending buttons in `components/modules/OpeningModule.tsx`**

Replace the two attending buttons:

```tsx
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: true })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === true ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: false, partySize: null })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === false ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          Can&apos;t make it
        </button>
```

with:

```tsx
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: true })}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: false, partySize: null })}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Can&apos;t make it
        </button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/modules/OpeningModule.tsx components/modules/OpeningModule.test.tsx
git commit -m "Make I'm in / Can't make it pill-shaped with a legible cream unselected state"
```

---

### Task 6: Party-size pill buttons

**Files:**
- Modify: `components/modules/OpeningModule.tsx`
- Modify: `components/modules/OpeningModule.test.tsx`

**Interfaces:**
- No changes to `OpeningModuleProps` or `DraftResponse` — `partySize` stays `number | null`, now only ever set to 1–6 via the pills instead of free numeric entry.

- [ ] **Step 1: Update the existing test that types into the old party-size input**

In `components/modules/OpeningModule.test.tsx`, replace the first test (it currently types into a party-size input that's being removed):

```tsx
  it('advances with name, attending, and party size filled in', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.type(screen.getByLabelText(/your name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.type(screen.getByLabelText(/party size/i), '2');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });
```

with:

```tsx
  it('advances with name, attending, and party size filled in', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.type(screen.getByLabelText(/your name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });
```

Also add a new test in the same `describe` block:

```tsx
  it('offers six party-size pills mapping to 1 through 6', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /i'm in/i }));

    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: FAIL — the party-size `<input>` still exists, there's no "Just me"/"+1" etc. buttons yet.

- [ ] **Step 3: Replace the party-size input with pill buttons in `components/modules/OpeningModule.tsx`**

Add this constant above the component (after the imports, before `interface OpeningModuleProps`):

```tsx
const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];
```

Replace the party-size block:

```tsx
      {local.attending === true && (
        <>
          <label htmlFor="partySize" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            Party size
          </label>
          <input
            id="partySize"
            type="number"
            min={1}
            className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
            value={local.partySize ?? ''}
            onChange={(event) =>
              setLocal({ ...local, partySize: event.target.value ? Number(event.target.value) : null })
            }
          />
        </>
      )}
```

with:

```tsx
      {local.attending === true && (
        <>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Party size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PARTY_SIZE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocal({ ...local, partySize: value })}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  local.partySize === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: PASS, all tests green.

- [ ] **Step 5: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/modules/OpeningModule.tsx components/modules/OpeningModule.test.tsx
git commit -m "Replace party-size number input with pill buttons (Just me, +1..+5)"
```

---

### Task 7: Required-field asterisks and legends

**Files:**
- Modify: `components/modules/OpeningModule.tsx`
- Modify: `components/modules/OpeningModule.test.tsx`
- Modify: `components/modules/HotelModule.tsx`
- Modify: `components/modules/HotelModule.test.tsx`
- Modify: `components/modules/DateWindowsModule.tsx`
- Modify: `components/modules/DateWindowsModule.test.tsx`
- Modify: `components/modules/TravelTimingModule.tsx`
- Modify: `components/modules/TravelTimingModule.test.tsx`

**Interfaces:** No interface changes — purely text/markup additions. Required fields map exactly to what each module's `canAdvanceFromX` validator (in `lib/flow.ts`, unchanged) already gates on.

- [ ] **Step 1: Write the failing tests**

Add to `components/modules/OpeningModule.test.tsx`:

```tsx
  it('shows a required-field legend and asterisks on Name and Are you coming?', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Your name *')).toBeInTheDocument();
    expect(screen.getByText('Are you coming? *')).toBeInTheDocument();
  });
```

Add to `components/modules/HotelModule.test.tsx` (inside the existing `describe` block):

```tsx
  it('shows a required-field legend and asterisk on the staying question', () => {
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Staying at the Adamastos Hotel? *')).toBeInTheDocument();
  });
```

Add to `components/modules/DateWindowsModule.test.tsx` (inside the existing `describe` block):

```tsx
  it('shows a required-field legend and asterisk on the heading', () => {
    render(<DateWindowsModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Which weeks could work? *')).toBeInTheDocument();
  });
```

Add to `components/modules/TravelTimingModule.test.tsx` (inside the existing `describe` block):

```tsx
  it('shows a required-field legend and asterisk on the heading', () => {
    render(<TravelTimingModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Traveling before or after Santorini? *')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/modules/OpeningModule.test.tsx components/modules/HotelModule.test.tsx components/modules/DateWindowsModule.test.tsx components/modules/TravelTimingModule.test.tsx`
Expected: FAIL — none of the asterisks or legends exist yet.

- [ ] **Step 3: Update `components/modules/OpeningModule.tsx`**

Replace:

```tsx
      <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-cream">
        Join us in Santorini
      </h1>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Your name
      </label>
```

with:

```tsx
      <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-cream">
        Join us in Santorini
      </h1>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-sage/70">*required</p>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Your name *
      </label>
```

Replace:

```tsx
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you coming?</p>
```

with:

```tsx
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you coming? *</p>
```

- [ ] **Step 4: Update `components/modules/HotelModule.tsx`**

Replace:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Staying at the Adamastos Hotel?
      </h2>
```

with:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Staying at the Adamastos Hotel? *
      </h2>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-sage/70">*required</p>
```

Replace:

```tsx
          <label htmlFor="hotelNights" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            How many nights?
          </label>
```

with:

```tsx
          <label htmlFor="hotelNights" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            How many nights? *
          </label>
```

- [ ] **Step 5: Update `components/modules/DateWindowsModule.tsx`**

Replace:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">Which weeks could work?</h2>
      <p className="mt-1 text-xs text-sage">Select all that apply — if more than one works, you can flag your favorite below.</p>
```

with:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">Which weeks could work? *</h2>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-sage/70">*required</p>
      <p className="mt-1 text-xs text-sage">Select all that apply — if more than one works, you can flag your favorite below.</p>
```

- [ ] **Step 6: Update `components/modules/TravelTimingModule.tsx`**

Replace:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Traveling before or after Santorini?
      </h2>
```

with:

```tsx
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Traveling before or after Santorini? *
      </h2>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-sage/70">*required</p>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run components/modules/OpeningModule.test.tsx components/modules/HotelModule.test.tsx components/modules/DateWindowsModule.test.tsx components/modules/TravelTimingModule.test.tsx`
Expected: PASS, all tests green.

- [ ] **Step 8: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add components/modules/OpeningModule.tsx components/modules/OpeningModule.test.tsx components/modules/HotelModule.tsx components/modules/HotelModule.test.tsx components/modules/DateWindowsModule.tsx components/modules/DateWindowsModule.test.tsx components/modules/TravelTimingModule.tsx components/modules/TravelTimingModule.test.tsx
git commit -m "Add required-field asterisks and legends across Opening/Hotel/DateWindows/TravelTiming"
```

---

### Task 8: Draggable OpeningModule panel

**Files:**
- Modify: `components/ModulePanel.tsx`
- Modify: `components/ModulePanel.test.tsx`
- Modify: `components/modules/OpeningModule.tsx`

**Interfaces:**
- Produces: `ModulePanel`'s props become `{ children: React.ReactNode, draggable?: boolean }` (default `false`) — every other module's `<ModulePanel>{...}</ModulePanel>` call is unaffected since the prop is optional and defaults to non-draggable.

- [ ] **Step 1: Write the failing tests — add to `components/ModulePanel.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModulePanel from './ModulePanel';

describe('ModulePanel', () => {
  it('renders its children', () => {
    render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('does not move when draggable is false, even if pointer events fire', () => {
    const { container } = render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 50, clientY: 50, pointerId: 1 });
    expect(panel.style.transform).toBe('');
  });

  it('moves within bounds when draggable is true', () => {
    const { container } = render(
      <ModulePanel draggable>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 40, clientY: 20, pointerId: 1 });
    expect(panel.style.transform).toBe('translate(40px, 20px)');
  });
});
```

Note: this replaces the entire existing `ModulePanel.test.tsx` file content (the original single test is preserved as the first `it` block above, with two new ones added).

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run components/ModulePanel.test.tsx`
Expected: first test PASSES (unchanged behavior), the two new tests FAIL — `ModulePanel` doesn't accept a `draggable` prop or handle pointer events yet.

- [ ] **Step 3: Add drag support to `components/ModulePanel.tsx`**

Replace the entire file:

```tsx
'use client';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface ModulePanelProps {
  children: React.ReactNode;
  draggable?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ModulePanel({ children, draggable = false }: ModulePanelProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable || !dragState.current) return;
    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    const maxX = window.innerWidth / 2 - 80;
    const maxY = window.innerHeight / 2 - 80;
    setOffset({
      x: clamp(dragState.current.originX + deltaX, -maxX, maxX),
      y: clamp(dragState.current.originY + deltaY, -maxY, maxY),
    });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={
          draggable
            ? { transform: `translate(${offset.x}px, ${offset.y}px)`, cursor: 'grab', touchAction: 'none' }
            : undefined
        }
        className="animate-module-in max-h-dvh w-full max-w-md overflow-y-auto border-l-4 border-terracotta bg-navy/[0.82] p-8 backdrop-blur-md"
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/ModulePanel.test.tsx`
Expected: PASS, all 3 tests green.

- [ ] **Step 5: Enable dragging on `OpeningModule`'s panel**

In `components/modules/OpeningModule.tsx`, change the opening `<ModulePanel>` tag to `<ModulePanel draggable>` and its closing tag stays `</ModulePanel>` (no other changes — this only affects the outer wrapper call).

- [ ] **Step 6: Run the full suite and verify the build**

Run: `npx vitest run`
Expected: all test files pass (previous count + 2 new ModulePanel tests).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/ModulePanel.tsx components/ModulePanel.test.tsx components/modules/OpeningModule.tsx
git commit -m "Make OpeningModule's panel draggable, bounded to the viewport"
```

---

### Task 9: Copy the provided icon SVGs into the repo, deploy

**Files:** none (asset placement + deployment only, no code changes)

- [ ] **Step 1: Confirm the SVG path data already embedded in Tasks 3 and 4 matches the source files**

Run: `diff <(grep -o 'm600[^"]*' /Users/stevework/Desktop/noun-about-4293177.svg) <(grep -o 'm600[^"]*' components/AboutIcon.tsx)`
Expected: no output (paths match) — this confirms the path data hand-copied into `AboutIcon.tsx` in Task 3 wasn't transcribed incorrectly. Do the same spot-check for the sun icon paths in `WeatherWidget.tsx` against `/Users/stevework/Desktop/noun-sun-376691.svg`.

- [ ] **Step 2: Run the full test suite one more time**

Run: `npx vitest run`
Expected: all test files passing.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `http://localhost:3000`, and confirm:
- The Letter screen appears first, full text visible, scrollable if needed.
- Clicking Next transitions to OpeningModule; the About icon appears in the upper-left and the weather widget is visible in the upper-right (and was already visible during the Letter screen).
- Clicking the About icon reopens the letter text in an overlay; closing it returns to the current module.
- I'm in / Can't make it and the party-size pills are pill-shaped, cream when unselected, terracotta when selected.
- Required-field asterisks and "*required" legends appear on Opening, Hotel, Date Windows, and Travel Timing.
- The OpeningModule panel can be dragged (mouse or touch) and stays within the viewport; releasing it leaves it in place rather than snapping back.
- The weather widget shows a real temperature for Santorini (network permitting) or disappears cleanly if the fetch fails (test by throttling/blocking network in devtools).

- [ ] **Step 4: Deploy**

Run (CLI logged into the `stevemarchese` personal account): `vercel --prod --yes`
Expected: build succeeds, deployment aliases to `santorini2027.com`.

- [ ] **Step 5: Commit if any manual-verification fixes were needed**

```bash
git add -A
git commit -m "Landing page updates: final verification fixes"
```

(Skip this commit if Step 3 found nothing to fix.)
