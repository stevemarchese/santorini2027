# Santorini 2027 Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static "coming soon" teaser at santorini2027.com with the full sequential-module RSVP experience described in `docs/superpowers/specs/2026-07-29-santorini2027-site-design.md`.

**Architecture:** Next.js 16 App Router client-driven state machine (`app/page.tsx`) renders one full-viewport "module" at a time over a persistent video backdrop, driven by a pure `getNextModule` function. Final submission POSTs to a server route that validates, inserts into Supabase via a service-role client, and sends a Resend notification email. `/admin` is a server component gated by a hashed-password cookie.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (`@supabase/supabase-js`), Resend, Vitest + React Testing Library.

## Global Constraints

- No page scroll anywhere in the flow — fixed viewport, modules swap in place (spec: Structure & Interaction Model).
- Hero video plays once and does **not** loop — holds on its final frame (spec: Structure & Interaction Model).
- Open link, no personalization/pre-fill (spec: Structure & Interaction Model).
- Palette (exact, from spec): navy `#082534`, terracotta `#8A5233`, teal `#265F6E`, cream `#DED5BD`, sage `#9FB3AF`.
- Typography: Helvetica/Arial, bold, uppercase, tight letter-spacing for headlines/CTAs.
- Module sequence and branching exactly as in spec's "Module Flow" diagram.
- `responses` table schema exactly as in spec's "Data Model" table.
- Deploys to the existing Vercel project `santorini2027`, personal scope `steve-marcheses-projects`, domain `santorini2027.com` — replaces the static site, does not stand up a new one.

---

## File Structure

```
santorini2027-teaser/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, vitest.setup.ts
  .env.local.example
  app/
    layout.tsx, globals.css, page.tsx
    api/submit/route.ts (+ route.test.ts)
    api/admin/login/route.ts (+ route.test.ts)
    admin/page.tsx
  components/
    Hero.tsx (+ .test.tsx), ModulePanel.tsx (+ .test.tsx)
    AdminLoginForm.tsx (+ .test.tsx), ResponsesTable.tsx (+ .test.tsx)
    modules/OpeningModule.tsx, HotelModule.tsx, DateWindowsModule.tsx,
      TravelTimingModule.tsx, DinnerCruiseModule.tsx, ClosingModule.tsx (each + .test.tsx)
  lib/
    types.ts, flow.ts (+ flow.test.ts), payload.ts (+ payload.test.ts),
    email.ts (+ email.test.ts), admin-auth.ts (+ admin-auth.test.ts),
    supabase-admin.ts (+ supabase-admin.test.ts), resend-client.ts
  supabase/migrations/0001_create_responses.sql
  public/santorini_2027.mp4
```

Old `index.html` is removed — this repo becomes the real app, not a separate project.

---

### Task 1: Project scaffold + design tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `.env.local.example`
- Create: `app/layout.tsx`, `app/globals.css`
- Modify: `.gitignore` (add `node_modules`, `.next`)
- Delete: `index.html`
- Move: `santorini_2027.mp4` → `public/santorini_2027.mp4`

**Interfaces:**
- Produces: Tailwind theme tokens `bg-navy`, `text-cream`, `text-sage`, `bg-terracotta`, `border-terracotta`, `text-teal`, `border-teal` (and `/[opacity]` variants) available to every later component; `.animate-module-in` CSS class for module entrance motion.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "santorini2027",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.6.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.ts`, `postcss.config.mjs`**

`next.config.ts`:
```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 4: Write `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Write `app/globals.css` with the design tokens**

```css
@import "tailwindcss";

@theme {
  --color-navy: #082534;
  --color-terracotta: #8A5233;
  --color-teal: #265F6E;
  --color-cream: #DED5BD;
  --color-sage: #9FB3AF;
}

@keyframes module-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-module-in {
  animation: module-in 350ms ease-out;
}
```

- [ ] **Step 6: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Santorini 2027',
  description: 'Join us in Santorini — July 2027',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden bg-navy">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Move the video, delete the old teaser, write `.env.local.example`**

```bash
mkdir -p public
git mv santorini_2027.mp4 public/santorini_2027.mp4
git rm index.html
```

`.env.local.example`:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
NOTIFY_EMAIL=steve.marchese@gmail.com
ADMIN_PASSWORD=
```

- [ ] **Step 8: Add `.gitignore` entries and install**

Modify `.gitignore` to include:
```
node_modules
.next
```

Run: `npm install`
Expected: installs without error, creates `package-lock.json`.

- [ ] **Step 9: Verify the scaffold builds**

Run: `npm run build`
Expected: build fails complaining `app/page.tsx` is missing a default export (expected — page.tsx doesn't exist yet). This confirms Next.js, Tailwind, and TypeScript are wired correctly up to that point.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 16 + Tailwind 4 app, remove static teaser"
```

---

### Task 2: Shared types + flow state logic

**Files:**
- Create: `lib/types.ts`
- Create: `lib/flow.ts`
- Test: `lib/flow.test.ts`

**Interfaces:**
- Produces: `DraftResponse`, `ModuleId`, `WindowKey` types and `EMPTY_DRAFT` constant (consumed by every module component and the submit route); `getNextModule`, `canAdvanceFromOpening`, `canAdvanceFromHotel`, `canAdvanceFromDateWindows`, `canAdvanceFromTravelTiming`, `toggleWindow`, `setWindowPriority` (consumed by modules 4–9).

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export type ModuleId = 'opening' | 'hotel' | 'dateWindows' | 'travelTiming' | 'dinnerCruise' | 'closing';

export type WindowKey = 'window_1' | 'window_2' | 'window_3';

export interface DraftResponse {
  name: string;
  attending: boolean | null;
  partySize: number | null;
  hotelStaying: boolean | null;
  hotelNights: number | null;
  window1Selected: boolean;
  window2Selected: boolean;
  window3Selected: boolean;
  windowPriority: WindowKey | null;
  travelTiming: 'before' | 'after' | 'both' | 'neither' | null;
  travelNote: string;
  dinnerInterested: boolean;
  cruiseInterested: boolean;
  note: string;
}

export const EMPTY_DRAFT: DraftResponse = {
  name: '',
  attending: null,
  partySize: null,
  hotelStaying: null,
  hotelNights: null,
  window1Selected: false,
  window2Selected: false,
  window3Selected: false,
  windowPriority: null,
  travelTiming: null,
  travelNote: '',
  dinnerInterested: false,
  cruiseInterested: false,
  note: '',
};
```

- [ ] **Step 2: Write the failing test `lib/flow.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  getNextModule,
  canAdvanceFromOpening,
  canAdvanceFromHotel,
  canAdvanceFromDateWindows,
  canAdvanceFromTravelTiming,
  toggleWindow,
  setWindowPriority,
} from './flow';
import { EMPTY_DRAFT } from './types';

describe('getNextModule', () => {
  it('routes attending=true from opening to hotel', () => {
    expect(getNextModule('opening', { ...EMPTY_DRAFT, attending: true })).toBe('hotel');
  });

  it('routes attending=false from opening straight to closing', () => {
    expect(getNextModule('opening', { ...EMPTY_DRAFT, attending: false })).toBe('closing');
  });

  it('walks the full attending path in order', () => {
    expect(getNextModule('hotel', EMPTY_DRAFT)).toBe('dateWindows');
    expect(getNextModule('dateWindows', EMPTY_DRAFT)).toBe('travelTiming');
    expect(getNextModule('travelTiming', EMPTY_DRAFT)).toBe('dinnerCruise');
    expect(getNextModule('dinnerCruise', EMPTY_DRAFT)).toBe('closing');
  });
});

describe('canAdvanceFromOpening', () => {
  it('requires a name and an attending answer', () => {
    expect(canAdvanceFromOpening(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toBe(true);
  });

  it('requires party size when attending', () => {
    expect(canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: true })).toBe(false);
    expect(
      canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 })
    ).toBe(true);
  });
});

describe('canAdvanceFromHotel', () => {
  it('requires nights only when staying', () => {
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: false })).toBe(true);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true })).toBe(false);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, hotelNights: 3 })).toBe(true);
  });
});

describe('canAdvanceFromDateWindows', () => {
  it('requires at least one window selected', () => {
    expect(canAdvanceFromDateWindows(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromDateWindows({ ...EMPTY_DRAFT, window2Selected: true })).toBe(true);
  });
});

describe('canAdvanceFromTravelTiming', () => {
  it('requires a selection', () => {
    expect(canAdvanceFromTravelTiming(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromTravelTiming({ ...EMPTY_DRAFT, travelTiming: 'both' })).toBe(true);
  });
});

describe('toggleWindow', () => {
  it('auto-sets priority when exactly one window is selected', () => {
    const updated = toggleWindow(EMPTY_DRAFT, 'window_2');
    expect(updated.window2Selected).toBe(true);
    expect(updated.windowPriority).toBe('window_2');
  });

  it('clears priority when its window is deselected', () => {
    const oneSelected = toggleWindow(EMPTY_DRAFT, 'window_2');
    const deselected = toggleWindow(oneSelected, 'window_2');
    expect(deselected.window2Selected).toBe(false);
    expect(deselected.windowPriority).toBeNull();
  });

  it('does not overwrite an existing priority when a second window is added', () => {
    const first = toggleWindow(EMPTY_DRAFT, 'window_1');
    const second = toggleWindow(first, 'window_3');
    expect(second.windowPriority).toBe('window_1');
  });
});

describe('setWindowPriority', () => {
  it('sets the priority explicitly', () => {
    const draft = { ...EMPTY_DRAFT, window1Selected: true, window2Selected: true };
    expect(setWindowPriority(draft, 'window_2').windowPriority).toBe('window_2');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/flow.test.ts`
Expected: FAIL — `lib/flow.ts` does not exist.

- [ ] **Step 4: Write `lib/flow.ts`**

```ts
import type { DraftResponse, ModuleId, WindowKey } from './types';

export function getNextModule(current: ModuleId, draft: DraftResponse): ModuleId {
  switch (current) {
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

export function canAdvanceFromOpening(draft: DraftResponse): boolean {
  if (!draft.name.trim()) return false;
  if (draft.attending === null) return false;
  if (draft.attending === true && (draft.partySize === null || draft.partySize < 1)) return false;
  return true;
}

export function canAdvanceFromHotel(draft: DraftResponse): boolean {
  if (draft.hotelStaying === null) return false;
  if (draft.hotelStaying === true && (draft.hotelNights === null || draft.hotelNights < 1)) return false;
  return true;
}

export function canAdvanceFromDateWindows(draft: DraftResponse): boolean {
  return draft.window1Selected || draft.window2Selected || draft.window3Selected;
}

export function canAdvanceFromTravelTiming(draft: DraftResponse): boolean {
  return draft.travelTiming !== null;
}

function windowField(key: WindowKey): 'window1Selected' | 'window2Selected' | 'window3Selected' {
  if (key === 'window_1') return 'window1Selected';
  if (key === 'window_2') return 'window2Selected';
  return 'window3Selected';
}

export function toggleWindow(draft: DraftResponse, key: WindowKey): DraftResponse {
  const field = windowField(key);
  const updated: DraftResponse = { ...draft, [field]: !draft[field] };

  const selected = (['window_1', 'window_2', 'window_3'] as WindowKey[]).filter(
    (k) => updated[windowField(k)]
  );

  if (selected.length === 1) {
    updated.windowPriority = selected[0];
  } else if (selected.length === 0) {
    updated.windowPriority = null;
  } else if (updated.windowPriority && !selected.includes(updated.windowPriority)) {
    updated.windowPriority = null;
  }

  return updated;
}

export function setWindowPriority(draft: DraftResponse, key: WindowKey): DraftResponse {
  return { ...draft, windowPriority: key };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/flow.test.ts`
Expected: PASS, all 11 tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/flow.ts lib/flow.test.ts
git commit -m "Add flow state machine and draft validators"
```

---

### Task 3: Hero + ModulePanel + page.tsx skeleton

**Files:**
- Create: `components/Hero.tsx`, `components/Hero.test.tsx`
- Create: `components/ModulePanel.tsx`, `components/ModulePanel.test.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Consumes: `getNextModule` (`lib/flow.ts`), `EMPTY_DRAFT`, `DraftResponse`, `ModuleId` (`lib/types.ts`)
- Produces: `<ModulePanel>{children}</ModulePanel>` wrapper used by every module component in Tasks 4–9; `page.tsx`'s `moduleId`/`draft` state and `advance(updated: DraftResponse)` function, which later tasks extend with one `{moduleId === '...' && <XModule ... />}` line each.

- [ ] **Step 1: Write the failing test `components/Hero.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Hero from './Hero';

describe('Hero', () => {
  it('renders a video that autoplays, is muted, and does not loop', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('muted');
    expect(video).not.toHaveAttribute('loop');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Hero.test.tsx`
Expected: FAIL — `./Hero` module not found.

- [ ] **Step 3: Write `components/Hero.tsx`**

```tsx
export default function Hero() {
  return (
    <video
      className="fixed inset-0 z-0 h-full w-full object-cover"
      src="/santorini_2027.mp4"
      autoPlay
      muted
      playsInline
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Hero.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing test `components/ModulePanel.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
```

- [ ] **Step 6: Run test to verify it fails, then write `components/ModulePanel.tsx`**

Run: `npx vitest run components/ModulePanel.test.tsx` → FAIL (module not found).

```tsx
export default function ModulePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div className="animate-module-in w-full max-w-md border-l-4 border-terracotta bg-navy/[0.82] p-8 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run both tests to verify they pass**

Run: `npx vitest run components/Hero.test.tsx components/ModulePanel.test.tsx`
Expected: PASS, both files green.

- [ ] **Step 8: Write `app/page.tsx` skeleton (no modules wired yet)**

```tsx
'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import { getNextModule } from '@/lib/flow';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse, ModuleId } from '@/lib/types';

export default function Home() {
  const [moduleId, setModuleId] = useState<ModuleId>('opening');
  const [draft, setDraft] = useState<DraftResponse>(EMPTY_DRAFT);

  function advance(updated: DraftResponse) {
    setDraft(updated);
    setModuleId(getNextModule(moduleId, updated));
  }

  return (
    <main>
      <Hero />
    </main>
  );
}
```

- [ ] **Step 9: Verify the app builds**

Run: `npm run build`
Expected: succeeds (unused-variable warnings for `draft`/`advance` are fine — TypeScript's default `noUnusedLocals` is off; they're wired to JSX starting in Task 4).

- [ ] **Step 10: Commit**

```bash
git add components/Hero.tsx components/Hero.test.tsx components/ModulePanel.tsx components/ModulePanel.test.tsx app/page.tsx
git commit -m "Add Hero, ModulePanel, and page.tsx state machine skeleton"
```

---

### Task 4: OpeningModule

**Files:**
- Create: `components/modules/OpeningModule.tsx`, `components/modules/OpeningModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel` (Task 3), `canAdvanceFromOpening` (`lib/flow.ts`), `DraftResponse` (`lib/types.ts`)
- Produces: `<OpeningModule draft={DraftResponse} onAdvance={(updated: DraftResponse) => void} />` — the prop shape every later module (Tasks 5–9) also implements.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpeningModule from './OpeningModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('OpeningModule', () => {
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

  it('disables Next until required fields are filled', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/OpeningModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromOpening } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface OpeningModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function OpeningModule({ draft, onAdvance }: OpeningModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <p className="text-xs font-bold uppercase tracking-widest text-cream/70">
        20 years — July 4, 2007
      </p>
      <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-cream">
        Join us in Santorini
      </h1>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Your name
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={local.name}
        onChange={(event) => setLocal({ ...local, name: event.target.value })}
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you coming?</p>
      <div className="mt-2 flex gap-3">
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
      </div>
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
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromOpening(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/OpeningModule.test.tsx`
Expected: PASS, both tests green.

- [ ] **Step 5: Wire into `app/page.tsx`**

Modify `app/page.tsx`: add the import and render line.

```tsx
import OpeningModule from '@/components/modules/OpeningModule';
```

```tsx
      <Hero />
      {moduleId === 'opening' && <OpeningModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/OpeningModule.tsx components/modules/OpeningModule.test.tsx app/page.tsx
git commit -m "Add OpeningModule (name, attending, party size)"
```

---

### Task 5: HotelModule

**Files:**
- Create: `components/modules/HotelModule.tsx`, `components/modules/HotelModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel`, `canAdvanceFromHotel` (`lib/flow.ts`), same `{ draft, onAdvance }` prop shape as `OpeningModule`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelModule from './HotelModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('HotelModule', () => {
  it('requires nights when staying, then advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/how many nights/i), '4');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: true, hotelNights: 4 })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/HotelModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/HotelModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromHotel } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface HotelModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function HotelModule({ draft, onAdvance }: HotelModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Staying at the Adamastos Hotel?
      </h2>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: true })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === true ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: false, hotelNights: null })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === false ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          No
        </button>
      </div>
      {local.hotelStaying === true && (
        <>
          <label htmlFor="hotelNights" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            How many nights?
          </label>
          <input
            id="hotelNights"
            type="number"
            min={1}
            className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
            value={local.hotelNights ?? ''}
            onChange={(event) =>
              setLocal({ ...local, hotelNights: event.target.value ? Number(event.target.value) : null })
            }
          />
        </>
      )}
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromHotel(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/HotelModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import HotelModule from '@/components/modules/HotelModule';
```

```tsx
      {moduleId === 'hotel' && <HotelModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/HotelModule.tsx components/modules/HotelModule.test.tsx app/page.tsx
git commit -m "Add HotelModule (Adamastos stay + nights)"
```

---

### Task 6: DateWindowsModule

**Files:**
- Create: `components/modules/DateWindowsModule.tsx`, `components/modules/DateWindowsModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel`, `canAdvanceFromDateWindows`, `toggleWindow`, `setWindowPriority` (`lib/flow.ts`), `WindowKey` (`lib/types.ts`)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateWindowsModule from './DateWindowsModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('DateWindowsModule', () => {
  it('selects a window, auto-marks it as top pick, and advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<DateWindowsModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByLabelText(/7\/7 – 7\/13/));
    expect(screen.getByText(/top pick/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ window2Selected: true, windowPriority: 'window_2' })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/DateWindowsModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/DateWindowsModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromDateWindows, toggleWindow, setWindowPriority } from '@/lib/flow';
import type { DraftResponse, WindowKey } from '@/lib/types';

interface DateWindowsModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

const WINDOWS: { key: WindowKey; label: string; field: 'window1Selected' | 'window2Selected' | 'window3Selected' }[] = [
  { key: 'window_1', label: '6/30 – 7/6', field: 'window1Selected' },
  { key: 'window_2', label: '7/7 – 7/13', field: 'window2Selected' },
  { key: 'window_3', label: '7/14 – 7/18', field: 'window3Selected' },
];

export default function DateWindowsModule({ draft, onAdvance }: DateWindowsModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">Which weeks could work?</h2>
      <p className="mt-1 text-xs text-sage">Select all that apply, then mark your top pick.</p>
      <div className="mt-4 flex flex-col gap-3">
        {WINDOWS.map(({ key, label, field }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-cream">
              <input
                type="checkbox"
                checked={local[field]}
                onChange={() => setLocal(toggleWindow(local, key))}
              />
              {label}
            </label>
            {local[field] && (
              <button
                type="button"
                onClick={() => setLocal(setWindowPriority(local, key))}
                className={`text-xs font-bold uppercase tracking-wide ${
                  local.windowPriority === key ? 'text-terracotta' : 'text-teal'
                }`}
              >
                {local.windowPriority === key ? 'Top pick' : 'Prefer this one'}
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromDateWindows(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/DateWindowsModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import DateWindowsModule from '@/components/modules/DateWindowsModule';
```

```tsx
      {moduleId === 'dateWindows' && <DateWindowsModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/DateWindowsModule.tsx components/modules/DateWindowsModule.test.tsx app/page.tsx
git commit -m "Add DateWindowsModule (multi-select + priority toggle)"
```

---

### Task 7: TravelTimingModule

**Files:**
- Create: `components/modules/TravelTimingModule.tsx`, `components/modules/TravelTimingModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel`, `canAdvanceFromTravelTiming` (`lib/flow.ts`)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TravelTimingModule from './TravelTimingModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('TravelTimingModule', () => {
  it('selects a timing option and advances with the note', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<TravelTimingModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByRole('button', { name: /^both$/i }));
    await user.type(screen.getByLabelText(/anything else about your plans/i), 'Flying in early');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ travelTiming: 'both', travelNote: 'Flying in early' })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/TravelTimingModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/TravelTimingModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromTravelTiming } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface TravelTimingModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

const OPTIONS: { value: NonNullable<DraftResponse['travelTiming']>; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'both', label: 'Both' },
  { value: 'neither', label: 'Neither' },
];

export default function TravelTimingModule({ draft, onAdvance }: TravelTimingModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Traveling before or after Santorini?
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setLocal({ ...local, travelTiming: value })}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
              local.travelTiming === value ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label htmlFor="travelNote" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Anything else about your plans?
      </label>
      <textarea
        id="travelNote"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={local.travelNote}
        onChange={(event) => setLocal({ ...local, travelNote: event.target.value })}
      />
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromTravelTiming(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/TravelTimingModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import TravelTimingModule from '@/components/modules/TravelTimingModule';
```

```tsx
      {moduleId === 'travelTiming' && <TravelTimingModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/TravelTimingModule.tsx components/modules/TravelTimingModule.test.tsx app/page.tsx
git commit -m "Add TravelTimingModule (before/after/both/neither + note)"
```

---

### Task 8: DinnerCruiseModule

**Files:**
- Create: `components/modules/DinnerCruiseModule.tsx`, `components/modules/DinnerCruiseModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel`. No validator needed — both toggles are optional, Next is always enabled.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DinnerCruiseModule from './DinnerCruiseModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('DinnerCruiseModule', () => {
  it('toggles dinner and cruise interest independently and advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<DinnerCruiseModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByLabelText(/group dinner/i));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ dinnerInterested: true, cruiseInterested: false })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/DinnerCruiseModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/DinnerCruiseModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import type { DraftResponse } from '@/lib/types';

interface DinnerCruiseModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function DinnerCruiseModule({ draft, onAdvance }: DinnerCruiseModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">A couple more things</h2>
      <label className="mt-4 flex items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={local.dinnerInterested}
          onChange={(event) => setLocal({ ...local, dinnerInterested: event.target.checked })}
        />
        Interested in the group dinner?
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={local.cruiseInterested}
          onChange={(event) => setLocal({ ...local, cruiseInterested: event.target.checked })}
        />
        Interested in the sunset cruise?
      </label>
      <button
        type="button"
        onClick={() => onAdvance(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        Next
      </button>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/DinnerCruiseModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import DinnerCruiseModule from '@/components/modules/DinnerCruiseModule';
```

```tsx
      {moduleId === 'dinnerCruise' && <DinnerCruiseModule draft={draft} onAdvance={advance} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/DinnerCruiseModule.tsx components/modules/DinnerCruiseModule.test.tsx app/page.tsx
git commit -m "Add DinnerCruiseModule"
```

---

### Task 9: ClosingModule

**Files:**
- Create: `components/modules/ClosingModule.tsx`, `components/modules/ClosingModule.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ModulePanel`, `DraftResponse`. Terminal module — no `onAdvance`; instead POSTs to `/api/submit` (built in Task 11) on a "Send" button. Test mocks `global.fetch`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClosingModule from './ClosingModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('ClosingModule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('posts the draft with the note to /api/submit and shows a thank-you', async () => {
    const user = userEvent.setup();
    render(<ClosingModule draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }} />);

    await user.type(screen.getByLabelText(/anything you want to share/i), 'Can\'t wait');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/submit',
      expect.objectContaining({ method: 'POST' })
    );
    expect(await screen.findByText(/see you in santorini/i)).toBeInTheDocument();
  });

  it('shows the not-attending headline when attending is false', () => {
    render(<ClosingModule draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }} />);
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/ClosingModule.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/modules/ClosingModule.tsx`**

```tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import type { DraftResponse } from '@/lib/types';

interface ClosingModuleProps {
  draft: DraftResponse;
}

export default function ClosingModule({ draft }: ClosingModuleProps) {
  const [note, setNote] = useState(draft.note);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    setStatus('sending');
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, note }),
    });
    setStatus(response.ok ? 'sent' : 'error');
  }

  if (status === 'sent') {
    return (
      <ModulePanel>
        <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
          {draft.attending ? 'See you in Santorini' : 'Thanks for letting us know'}
        </h2>
      </ModulePanel>
    );
  }

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        {draft.attending ? 'One last thing' : 'Sorry to miss you'}
      </h2>
      <label htmlFor="note" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Anything you want to share?
      </label>
      <textarea
        id="note"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'sending'}
        className="mt-4 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        {status === 'sending' ? 'Sending...' : 'Send'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-xs text-terracotta">Something went wrong — please try again.</p>
      )}
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/ClosingModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `app/page.tsx`**

```tsx
import ClosingModule from '@/components/modules/ClosingModule';
```

```tsx
      {moduleId === 'closing' && <ClosingModule draft={draft} />}
```

- [ ] **Step 6: Commit**

```bash
git add components/modules/ClosingModule.tsx components/modules/ClosingModule.test.tsx app/page.tsx
git commit -m "Add ClosingModule, complete the module flow wiring"
```

---

### Task 10: Supabase schema + admin client

**Files:**
- Create: `supabase/migrations/0001_create_responses.sql`
- Create: `lib/supabase-admin.ts`, `lib/supabase-admin.test.ts`

**Interfaces:**
- Produces: `getSupabaseAdminClient()`, `getAllResponses()` (consumed by Task 11's submit route and Task 13's admin page).

- [ ] **Step 1: Write the migration**

```sql
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  attending boolean not null,
  party_size integer,
  hotel_staying boolean,
  hotel_nights integer,
  window_1_selected boolean not null default false,
  window_2_selected boolean not null default false,
  window_3_selected boolean not null default false,
  window_priority text check (window_priority in ('window_1', 'window_2', 'window_3')),
  travel_timing text check (travel_timing in ('before', 'after', 'both', 'neither')),
  travel_note text,
  dinner_interested boolean,
  cruise_interested boolean,
  note text
);

alter table responses enable row level security;

-- No policies defined: all reads/writes happen server-side via the
-- service-role key, which bypasses RLS. RLS defaults to deny-all for
-- any other key (e.g. if a public anon key is ever introduced later).
```

- [ ] **Step 2: Write the failing test `lib/supabase-admin.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const createClientMock = vi.fn(() => ({ from: fromMock }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('getSupabaseAdminClient', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('throws when env vars are missing', async () => {
    const { getSupabaseAdminClient } = await import('./supabase-admin');
    expect(() => getSupabaseAdminClient()).toThrow(/SUPABASE_URL/);
  });
});

describe('getAllResponses', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('selects all responses ordered by newest first', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const select = vi.fn(() => ({ order }));
    fromMock.mockReturnValue({ select });

    const { getAllResponses } = await import('./supabase-admin');
    const result = await getAllResponses();

    expect(fromMock).toHaveBeenCalledWith('responses');
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([{ id: '1' }]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: FAIL — `./supabase-admin` module not found.

- [ ] **Step 4: Write `lib/supabase-admin.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function getAllResponses() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: PASS.

- [ ] **Step 6: Apply the migration to the Supabase project**

Run in the Supabase SQL editor (or `supabase db push` if the CLI is linked): contents of `supabase/migrations/0001_create_responses.sql`.
Expected: `responses` table exists with RLS enabled and no policies.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0001_create_responses.sql lib/supabase-admin.ts lib/supabase-admin.test.ts
git commit -m "Add responses table migration and Supabase admin client"
```

---

### Task 11: Submission pipeline — payload, email, and API route

**Files:**
- Create: `lib/payload.ts`, `lib/payload.test.ts`
- Create: `lib/email.ts`, `lib/email.test.ts`
- Create: `lib/resend-client.ts`
- Create: `app/api/submit/route.ts`, `app/api/submit/route.test.ts`

**Interfaces:**
- Consumes: `DraftResponse` (`lib/types.ts`), `getSupabaseAdminClient` (`lib/supabase-admin.ts`)
- Produces: `ResponseRow` type, `buildResponseRow`, `validateDraftForSubmit` (`lib/payload.ts`); `buildNotificationEmailText`, `sendNotificationEmail` (`lib/email.ts`); `POST` handler at `app/api/submit/route.ts` (consumed by `ClosingModule`, already wired in Task 9).

- [ ] **Step 1: Write the failing test `lib/payload.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildResponseRow, validateDraftForSubmit } from './payload';
import { EMPTY_DRAFT } from './types';

describe('validateDraftForSubmit', () => {
  it('requires a name and an attending answer', () => {
    expect(validateDraftForSubmit(EMPTY_DRAFT)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('passes for a valid not-attending draft', () => {
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toEqual([]);
  });

  it('requires party size when attending', () => {
    expect(
      validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: true })
    ).toContain('Party size is required when attending');
  });
});

describe('buildResponseRow', () => {
  it('nulls out attending-only fields when not attending', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: false,
      partySize: 5,
      hotelStaying: true,
      window1Selected: true,
      note: 'Miss you all',
    });
    expect(row).toEqual(
      expect.objectContaining({
        name: 'Steve',
        attending: false,
        party_size: null,
        hotel_staying: null,
        window_1_selected: false,
        note: 'Miss you all',
      })
    );
  });

  it('carries through attending-path fields', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      hotelNights: 3,
      window2Selected: true,
      windowPriority: 'window_2',
      travelTiming: 'before',
      dinnerInterested: true,
      cruiseInterested: false,
    });
    expect(row).toEqual(
      expect.objectContaining({
        party_size: 2,
        hotel_staying: true,
        hotel_nights: 3,
        window_2_selected: true,
        window_priority: 'window_2',
        travel_timing: 'before',
        dinner_interested: true,
        cruise_interested: false,
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/payload.test.ts`
Expected: FAIL — `./payload` module not found.

- [ ] **Step 3: Write `lib/payload.ts`**

```ts
import type { DraftResponse } from './types';

export interface ResponseRow {
  name: string;
  attending: boolean;
  party_size: number | null;
  hotel_staying: boolean | null;
  hotel_nights: number | null;
  window_1_selected: boolean;
  window_2_selected: boolean;
  window_3_selected: boolean;
  window_priority: string | null;
  travel_timing: string | null;
  travel_note: string | null;
  dinner_interested: boolean | null;
  cruise_interested: boolean | null;
  note: string | null;
}

export function validateDraftForSubmit(draft: DraftResponse): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('Name is required');
  if (draft.attending === null) errors.push('Attending is required');
  if (draft.attending === true && (draft.partySize === null || draft.partySize < 1)) {
    errors.push('Party size is required when attending');
  }
  return errors;
}

export function buildResponseRow(draft: DraftResponse): ResponseRow {
  const attending = draft.attending === true;
  return {
    name: draft.name.trim(),
    attending,
    party_size: attending ? draft.partySize : null,
    hotel_staying: attending ? draft.hotelStaying : null,
    hotel_nights: attending && draft.hotelStaying ? draft.hotelNights : null,
    window_1_selected: attending ? draft.window1Selected : false,
    window_2_selected: attending ? draft.window2Selected : false,
    window_3_selected: attending ? draft.window3Selected : false,
    window_priority: attending ? draft.windowPriority : null,
    travel_timing: attending ? draft.travelTiming : null,
    travel_note: attending && draft.travelNote.trim() ? draft.travelNote.trim() : null,
    dinner_interested: attending ? draft.dinnerInterested : null,
    cruise_interested: attending ? draft.cruiseInterested : null,
    note: draft.note.trim() ? draft.note.trim() : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/payload.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test `lib/email.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { buildNotificationEmailText, sendNotificationEmail } from './email';
import { buildResponseRow } from './payload';
import { EMPTY_DRAFT } from './types';

describe('buildNotificationEmailText', () => {
  it('includes attending-path details', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      hotelNights: 3,
      window1Selected: true,
      windowPriority: 'window_1',
      travelTiming: 'both',
      dinnerInterested: true,
      cruiseInterested: true,
    });
    const text = buildNotificationEmailText(row);
    expect(text).toContain('Steve — ATTENDING');
    expect(text).toContain('Party size: 2');
    expect(text).toContain('Staying at Adamastos: yes, 3 night(s)');
    expect(text).toContain('6/30-7/6');
  });

  it('keeps the not-attending summary short', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });
    const text = buildNotificationEmailText(row);
    expect(text).toContain('Steve — not attending');
    expect(text).not.toContain('Party size');
  });
});

describe('sendNotificationEmail', () => {
  it('sends via the injected client with from/to/subject/text', async () => {
    const send = vi.fn().mockResolvedValue({ id: 'abc' });
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });

    await sendNotificationEmail({ emails: { send } }, row);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Steve'),
        text: expect.stringContaining('Steve'),
      })
    );
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run lib/email.test.ts`
Expected: FAIL — `./email` module not found.

- [ ] **Step 7: Write `lib/email.ts`**

```ts
import type { ResponseRow } from './payload';

export function buildNotificationEmailText(row: ResponseRow): string {
  const lines = [`${row.name} — ${row.attending ? 'ATTENDING' : 'not attending'}`];
  if (row.attending) {
    lines.push(`Party size: ${row.party_size}`);
    lines.push(
      row.hotel_staying
        ? `Staying at Adamastos: yes, ${row.hotel_nights} night(s)`
        : 'Staying at Adamastos: no'
    );
    const windows: string[] = [];
    if (row.window_1_selected) windows.push('6/30-7/6');
    if (row.window_2_selected) windows.push('7/7-7/13');
    if (row.window_3_selected) windows.push('7/14-7/18');
    lines.push(`Date windows: ${windows.join(', ') || 'none selected'}`);
    lines.push(`Priority window: ${row.window_priority ?? 'none'}`);
    lines.push(`Travel timing: ${row.travel_timing ?? 'none'}`);
    if (row.travel_note) lines.push(`Travel note: ${row.travel_note}`);
    lines.push(`Group dinner: ${row.dinner_interested ? 'yes' : 'no'}`);
    lines.push(`Sunset cruise: ${row.cruise_interested ? 'yes' : 'no'}`);
  }
  if (row.note) lines.push(`Note: ${row.note}`);
  return lines.join('\n');
}

interface ResendLikeClient {
  emails: { send: (payload: Record<string, unknown>) => Promise<unknown> };
}

export async function sendNotificationEmail(client: ResendLikeClient, row: ResponseRow): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const toEmail = process.env.NOTIFY_EMAIL ?? 'steve.marchese@gmail.com';
  await client.emails.send({
    from: `Santorini 2027 <${fromEmail}>`,
    to: toEmail,
    subject: `New RSVP: ${row.name} (${row.attending ? 'attending' : 'not attending'})`,
    text: buildNotificationEmailText(row),
  });
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run lib/email.test.ts`
Expected: PASS.

- [ ] **Step 9: Write `lib/resend-client.ts`**

```ts
import { Resend } from 'resend';

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY must be set');
  }
  return new Resend(apiKey);
}
```

- [ ] **Step 10: Write the failing test `app/api/submit/route.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_DRAFT } from '@/lib/types';

const insertMock = vi.fn();
const sendMock = vi.fn().mockResolvedValue({ id: 'abc' });

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdminClient: () => ({ from: () => ({ insert: insertMock }) }),
}));
vi.mock('@/lib/resend-client', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

describe('POST /api/submit', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    sendMock.mockClear();
  });

  it('rejects an invalid draft without inserting', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(EMPTY_DRAFT),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('inserts a valid draft and sends the notification email', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify({ ...EMPTY_DRAFT, name: 'Steve', attending: false }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Steve', attending: false }));
    expect(sendMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npx vitest run app/api/submit/route.test.ts`
Expected: FAIL — `./route` module not found.

- [ ] **Step 12: Write `app/api/submit/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { buildResponseRow, validateDraftForSubmit } from '@/lib/payload';
import { sendNotificationEmail } from '@/lib/email';
import { getResendClient } from '@/lib/resend-client';
import type { DraftResponse } from '@/lib/types';

export async function POST(request: Request) {
  const draft = (await request.json()) as DraftResponse;
  const errors = validateDraftForSubmit(draft);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const row = buildResponseRow(draft);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').insert(row);
  if (error) {
    return NextResponse.json({ errors: [error.message] }, { status: 500 });
  }

  await sendNotificationEmail(getResendClient(), row);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 13: Run test to verify it passes**

Run: `npx vitest run app/api/submit/route.test.ts`
Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add lib/payload.ts lib/payload.test.ts lib/email.ts lib/email.test.ts lib/resend-client.ts app/api/submit
git commit -m "Add submission pipeline: payload builder, notification email, submit route"
```

---

### Task 12: Admin auth

**Files:**
- Create: `lib/admin-auth.ts`, `lib/admin-auth.test.ts`
- Create: `app/api/admin/login/route.ts`, `app/api/admin/login/route.test.ts`

**Interfaces:**
- Produces: `hashAdminPassword(password: string): string` (consumed by both the login route and Task 13's `app/admin/page.tsx`); `POST` handler at `app/api/admin/login/route.ts` that sets an `admin_session` cookie.

- [ ] **Step 1: Write the failing test `lib/admin-auth.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { hashAdminPassword } from './admin-auth';

describe('hashAdminPassword', () => {
  it('is deterministic and does not return the plaintext', () => {
    const hash = hashAdminPassword('secret123');
    expect(hash).toBe(hashAdminPassword('secret123'));
    expect(hash).not.toBe('secret123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs for different passwords', () => {
    expect(hashAdminPassword('a')).not.toBe(hashAdminPassword('b'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/admin-auth.test.ts`
Expected: FAIL — `./admin-auth` module not found.

- [ ] **Step 3: Write `lib/admin-auth.ts`**

```ts
import { createHash } from 'crypto';

export function hashAdminPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/admin-auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test `app/api/admin/login/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'secret123';
  });

  it('rejects an incorrect password', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('accepts the correct password and sets a cookie', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('admin_session=');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run app/api/admin/login/route.test.ts`
Expected: FAIL — `./route` module not found.

- [ ] **Step 7: Write `app/api/admin/login/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { hashAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password: string };
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', hashAdminPassword(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run app/api/admin/login/route.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/admin-auth.ts lib/admin-auth.test.ts app/api/admin/login
git commit -m "Add admin password auth (hashed cookie session)"
```

---

### Task 13: Admin page

**Files:**
- Create: `components/AdminLoginForm.tsx`, `components/AdminLoginForm.test.tsx`
- Create: `components/ResponsesTable.tsx`, `components/ResponsesTable.test.tsx`
- Create: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `hashAdminPassword` (`lib/admin-auth.ts`), `getAllResponses` (`lib/supabase-admin.ts`), `ResponseRow` (`lib/payload.ts`)
- `app/admin/page.tsx` is a server component composing `AdminLoginForm`/`ResponsesTable`; verified manually in Task 14 rather than unit tested (Next.js server components with `cookies()` need a running server, not a unit-test harness).

- [ ] **Step 1: Write the failing test `components/AdminLoginForm.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginForm from './AdminLoginForm';

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  it('shows an error on an incorrect password', async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    await user.type(screen.getByLabelText(/admin password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /enter/i }));
    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/AdminLoginForm.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `components/AdminLoginForm.tsx`**

```tsx
'use client';
import { useState, type FormEvent } from 'react';

export default function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      window.location.reload();
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 max-w-xs">
      <label htmlFor="adminPassword" className="block text-sm font-semibold uppercase tracking-wide text-sage">
        Admin password
      </label>
      <input
        id="adminPassword"
        type="password"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit" className="mt-4 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream">
        Enter
      </button>
      {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/AdminLoginForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing test `components/ResponsesTable.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResponsesTable from './ResponsesTable';

describe('ResponsesTable', () => {
  it('renders a row per response with key fields', () => {
    render(
      <ResponsesTable
        responses={[
          {
            id: '1',
            created_at: '2026-07-29T00:00:00Z',
            name: 'Steve',
            attending: true,
            party_size: 2,
            hotel_staying: true,
            hotel_nights: 3,
            window_1_selected: true,
            window_2_selected: false,
            window_3_selected: false,
            window_priority: 'window_1',
            travel_timing: 'both',
            travel_note: null,
            dinner_interested: true,
            cruise_interested: false,
            note: null,
          },
        ]}
      />
    );
    expect(screen.getByText('Steve')).toBeInTheDocument();
    expect(screen.getByText('6/30-7/6')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Write `components/ResponsesTable.tsx`**

```tsx
import type { ResponseRow } from '@/lib/payload';

interface ResponsesTableProps {
  responses: (ResponseRow & { id: string; created_at: string })[];
}

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  return (
    <table className="w-full border-collapse text-sm text-cream">
      <thead>
        <tr className="border-b border-cream/35 text-left uppercase text-sage">
          <th className="p-2">Name</th>
          <th className="p-2">Attending</th>
          <th className="p-2">Party</th>
          <th className="p-2">Hotel</th>
          <th className="p-2">Windows</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Travel</th>
          <th className="p-2">Dinner</th>
          <th className="p-2">Cruise</th>
          <th className="p-2">Note</th>
        </tr>
      </thead>
      <tbody>
        {responses.map((row) => (
          <tr key={row.id} className="border-b border-cream/10">
            <td className="p-2">{row.name}</td>
            <td className="p-2">{row.attending ? 'Yes' : 'No'}</td>
            <td className="p-2">{row.party_size ?? '—'}</td>
            <td className="p-2">
              {row.hotel_staying ? `Yes, ${row.hotel_nights}n` : row.hotel_staying === false ? 'No' : '—'}
            </td>
            <td className="p-2">
              {[row.window_1_selected && '6/30-7/6', row.window_2_selected && '7/7-7/13', row.window_3_selected && '7/14-7/18']
                .filter(Boolean)
                .join(', ') || '—'}
            </td>
            <td className="p-2">{row.window_priority ?? '—'}</td>
            <td className="p-2">{row.travel_timing ?? '—'}</td>
            <td className="p-2">{row.dinner_interested ? 'Yes' : '—'}</td>
            <td className="p-2">{row.cruise_interested ? 'Yes' : '—'}</td>
            <td className="p-2">{row.note ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: PASS.

- [ ] **Step 9: Write `app/admin/page.tsx`**

```tsx
import { cookies } from 'next/headers';
import { hashAdminPassword } from '@/lib/admin-auth';
import { getAllResponses } from '@/lib/supabase-admin';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  const expected = process.env.ADMIN_PASSWORD ? hashAdminPassword(process.env.ADMIN_PASSWORD) : null;
  const isAuthed = Boolean(expected) && session === expected;

  if (!isAuthed) {
    return <AdminLoginForm />;
  }

  const responses = await getAllResponses();
  return (
    <main className="min-h-dvh overflow-auto bg-navy p-8">
      <ResponsesTable responses={responses} />
    </main>
  );
}
```

- [ ] **Step 10: Verify the app builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 11: Commit**

```bash
git add components/AdminLoginForm.tsx components/AdminLoginForm.test.tsx components/ResponsesTable.tsx components/ResponsesTable.test.tsx app/admin/page.tsx
git commit -m "Add /admin page (login gate + responses table)"
```

---

### Task 14: Deployment

**Files:** none (configuration and verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all test files pass (Tasks 2–13's suites).

- [ ] **Step 2: Set Vercel environment variables**

In the Vercel dashboard for project `santorini2027` (scope `steve-marcheses-projects`), add for Production: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFY_EMAIL`, `ADMIN_PASSWORD` — values from the real Supabase project and Resend account, not the `.env.local.example` placeholders.

- [ ] **Step 3: Verify (or set up) the Resend sending domain**

In the Resend dashboard, confirm `santorini2027.com` is verified for sending, or set `RESEND_FROM_EMAIL` to Resend's shared `onboarding@resend.dev` address if not yet verified — the code already falls back to that default.

- [ ] **Step 4: Deploy**

Run (CLI logged into the `stevemarchese` personal account, not `recog-media`): `vercel --prod --yes`
Expected: build succeeds on Vercel, deployment aliases to `santorini2027.com` and `www.santorini2027.com`, replacing the static teaser.

- [ ] **Step 5: Manual end-to-end verification (per spec's Testing section)**

- Load `https://santorini2027.com` on desktop and mobile viewport sizes; confirm the hero video plays once and holds its final frame (no loop, no restart on tab refocus) and the page never scrolls.
- Click through the attending path: Opening (yes) → Hotel → Date windows → Travel timing → Dinner/Cruise → Closing → Send. Confirm the Resend email arrives and `/admin` shows the new row with all fields populated correctly.
- Click through the not-attending path: Opening (no) → Closing directly → Send. Confirm the email arrives and the `/admin` row has nulled-out attending-only fields.
- Confirm `/admin` shows the login form when the `admin_session` cookie is absent/incorrect, and the table when the correct password is submitted.

- [ ] **Step 6: Commit any deployment-config changes**

If Step 2–3 required code changes (e.g. adjusting `RESEND_FROM_EMAIL` default), commit them:

```bash
git add -A
git commit -m "Finalize deployment configuration for santorini2027.com"
```
