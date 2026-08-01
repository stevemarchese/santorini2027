# Opening Quiz Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-question "prove you know us" overlay that interrupts the first interaction with the Opening module (typing a name character, or clicking either attending pill), gated behind a photo-ID question about Kiku (Steve & Andi's dog), with no way to dismiss it except answering correctly. Also rename the "Your name" label to "NAME".

**Architecture:** A new standalone `QuizGate` component owns the overlay UI and its own wrong/right-answer state, but not its own visibility — the parent decides when to render it. `OpeningModule` gets a `showQuiz` local trigger (fine to reset on remount) gated by a `quizPassed` boolean that's lifted all the way up to `Wizard` (the one component in this tree that never unmounts as the user navigates between modules), so passing the quiz once persists for the rest of the session even across Back navigation.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4.

## Global Constraints

- `QuizGate` has no close/X button and no way to dismiss except clicking the correct answer ("Kiku") — this is deliberate ("like a captcha").
- A wrong answer shows a retry message but never blocks re-attempting, never locks out any option, never shuffles anything.
- `QuizGate` must render as a **sibling** of `ModulePanel` inside `OpeningModule`'s returned JSX (via a Fragment), **not** as a child inside `ModulePanel`. `ModulePanel`'s draggable inner div always has an inline `transform` style applied whenever `draggable` is true (even at rest, `translate(0px, 0px)`), and a CSS `transform` on an ancestor creates a new containing block for `position: fixed` descendants — nesting `QuizGate` inside it would make its `fixed inset-0` resolve relative to the small panel box instead of the viewport, breaking the full-screen overlay.
- `QuizGate`'s overlay uses `z-40` (one above `AboutIcon`'s existing `z-30` overlay) so it always wins if both were ever open at once.
- The answer options render in this fixed order every time: Cookie, Marshmallow, Kiku, Cloud Puff.
- `quizPassed`/`onQuizPassed` are required props on `OpeningModule` (not optional with a default) — `Wizard` always supplies them, matching how `onAdvance` is already a required prop.

---

## File Structure

- `components/QuizGate.tsx` — CREATE: the overlay itself.
- `components/QuizGate.test.tsx` — CREATE.
- `public/kiku.jpg` — already added (committed with the design spec).
- `components/modules/OpeningModule.tsx` — MODIFY: label rename, quiz trigger wiring, new required props.
- `components/modules/OpeningModule.test.tsx` — MODIFY: update label-dependent queries, add quiz-gate tests.
- `components/Wizard.tsx` — MODIFY: lift `quizPassed` state, pass it + `onQuizPassed` to `OpeningModule`.
- `components/Wizard.test.tsx` — CREATE (no file exists today): the one test that proves the cross-remount persistence this architecture exists for.

---

## Task 1: `QuizGate` component

**Files:**
- Create: `components/QuizGate.tsx`
- Create: `components/QuizGate.test.tsx`

**Interfaces:**
- Consumes: nothing external — pure, self-contained, no props besides `onPass`.
- Produces: default-exported `QuizGate` component with `interface QuizGateProps { onPass: () => void }`, consumed by Task 2's `OpeningModule.tsx`.

- [ ] **Step 1: Write the failing test** — create `components/QuizGate.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizGate from './QuizGate';

describe('QuizGate', () => {
  it('renders the photo, question, and four answer options in order', () => {
    render(<QuizGate onPass={vi.fn()} />);
    expect(screen.getByAltText(/dog/i)).toBeInTheDocument();
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Cookie', 'Marshmallow', 'Kiku', 'Cloud Puff']);
  });

  it('calls onPass when the correct answer is clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onPass).toHaveBeenCalled();
  });

  it('shows a retry message and does not call onPass when a wrong answer is clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Cookie' }));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByText(/guess again/i)).toBeInTheDocument();
  });

  it('still accepts the correct answer after a prior wrong attempt', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Marshmallow' }));
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onPass).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/QuizGate.test.tsx`
Expected: FAIL — cannot resolve `./QuizGate`.

- [ ] **Step 3: Write the implementation** — create `components/QuizGate.tsx`

```tsx
'use client';
import { useState } from 'react';

const OPTIONS = ['Cookie', 'Marshmallow', 'Kiku', 'Cloud Puff'];
const CORRECT_ANSWER = 'Kiku';

interface QuizGateProps {
  onPass: () => void;
}

export default function QuizGate({ onPass }: QuizGateProps) {
  const [wrongAttempt, setWrongAttempt] = useState(false);

  function handleAnswer(option: string) {
    if (option === CORRECT_ANSWER) {
      onPass();
    } else {
      setWrongAttempt(true);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="animate-module-in blob-panel relative max-h-dvh w-full max-w-md overflow-y-auto border border-terracotta/40 bg-navy/[0.94] p-10 backdrop-blur-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-sage">Quick check</p>
        <h2 className="mt-1 text-xl font-bold uppercase tracking-wide text-cream">Who is this?</h2>
        <img src="/kiku.jpg" alt="A fluffy white dog" className="mt-4 w-full rounded object-cover" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy"
            >
              {option}
            </button>
          ))}
        </div>
        {wrongAttempt && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-terracotta">
            Nice try — guess again!
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/QuizGate.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (152 + 4 = 156); tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/QuizGate.tsx components/QuizGate.test.tsx
git commit -m "Add QuizGate overlay component"
```

---

## Task 2: Wire the quiz trigger into `OpeningModule`

**Files:**
- Modify: `components/modules/OpeningModule.tsx` (full rewrite)
- Modify: `components/modules/OpeningModule.test.tsx` (full rewrite)

**Interfaces:**
- Consumes: `QuizGate` (Task 1), with its exact `{ onPass }` prop.
- Produces: `OpeningModule` gains two new required props, `quizPassed: boolean` and `onQuizPassed: () => void`, consumed by Task 3's `Wizard.tsx`.

- [ ] **Step 1: Write the failing tests** — replace the entire contents of `components/modules/OpeningModule.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpeningModule from './OpeningModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('OpeningModule', () => {
  it('advances with name, attending, and party size filled in', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });

  it('disables Next until required fields are filled', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
  });

  it('renders the unselected attending buttons as legible cream pills', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    const imInButton = screen.getByRole('button', { name: /i'm in/i });
    expect(imInButton.className).toContain('rounded-full');
    expect(imInButton.className).toContain('bg-cream');
    expect(imInButton.className).toContain('text-navy');
  });

  it('offers six party-size pills mapping to 1 through 6', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /i'm in/i }));

    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });

  it('shows a required-field legend and asterisks on Name and Are you planning on coming?', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('NAME *')).toBeInTheDocument();
    expect(screen.getByText('Are you planning on coming? *')).toBeInTheDocument();
  });

  it('shows an asterisk on the crew-size question once attending is true', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    expect(screen.getByText('How many in your crew? *')).toBeInTheDocument();
  });

  describe('quiz gate', () => {
    it('shows the quiz overlay after the first character typed in the name field', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      await user.type(screen.getByLabelText(/^name/i), 'S');
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('shows the quiz overlay when either attending pill is clicked', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /can't make it/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('hides the overlay and calls onQuizPassed once the correct answer is picked, without losing the in-progress name', async () => {
      const user = userEvent.setup();
      const onQuizPassed = vi.fn();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={onQuizPassed} />);
      const name = screen.getByLabelText(/^name/i);
      await user.type(name, 'S');
      await user.click(screen.getByRole('button', { name: 'Kiku' }));
      expect(onQuizPassed).toHaveBeenCalled();
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      expect(name).toHaveValue('S');
    });

    it('never shows the overlay when quizPassed is already true', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
      await user.type(screen.getByLabelText(/^name/i), 'Steve');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: FAIL — `quizPassed`/`onQuizPassed` are not accepted props yet (TypeScript), label text is still "Your name \*" not "NAME \*", and no quiz overlay exists.

- [ ] **Step 3: Write the implementation** — replace the entire contents of `components/modules/OpeningModule.tsx`:

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import QuizGate from '@/components/QuizGate';
import { canAdvanceFromOpening } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];

interface OpeningModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function OpeningModule({ draft, onAdvance, quizPassed, onQuizPassed }: OpeningModuleProps) {
  const [local, setLocal] = useState(draft);
  const [showQuiz, setShowQuiz] = useState(false);

  function maybeTriggerQuiz() {
    if (!quizPassed && !showQuiz) setShowQuiz(true);
  }

  return (
    <>
      <ModulePanel draggable>
        <h1 className="text-xl font-bold uppercase tracking-wide text-cream">
          Join us in Santorini
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-cream/70">
          20 years — 2007 to 2027
        </p>
        <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
          NAME *
        </label>
        <input
          id="name"
          className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
          value={local.name}
          onChange={(event) => {
            maybeTriggerQuiz();
            setLocal({ ...local, name: event.target.value });
          }}
        />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you planning on coming? *</p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => {
              maybeTriggerQuiz();
              setLocal({ ...local, attending: true });
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
              local.attending === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
            }`}
          >
            I&apos;m in
          </button>
          <button
            type="button"
            onClick={() => {
              maybeTriggerQuiz();
              setLocal({ ...local, attending: false, partySize: null });
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
              local.attending === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
            }`}
          >
            Can&apos;t make it
          </button>
        </div>
        {local.attending === true && (
          <>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">How many in your crew? *</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {PARTY_SIZE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocal({ ...local, partySize: value })}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                    local.partySize === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
          <button
            type="button"
            onClick={() => onAdvance(local)}
            disabled={!canAdvanceFromOpening(local)}
            className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
          >
            Next <span className="animate-arrow-bob">→</span>
          </button>
        </div>
      </ModulePanel>
      {showQuiz && !quizPassed && (
        <QuizGate
          onPass={() => {
            setShowQuiz(false);
            onQuizPassed();
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: PASS (10 tests — 6 existing + 4 new quiz-gate tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (156 + 4 = 160, since the test file went from 6 tests to 10 — net +4); tsc reports no errors (this step will also catch it if `Wizard.tsx` — not yet updated — fails to compile because it doesn't pass the new required props; if so, that's expected until Task 3, and is fine to leave failing between tasks, but `Wizard.tsx` is a separate file from what `tsc` needs to pass for `OpeningModule`'s own module to typecheck correctly in isolation — if `tsc --noEmit` reports an error in `Wizard.tsx` at this point, that is expected and will be resolved in Task 3, not a sign this task's work is wrong).

- [ ] **Step 6: Commit**

```bash
git add components/modules/OpeningModule.tsx components/modules/OpeningModule.test.tsx
git commit -m "Wire the quiz gate trigger into OpeningModule, rename Your name to NAME"
```

---

## Task 3: Lift `quizPassed` state into `Wizard`

**Files:**
- Modify: `components/Wizard.tsx` (full rewrite)
- Create: `components/Wizard.test.tsx`

**Interfaces:**
- Consumes: `OpeningModule`'s new `quizPassed`/`onQuizPassed` props (Task 2).
- Produces: no new exports — `Wizard` is already the top-level component `app/page.tsx` (or equivalent) renders with the same `{ content }` prop signature, unchanged.

- [ ] **Step 1: Write the failing test** — create `components/Wizard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wizard from './Wizard';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content';

describe('Wizard', () => {
  it('does not re-show the quiz gate after passing it once and navigating back to Opening', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Wizard.test.tsx`
Expected: FAIL — `OpeningModule` requires `quizPassed`/`onQuizPassed` props that `Wizard` doesn't yet pass (TypeScript compile error surfaces as a test run failure).

- [ ] **Step 3: Write the implementation** — replace the entire contents of `components/Wizard.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import AboutIcon from '@/components/AboutIcon';
import WeatherWidget from '@/components/WeatherWidget';
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
  const [moduleId, setModuleId] = useState<ModuleId>('letter');
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
      <AboutIcon visible={moduleId !== 'letter'} paragraphs={letterParagraphs} />
      <WeatherWidget />
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Wizard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (160 + 1 = 161); tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/Wizard.tsx components/Wizard.test.tsx
git commit -m "Lift quizPassed state into Wizard so the quiz gate only shows once per session"
```

---

## Local Preview

`npm run dev`, visit `http://localhost:3000`, click through the letter, then type a single character into the NAME field (or click either attending pill) — the Kiku quiz should appear immediately. Click a wrong answer to see the retry message, then click Kiku to dismiss and continue. Advance to Hotel, click Back, and confirm interacting with Opening again does not re-trigger the quiz.

---

## Self-Review Notes

- **Spec coverage:** single-question overlay with Kiku's photo and the four named options in fixed order (Task 1); trigger on first name keystroke or either attending pill, no dismissal but correct answer, playful non-blocking wrong-answer retry (Task 2); NAME label rename (Task 2); cross-remount persistence via lifting state to `Wizard` (Task 3), with a real test proving it. All covered.
- **The transform/fixed-positioning pitfall is the single riskiest detail in this plan** — called out explicitly in Global Constraints and reflected in Task 2's implementation using a Fragment (`<>...</>`) with `QuizGate` as a sibling of `ModulePanel`, not nested inside it.
- **Type consistency:** `QuizGateProps { onPass: () => void }` (Task 1) is referenced identically in Task 2's `OpeningModule.tsx`. `OpeningModule`'s new `quizPassed`/`onQuizPassed` props (Task 2) are referenced identically in Task 3's `Wizard.tsx`.
- **Sequencing:** Task 2 will leave `tsc --noEmit` failing on `Wizard.tsx` until Task 3 lands (since `Wizard.tsx` won't yet pass the new required props to `OpeningModule`) — this is expected and explicitly called out in Task 2's Step 5 so it isn't mistaken for a Task 2 defect.
