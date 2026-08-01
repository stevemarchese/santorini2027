# Splash Screen + Custom Fonts + Wider Letter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new animated splash screen (Dirtyline title + subhead, "Tell Me More" CTA) as the first thing visitors see, ahead of the existing Letter → RSVP flow. Give the Letter module its own Dirtyline title and make it wider/centered on desktop. Replace Helvetica with Geist Sans as the site's body font everywhere.

**Architecture:** `lib/fonts.ts` centralizes both font loaders (`GeistSans` from the `geist` package, and a self-hosted `dirtyline` via `next/font/local`). A new `ModuleId` (`'splash'`) and `SplashModule` component slot in ahead of the existing flow; `ModulePanel` gains a `wide` prop so only the Letter module (not any RSVP-form module) gets the new wider/centered treatment.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4, `next/font/local`, the `geist` npm package (already installed).

## Global Constraints

- **`next/font/local` and `geist/font/sans` cannot be resolved by Vitest as-is** — confirmed by direct reproduction: importing them in a test throws `Directory import '.../next/font/local' is not supported resolving ES modules`, because these packages rely on a Next.js build-time transform that Vitest's Vite pipeline doesn't run. This is fixed by aliasing both module specifiers to lightweight mocks in `vitest.config.ts` (Task 1) — confirmed working via direct reproduction (166/166 passing with the alias in place, vs. an immediate resolution error without it). Do not remove this alias or "simplify" it away — without it, every test that imports anything from `lib/fonts.ts` (directly or transitively) will fail to even load.
- Dirtyline is used in exactly three places: the splash title, the splash subhead, and the Letter module's title. No other module heading changes font.
- The splash title's exact text and casing: `SAntOrIni! PaRT DeUx` (deliberately mixed-case — verbatim, do not "fix" the casing). Subhead: `twenty years in the making` (all lowercase). Letter title: `Time flies. Let's have fun.` (plain sentence case).
- Splash animation timings (verified live in a real browser during brainstorming, not to be altered): title slides up from `translateY(100%)`/`opacity: 0`, `0.7s cubic-bezier(0.25, 0.1, 0.25, 1)`, `0.3s` delay. Subhead fades/rises, `0.6s ease-out`, `1.1s` delay. CTA pops in (`0.5s ease-out`, `1.6s` delay) then bobs forever (`translateY` 0 → -6px → 0, `2s ease-in-out infinite`, starting at `2.1s`). **Every one of these animations must use CSS fill-mode `both`** (not just `forwards`) — `forwards` alone only holds the *end* state after the animation completes; without `both`, the element would flash visible at its bare (non-animated) style during the `animation-delay` window before the animation starts, which is not the intended effect.
- `ModulePanel`'s new `wide` prop, when `true`, uses `max-w-2xl` (672px, confirmed at this exact width in the live preview) and drops the existing responsive `ml-*` offset entirely (no `ml-0 sm:ml-[60px] ...` classes) so the panel is genuinely centered via the outer wrapper's existing `justify-center`. When `false` or omitted, behavior must be byte-for-byte identical to today (`max-w-md` + the full `ml-*` responsive scale) — every existing module that doesn't pass `wide` must be completely unaffected.
- `AboutIcon`'s `visible` prop extends from `moduleId !== 'letter'` to `moduleId !== 'letter' && moduleId !== 'splash'`.
- `OpeningModule`'s current heading is explicitly OUT of scope for this plan — do not touch it, even though it will read as duplicated with the new splash content. This is a deliberate, acknowledged, temporary state.

---

## File Structure

- `test-mocks/next-font-local.ts` — CREATE: mock for `next/font/local`.
- `test-mocks/geist-font-sans.ts` — CREATE: mock for `geist/font/sans`.
- `vitest.config.ts` — MODIFY: add the two aliases above.
- `lib/fonts.ts` — CREATE: `GeistSans` re-export + `dirtyline` local font loader.
- `app/layout.tsx` — MODIFY: apply `GeistSans.variable`.
- `app/globals.css` — MODIFY: `--font-sans` now references the Geist CSS variable; new splash keyframes/classes.
- `lib/types.ts` — MODIFY: `ModuleId` gains `'splash'`.
- `lib/flow.ts` — MODIFY: `getNextModule` gains `'splash' → 'letter'`.
- `lib/flow.test.ts` — MODIFY: add the new transition's test.
- `components/modules/SplashModule.tsx` — CREATE.
- `components/modules/SplashModule.test.tsx` — CREATE.
- `components/Wizard.tsx` — MODIFY: initial state, renders `SplashModule`, extends `AboutIcon` visibility.
- `components/Wizard.test.tsx` — MODIFY: existing test's entry point, plus one new test.
- `components/ModulePanel.tsx` — MODIFY: new `wide` prop.
- `components/ModulePanel.test.tsx` — MODIFY: add `wide`-prop tests.
- `components/modules/LetterModule.tsx` — MODIFY: `wide` prop passed through, new title.
- `components/modules/LetterModule.test.tsx` — MODIFY: add title/wide tests.

---

## Task 1: Font infrastructure (Geist + Dirtyline)

**Files:**
- Create: `test-mocks/next-font-local.ts`
- Create: `test-mocks/geist-font-sans.ts`
- Modify: `vitest.config.ts`
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the already-committed `app/fonts/dirtyline.woff2` font file, the already-installed `geist` npm package.
- Produces: `GeistSans` and `dirtyline` exported from `lib/fonts.ts` — `dirtyline` is consumed by Task 2's `SplashModule` and Task 3's `LetterModule`; `GeistSans` is consumed only by this task's `app/layout.tsx`.

This task has an unusual verification shape: there is no meaningful *behavior* to TDD here (it's font-loading configuration, not logic), so instead of writing a failing test first, this task's correctness is verified by (a) the existing 164-test suite continuing to pass once the Vitest aliases are in place, and (b) a real `npm run build` succeeding — since Vitest's mocks intentionally bypass the real Next.js font pipeline, only an actual Next.js build proves the real thing works end-to-end. This is a deliberate, justified exception, not a skipped step — do not invent a placeholder test.

- [ ] **Step 1: Create the two Vitest mocks**

Create `test-mocks/next-font-local.ts`:

```typescript
export default function localFont(options: { variable?: string }) {
  return {
    className: 'mock-local-font',
    variable: options.variable ?? '--font-mock',
    style: { fontFamily: 'mock-local-font' },
  };
}
```

Create `test-mocks/geist-font-sans.ts`:

```typescript
export const GeistSans = {
  className: 'mock-geist-sans',
  variable: '--font-geist-sans',
  style: { fontFamily: 'mock-geist-sans' },
};
```

- [ ] **Step 2: Add the aliases to `vitest.config.ts`**

Replace the entire contents of `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/.claude/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'next/font/local': path.resolve(__dirname, 'test-mocks/next-font-local.ts'),
      'geist/font/sans': path.resolve(__dirname, 'test-mocks/geist-font-sans.ts'),
    },
  },
});
```

- [ ] **Step 3: Create `lib/fonts.ts`**

```typescript
import { GeistSans } from 'geist/font/sans';
import localFont from 'next/font/local';

export { GeistSans };

export const dirtyline = localFont({
  src: '../app/fonts/dirtyline.woff2',
  variable: '--font-dirtyline',
  display: 'swap',
});
```

- [ ] **Step 4: Run the full suite to confirm nothing broke**

Run: `npx vitest run`
Expected: all 31 existing test files still pass, 164 tests, no change in count (this task adds no new tests — see the note above).

- [ ] **Step 5: Wire `GeistSans` into the root layout** — replace the entire contents of `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { GeistSans } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://santorini2027.com'),
  title: 'Santorini 2027',
  description: 'Join us in Santorini — July 2027',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="overflow-hidden bg-navy">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Update `--font-sans` in `app/globals.css`**

Find this line near the top of the file (inside the `@theme` block):

```css
  --font-sans: Helvetica, Arial, sans-serif;
```

Replace it with:

```css
  --font-sans: var(--font-geist-sans), Helvetica, Arial, sans-serif;
```

- [ ] **Step 7: Run the full suite again + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 164 tests passing (unchanged), tsc clean.

- [ ] **Step 8: Real build validation (the actual proof this works, since Vitest is mocked)**

Run: `npm run build`
Expected: build succeeds with no errors. This is the step that actually exercises the real Next.js font-loading pipeline (Vitest's mocks intentionally do not) — do not skip it or treat a clean `tsc`/`vitest` run as sufficient on its own for this task.

- [ ] **Step 9: Commit**

```bash
git add test-mocks vitest.config.ts lib/fonts.ts app/layout.tsx app/globals.css
git commit -m "Add Geist + Dirtyline font infrastructure"
```

---

## Task 2: `SplashModule` + flow wiring

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/flow.ts`
- Modify: `lib/flow.test.ts`
- Create: `components/modules/SplashModule.tsx`
- Create: `components/modules/SplashModule.test.tsx`
- Modify: `components/Wizard.tsx` (full rewrite)
- Modify: `components/Wizard.test.tsx` (full rewrite)
- Modify: `app/globals.css` (append splash keyframes)

**Interfaces:**
- Consumes: `dirtyline` from `lib/fonts.ts` (Task 1).
- Produces: `SplashModule` (props: `{ draft: DraftResponse; onAdvance: (updated: DraftResponse) => void }`, same shape as `LetterModule`'s), a new `'splash'` `ModuleId`, consumed by Task 3 only insofar as `Wizard.tsx`'s structure is now settled (Task 3 doesn't touch `Wizard.tsx` further).

- [ ] **Step 1: Add `'splash'` to `ModuleId`** — in `lib/types.ts`, change:

```typescript
export type ModuleId = 'letter' | 'opening' | 'hotel' | 'dateWindows' | 'travelTiming' | 'dinnerCruise' | 'closing';
```

to:

```typescript
export type ModuleId = 'splash' | 'letter' | 'opening' | 'hotel' | 'dateWindows' | 'travelTiming' | 'dinnerCruise' | 'closing';
```

- [ ] **Step 2: Write the failing test for the new transition** — in `lib/flow.test.ts`, add this test inside the existing `describe('getNextModule — letter', ...)` block (rename the describe block, or add a new one — your call, but keep it near the other `getNextModule` tests):

```typescript
  it('routes splash unconditionally to letter', () => {
    expect(getNextModule('splash', EMPTY_DRAFT)).toBe('letter');
  });
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run lib/flow.test.ts`
Expected: FAIL — `getNextModule` doesn't handle `'splash'` yet (TypeScript will also flag the switch statement as non-exhaustive once `'splash'` is added to the type, depending on how strictly it's configured — either way, the test fails).

- [ ] **Step 4: Add the `'splash'` case to `getNextModule`** — in `lib/flow.ts`, add this case to the switch statement (as the first case, before `'letter'`):

```typescript
    case 'splash':
      return 'letter';
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run lib/flow.test.ts`
Expected: PASS (16 tests — 15 existing + 1 new).

- [ ] **Step 6: Append the splash animation keyframes to `app/globals.css`**

Append at the end of the file:

```css
@keyframes splash-title-in {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-splash-title-in {
  animation: splash-title-in 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) 0.3s both;
}

@keyframes splash-subtitle-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-splash-subtitle-in {
  animation: splash-subtitle-in 0.6s ease-out 1.1s both;
}

@keyframes splash-cta-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes splash-cta-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.animate-splash-cta-in {
  animation: splash-cta-pop 0.5s ease-out 1.6s both, splash-cta-bob 2s ease-in-out 2.1s infinite;
}
```

- [ ] **Step 7: Write the failing test for `SplashModule`** — create `components/modules/SplashModule.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SplashModule from './SplashModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('SplashModule', () => {
  it('renders the title and subhead, and advances the unchanged draft on Tell Me More', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<SplashModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    expect(screen.getByText('SAntOrIni! PaRT DeUx')).toBeInTheDocument();
    expect(screen.getByText('twenty years in the making')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tell me more/i }));
    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
```

- [ ] **Step 8: Run to verify it fails**

Run: `npx vitest run components/modules/SplashModule.test.tsx`
Expected: FAIL — cannot resolve `./SplashModule`.

- [ ] **Step 9: Write `SplashModule`** — create `components/modules/SplashModule.tsx`:

```tsx
'use client';
import { dirtyline } from '@/lib/fonts';
import type { DraftResponse } from '@/lib/types';

interface SplashModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function SplashModule({ draft, onAdvance }: SplashModuleProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <span className="block overflow-hidden">
        <h1
          className={`${dirtyline.className} animate-splash-title-in text-[clamp(26px,5.5vw,58px)] leading-[1.15] text-cream`}
        >
          SAntOrIni! PaRT DeUx
        </h1>
      </span>
      <p
        className={`${dirtyline.className} animate-splash-subtitle-in mt-3 text-[clamp(14px,2.6vw,20px)] tracking-wide text-cream`}
      >
        twenty years in the making
      </p>
      <button
        type="button"
        onClick={() => onAdvance(draft)}
        className="animate-splash-cta-in mt-7 rounded-full bg-terracotta px-8 py-3 text-xs font-bold uppercase tracking-widest text-cream"
      >
        Tell Me More
      </button>
    </div>
  );
}
```

- [ ] **Step 10: Run to verify it passes**

Run: `npx vitest run components/modules/SplashModule.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 11: Write the failing tests for `Wizard`** — replace the entire contents of `components/Wizard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wizard from './Wizard';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content';

describe('Wizard', () => {
  it('starts on the splash screen and reveals the Letter module after Tell Me More', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);

    expect(screen.getByText('SAntOrIni! PaRT DeUx')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tell me more/i }));

    expect(screen.queryByText('SAntOrIni! PaRT DeUx')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeInTheDocument();
  });

  it('does not re-show the quiz gate after passing it once and navigating back to Opening', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);

    await user.click(screen.getByRole('button', { name: /tell me more/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.type(screen.getByLabelText(/^name/i), 'S');
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: 'Just me' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.click(screen.getByRole('button', { name: /back/i }));

    await user.type(screen.getByLabelText(/^name/i), 'teve');
    expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 12: Run to verify it fails**

Run: `npx vitest run components/Wizard.test.tsx`
Expected: FAIL — `Wizard` still starts at `'letter'`, so the splash text is never rendered and the first test's assertions fail; the second test's first click (`/tell me more/i`) also fails to find a matching button.

- [ ] **Step 13: Update `Wizard.tsx`** — replace the entire contents of `components/Wizard.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import AboutIcon from '@/components/AboutIcon';
import WeatherWidget from '@/components/WeatherWidget';
import SplashModule from '@/components/modules/SplashModule';
import LetterModule from '@/components/modules/LetterModule';
import OpeningModule from '@/components/modules/OpeningModule';
import HotelModule from '@/components/modules/HotelModule';
import DateWindowsModule from '@/components/modules/DateWindowsModule';
import TravelTimingModule from '@/components/modules/TravelTimingModule';
import DinnerCruiseModule from '@/components/modules/DinnerCruiseModule';
import ClosingModule from '@/components/modules/ClosingModule';
import { getNextModule } from '@/lib/flow';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse, ModuleId } from '@/lib/types';
import { splitParagraphs, type SiteContent } from '@/lib/site-content';

interface WizardProps {
  content: SiteContent;
}

export default function Wizard({ content }: WizardProps) {
  const [moduleId, setModuleId] = useState<ModuleId>('splash');
  const [draft, setDraft] = useState<DraftResponse>(EMPTY_DRAFT);
  const [history, setHistory] = useState<ModuleId[]>([]);
  const [quizPassed, setQuizPassed] = useState(false);

  const letterParagraphs = splitParagraphs(content.letter);

  function advance(updated: DraftResponse) {
    setDraft(updated);
    setHistory([...history, moduleId]);
    setModuleId(getNextModule(moduleId, updated));
  }

  function goBack() {
    if (history.length === 0) return;
    setModuleId(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  return (
    <main>
      <Hero />
      <AboutIcon visible={moduleId !== 'letter' && moduleId !== 'splash'} paragraphs={letterParagraphs} />
      <WeatherWidget />
      {moduleId === 'splash' && <SplashModule draft={draft} onAdvance={advance} />}
      {moduleId === 'letter' && <LetterModule draft={draft} paragraphs={letterParagraphs} onAdvance={advance} />}
      {moduleId === 'opening' && (
        <OpeningModule
          draft={draft}
          onAdvance={advance}
          quizPassed={quizPassed}
          onQuizPassed={() => setQuizPassed(true)}
        />
      )}
      {moduleId === 'hotel' && <HotelModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'dateWindows' && <DateWindowsModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'travelTiming' && <TravelTimingModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'dinnerCruise' && <DinnerCruiseModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'closing' && (
        <ClosingModule
          draft={draft}
          onBack={goBack}
          confirmationAttending={content.confirmationAttending}
          confirmationNotAttending={content.confirmationNotAttending}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 14: Run to verify it passes**

Run: `npx vitest run components/Wizard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 15: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (167 total: 164 after Task 1 + 3 new — 1 in `flow.test.ts`, 1 in `SplashModule.test.tsx`, and `Wizard.test.tsx` net +1 since it went from 1 test to 2); tsc reports no errors.

- [ ] **Step 16: Commit**

```bash
git add lib/types.ts lib/flow.ts lib/flow.test.ts components/modules/SplashModule.tsx components/modules/SplashModule.test.tsx components/Wizard.tsx components/Wizard.test.tsx app/globals.css
git commit -m "Add SplashModule as the new first screen in the RSVP flow"
```

---

## Task 3: `ModulePanel` wide prop + `LetterModule` title/width

**Files:**
- Modify: `components/ModulePanel.tsx` (full rewrite)
- Modify: `components/ModulePanel.test.tsx`
- Modify: `components/modules/LetterModule.tsx` (full rewrite)
- Modify: `components/modules/LetterModule.test.tsx`

**Interfaces:**
- Consumes: `dirtyline` from `lib/fonts.ts` (Task 1).
- Produces: `ModulePanel`'s new `wide?: boolean` prop, consumed only by `LetterModule` in this plan (every other module's call site is unchanged and continues to omit `wide`).

- [ ] **Step 1: Write the failing tests for `ModulePanel`'s `wide` prop** — append these two tests inside the existing `describe('ModulePanel', ...)` block in `components/ModulePanel.test.tsx` (anywhere is fine, e.g. right after the `'renders its children'` test):

```typescript
  it('uses max-w-2xl with no responsive left offset when wide is true', () => {
    const { container } = render(
      <ModulePanel wide>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-2xl');
    expect(panel.className).not.toContain('max-w-md');
    expect(panel.className).not.toContain('ml-[60px]');
  });

  it("keeps today's max-w-md and offset classes when wide is omitted", () => {
    const { container } = render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-md');
    expect(panel.className).toContain('sm:ml-[60px]');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/ModulePanel.test.tsx`
Expected: FAIL — `ModulePanel` doesn't accept a `wide` prop yet, and always renders the `max-w-md` + offset classes.

- [ ] **Step 3: Update `ModulePanel.tsx`** — replace the entire contents:

```tsx
'use client';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface ModulePanelProps {
  children: React.ReactNode;
  draggable?: boolean;
  wide?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const INTERACTIVE_SELECTOR = 'input, button, textarea, select, a, label';
const MOBILE_BREAKPOINT_PX = 640;

export default function ModulePanel({ children, draggable = false, wide = false }: ModulePanelProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable) return;
    if (window.innerWidth < MOBILE_BREAKPOINT_PX) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
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
    setIsDragging(false);
  }

  const widthClasses = wide
    ? 'max-w-2xl'
    : 'max-w-md ml-0 sm:ml-[60px] md:ml-[140px] lg:ml-[220px] xl:ml-[320px] 2xl:ml-[380px]';

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={
          draggable
            ? {
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: isDragging ? 'none' : undefined,
              }
            : undefined
        }
        className={`animate-module-in blob-panel min-h-0 max-h-dvh w-full overflow-y-auto border border-terracotta/40 bg-navy/[0.82] p-10 backdrop-blur-md ${widthClasses}`}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run components/ModulePanel.test.tsx`
Expected: PASS (8 tests — 6 existing + 2 new). The 6 pre-existing tests must pass unchanged — they query via `.animate-module-in` and check `.style.transform`, neither of which is affected by the class-string reordering in this rewrite.

- [ ] **Step 5: Write the failing tests for `LetterModule`** — append these two tests inside the existing `describe('LetterModule', ...)` block in `components/modules/LetterModule.test.tsx`:

```typescript
  it('renders the Dirtyline title above the letter paragraphs', () => {
    render(<LetterModule draft={EMPTY_DRAFT} paragraphs={['A paragraph.']} onAdvance={vi.fn()} />);
    expect(screen.getByText("Time flies. Let's have fun.")).toBeInTheDocument();
  });

  it('renders inside a wide ModulePanel', () => {
    const { container } = render(
      <LetterModule draft={EMPTY_DRAFT} paragraphs={['A paragraph.']} onAdvance={vi.fn()} />
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-2xl');
  });
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: FAIL — no title renders yet, and the panel is still `max-w-md`.

- [ ] **Step 7: Update `LetterModule.tsx`** — replace the entire contents:

```tsx
'use client';
import ModulePanel from '@/components/ModulePanel';
import { dirtyline } from '@/lib/fonts';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel draggable wide>
      <h1 className={`${dirtyline.className} text-xl text-cream`}>Time flies. Let&apos;s have fun.</h1>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
          {paragraph}
        </p>
      ))}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onAdvance(draft)}
          className="text-sm font-semibold uppercase tracking-wide text-sage"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: PASS (3 tests — 1 existing + 2 new).

- [ ] **Step 9: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (171 total: 167 after Task 2 + 4 new — 2 in `ModulePanel.test.tsx`, 2 in `LetterModule.test.tsx`); tsc reports no errors.

- [ ] **Step 10: Commit**

```bash
git add components/ModulePanel.tsx components/ModulePanel.test.tsx components/modules/LetterModule.tsx components/modules/LetterModule.test.tsx
git commit -m "Add ModulePanel wide prop; widen and retitle the Letter module"
```

---

## Local Preview

`npm run dev`, visit `http://localhost:3000`. Confirm: the splash screen appears first (Dirtyline title/subhead animate in, "Tell Me More" bobs), clicking it reveals a wider, centered Letter module with its own Dirtyline title, and the rest of the flow (Opening onward) is unchanged apart from now using Geist for all body text instead of Helvetica. Also confirm the quiz gate still works exactly as before (unaffected by this plan).

---

## Self-Review Notes

- **Spec coverage:** splash screen (title/subhead/CTA text, casing, animation timings) — Task 2; Dirtyline scoped to exactly 3 places (splash title, splash subhead, Letter title) — Tasks 2 and 3; wider/centered Letter via `ModulePanel`'s new `wide` prop, every other module unaffected — Task 3; Geist Sans site-wide via `--font-sans` — Task 1; `OpeningModule` heading explicitly untouched — confirmed no task modifies `components/modules/OpeningModule.tsx`. All covered.
- **The Vitest/next-font incompatibility is the single riskiest detail in this plan** — it was independently reproduced and the fix verified (not guessed) before this plan was written; Task 1's Global Constraints call it out explicitly so it isn't "fixed" a second time or misdiagnosed as a different bug if it resurfaces.
- **Type consistency:** `dirtyline`/`GeistSans` (Task 1, `lib/fonts.ts`) are imported identically in Task 2's `SplashModule.tsx` and Task 3's `LetterModule.tsx`. `ModulePanel`'s `wide?: boolean` (Task 3) has exactly one consumer in this plan (`LetterModule`), and every other existing call site is deliberately left unchanged.
- **Sequencing:** Task 2 and Task 3 both depend on Task 1 (`lib/fonts.ts`) but not on each other — they could theoretically run in parallel, but this plan sequences them 1 → 2 → 3 for simplicity since both still touch `app/globals.css`.
- **Fill-mode `both` requirement** for all three splash animations is called out twice (Global Constraints and Task 2's Step 6) since it's an easy detail to drop silently and the resulting bug (a flash of unstyled content before each delayed animation starts) would not be caught by any of this plan's tests — jsdom doesn't execute real CSS animations, so this can only be caught by an actual visual check per the Local Preview section.
