# Opening Quiz Gate — Design

**Date:** 2026-07-31
**Status:** Approved

## Goal

A playful "prove you know us" gate: the first time a guest interacts with the Opening module (clicking either attending pill, or typing the first character of their name), a full-screen overlay interrupts them with a single photo-ID question — "Who is this?" (Kiku, Steve & Andi's dog) — before they can continue. Wrong answers get a light teasing retry; there's no way to dismiss it except answering correctly, like a captcha.

Also, while touching `OpeningModule`: rename the "Your name" label to "NAME".

## Current state

- `components/Wizard.tsx` holds `moduleId`/`draft`/`history` state and conditionally renders each module (`{moduleId === 'opening' && <OpeningModule draft={draft} onAdvance={advance} />}`) — modules fully unmount when `moduleId` changes away and remount fresh if navigated back to, so any state local to a module component does NOT survive a round-trip through other modules.
- `components/modules/OpeningModule.tsx` — local `useState(draft)`, renders the name input, the two attending pills, and (once attending) party-size pills, with a disabled-until-valid Next button.
- `components/AboutIcon.tsx` is the only existing full-screen overlay pattern in the codebase: `fixed inset-0 z-30 flex items-center justify-center p-6` wrapping a `blob-panel` card (`border border-terracotta/40 bg-navy/[0.94] p-10 backdrop-blur-md`, plus `animate-module-in`).
- `public/kiku.jpg` (525×700, ~68KB, resized down from a 1.65MB source photo) is Kiku's photo, already added to the repo for this feature.

## Changes

### 1. New `components/QuizGate.tsx`

```tsx
interface QuizGateProps {
  onPass: () => void;
}
```

- Full-screen overlay, same visual pattern as `AboutIcon`'s modal (`fixed inset-0 z-40 ...`, one z-index above `AboutIcon`'s `z-30` so it always wins if both were somehow open) — `blob-panel` card, `border-terracotta/40 bg-navy/[0.94] p-10 backdrop-blur-md`, `animate-module-in`. **No close/X button anywhere** — this is deliberate, matching the "can't skip a captcha" framing.
- Shows Kiku's photo (`/kiku.jpg`) and the question "Who is this?" with four buttons in this fixed order: Cookie, Marshmallow, Kiku, Cloud Puff.
- Local state: `wrongAttempt: boolean`.
- Clicking "Kiku" calls `onPass()` (parent is responsible for closing the overlay — this component doesn't manage its own visibility).
- Clicking any other option sets `wrongAttempt = true`, showing a short teasing line ("Nice try — guess again!") below the buttons; the overlay stays open, all four buttons remain clickable (no lockout, no shuffling).

### 2. `components/modules/OpeningModule.tsx`

- New props: `quizPassed: boolean`, `onQuizPassed: () => void` (both supplied by `Wizard`, not owned locally — this is what makes the "only ask once per session, even across back-navigation" behavior work, since `Wizard` never unmounts).
- New local state: `showQuiz` (boolean, ephemeral — fine that it resets on remount, see reasoning below).
- A `maybeTriggerQuiz()` helper: `if (!quizPassed && !showQuiz) setShowQuiz(true)`. Called as the first line inside: the name `<input>`'s `onChange`, and both attending pills' `onClick` (before their existing logic — the field/button's own state update still happens normally afterward; triggering the quiz never blocks or discards the interaction that triggered it).
- Renders `{showQuiz && !quizPassed && <QuizGate onPass={() => { setShowQuiz(false); onQuizPassed(); }} />}` at the end of the component's JSX.
- Label rename: `Your name *` → `NAME *` (the `htmlFor`/`id="name"` pairing is unchanged, only the visible text changes).

**Why `showQuiz` doesn't need to be lifted too:** a guest can only leave the Opening module via a fully-enabled Next button, which requires name + attending (+ party size if attending) to already be filled in — and filling any of those necessarily already triggered and (to get this far) resolved the quiz. So by the time `Wizard` ever unmounts `OpeningModule`, `quizPassed` is already `true`, and `showQuiz`'s reset-on-remount is a no-op in practice.

### 3. `components/Wizard.tsx`

- New state: `const [quizPassed, setQuizPassed] = useState(false)`.
- Pass `quizPassed={quizPassed}` and `onQuizPassed={() => setQuizPassed(true)}` to `<OpeningModule>`.

## Testing

- `components/QuizGate.test.tsx` — new: renders the photo + question + four buttons; clicking "Kiku" calls `onPass`; clicking a wrong option shows the retry message and does NOT call `onPass`; after a wrong attempt, clicking "Kiku" still works (not locked out).
- `components/modules/OpeningModule.test.tsx` — update existing tests for the "NAME" label rename (`getByLabelText`/`getByText` patterns referencing "your name" text). Add new tests: typing the first character of the name shows the quiz overlay; clicking either attending pill shows the quiz overlay; passing the quiz (clicking Kiku) hides the overlay and lets the existing "advances with name/attending/party size" flow continue normally; when `quizPassed` is already `true` (prop), no interaction shows the overlay.
- `components/Wizard.test.tsx` — new file (none exists today): passing the quiz once (via simulated interaction through to Opening) and then navigating away and back to Opening does not show the quiz again. This is the one test that actually proves the cross-remount persistence this design's architecture exists for — without it, nothing catches a regression back to module-local state.

## Out of scope (YAGNI)

No additional questions (single question only, per explicit instruction). No persistence across a full page reload (sessionStorage, etc.) — passing during the current page session is enough; a hard refresh mid-RSVP is already a broader edge case the rest of the flow doesn't handle either. No shuffling of answer order or of which option is "correct" per load.
