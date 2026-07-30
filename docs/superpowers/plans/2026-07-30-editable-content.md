# Admin-Editable Letter + Post-Submit Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin edit the letter and the two post-submit confirmation headings at runtime (stored in Supabase), with the public site reading the content server-side.

**Architecture:** A Supabase `site_content` key/value table holds overrides; `lib/site-content.ts` merges rows over hardcoded defaults and splits the letter into paragraphs (pure, tested). The public `page.tsx` becomes a server component that fetches content and passes it into a client `Wizard`. A protected `POST /api/admin/content` upserts edits from a new `ContentEditor` admin component.

**Tech Stack:** Next.js 16 (App Router, server + client components), React 19, Supabase JS, TypeScript, Vitest + Testing Library (jsdom).

---

## File Structure

- `supabase/migrations/0002_create_site_content.sql` — CREATE: the `site_content` table.
- `lib/site-content.ts` — CREATE: `SiteContent` type, `DEFAULT_SITE_CONTENT`, `splitParagraphs`, `mergeSiteContent`, `getSiteContent`.
- `lib/site-content.test.ts` — CREATE: tests for the pure helpers.
- `lib/admin-session.ts` — CREATE: `isAdminAuthed()` (extracted auth check).
- `lib/admin-session.test.ts` — CREATE.
- `app/admin/page.tsx` — MODIFY: use `isAdminAuthed()`, fetch content, render `ContentEditor`.
- `app/api/admin/content/route.ts` — CREATE: protected upsert endpoint.
- `app/api/admin/content/route.test.ts` — CREATE.
- `app/page.tsx` — MODIFY: server component fetching content → renders `Wizard`.
- `components/Wizard.tsx` — CREATE: the current `Home` wizard logic + `content` prop.
- `components/modules/LetterModule.tsx` — MODIFY: `paragraphs` prop instead of the constant.
- `components/modules/LetterModule.test.tsx` — MODIFY.
- `components/modules/ClosingModule.tsx` — MODIFY: confirmation-heading props.
- `components/modules/ClosingModule.test.tsx` — MODIFY.
- `components/ContentEditor.tsx` — CREATE: admin editing UI.
- `components/ContentEditor.test.tsx` — CREATE.

---

## Task 1: `site_content` table + content library

**Files:**
- Create: `supabase/migrations/0002_create_site_content.sql`
- Create: `lib/site-content.ts`
- Test: `lib/site-content.test.ts`

- [ ] **Step 1: Create the migration** — `supabase/migrations/0002_create_site_content.sql`

```sql
create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 2: Apply the migration to the Supabase project**

The table must exist in the hosted DB before saving works (the public site still works without it — it falls back to defaults). Apply the SQL above in the Supabase dashboard → **SQL Editor** for project `auzfypbnpiajogxbefvf`, or via `supabase db push` if the CLI is linked. Verify: the `site_content` table appears under Database → Tables.

- [ ] **Step 3: Write the failing test** — create `lib/site-content.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { splitParagraphs, mergeSiteContent, DEFAULT_SITE_CONTENT } from './site-content';

describe('splitParagraphs', () => {
  it('splits on blank lines and trims each paragraph', () => {
    expect(splitParagraphs('One.\n\nTwo.\n\nThree.')).toEqual(['One.', 'Two.', 'Three.']);
  });
  it('collapses runs of blank lines and ignores surrounding whitespace', () => {
    expect(splitParagraphs('  One.  \n\n\n   Two.  ')).toEqual(['One.', 'Two.']);
  });
  it('returns a single paragraph when there are no blank lines', () => {
    expect(splitParagraphs('Just one line')).toEqual(['Just one line']);
  });
  it('returns an empty array for blank input', () => {
    expect(splitParagraphs('   ')).toEqual([]);
  });
});

describe('mergeSiteContent', () => {
  it('uses defaults when no rows are present', () => {
    expect(mergeSiteContent([], DEFAULT_SITE_CONTENT)).toEqual(DEFAULT_SITE_CONTENT);
  });
  it('overrides defaults with row values', () => {
    const merged = mergeSiteContent(
      [
        { key: 'letter', value: 'New letter' },
        { key: 'confirmation_attending', value: 'Yay' },
        { key: 'confirmation_not_attending', value: 'Aww' },
      ],
      DEFAULT_SITE_CONTENT
    );
    expect(merged).toEqual({
      letter: 'New letter',
      confirmationAttending: 'Yay',
      confirmationNotAttending: 'Aww',
    });
  });
  it('falls back to the default when a row value is blank', () => {
    const merged = mergeSiteContent([{ key: 'letter', value: '   ' }], DEFAULT_SITE_CONTENT);
    expect(merged.letter).toBe(DEFAULT_SITE_CONTENT.letter);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run lib/site-content.test.ts`
Expected: FAIL — cannot resolve `./site-content`.

- [ ] **Step 5: Write minimal implementation** — create `lib/site-content.ts`

```typescript
import { getSupabaseAdminClient } from './supabase-admin';
import { LETTER_PARAGRAPHS } from './letter-content';

export interface SiteContent {
  letter: string;
  confirmationAttending: string;
  confirmationNotAttending: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  letter: LETTER_PARAGRAPHS.join('\n\n'),
  confirmationAttending: 'See you in Santorini',
  confirmationNotAttending: 'Thanks for letting us know',
};

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function mergeSiteContent(
  rows: { key: string; value: string }[],
  defaults: SiteContent
): SiteContent {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const pick = (key: string, fallback: string): string => {
    const value = byKey.get(key);
    return value != null && value.trim().length > 0 ? value : fallback;
  };
  return {
    letter: pick('letter', defaults.letter),
    confirmationAttending: pick('confirmation_attending', defaults.confirmationAttending),
    confirmationNotAttending: pick('confirmation_not_attending', defaults.confirmationNotAttending),
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from('site_content').select('key, value');
    if (error || !data) return DEFAULT_SITE_CONTENT;
    return mergeSiteContent(data, DEFAULT_SITE_CONTENT);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/site-content.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0002_create_site_content.sql lib/site-content.ts lib/site-content.test.ts
git commit -m "Add site_content table and content library with defaults"
```

---

## Task 2: Shared admin-session auth check

**Files:**
- Create: `lib/admin-session.ts`
- Test: `lib/admin-session.test.ts`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Write the failing test** — create `lib/admin-session.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getMock })),
}));

import { isAdminAuthed } from './admin-session';
import { hashAdminPassword } from './admin-auth';

describe('isAdminAuthed', () => {
  const original = process.env.ADMIN_PASSWORD;
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'secret';
    getMock.mockReset();
  });
  afterEach(() => {
    process.env.ADMIN_PASSWORD = original;
  });

  it('returns false when ADMIN_PASSWORD is unset', async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await isAdminAuthed()).toBe(false);
  });

  it('returns false when the cookie does not match', async () => {
    getMock.mockReturnValue({ value: 'nope' });
    expect(await isAdminAuthed()).toBe(false);
  });

  it('returns true when the cookie equals the hashed password', async () => {
    getMock.mockReturnValue({ value: hashAdminPassword('secret') });
    expect(await isAdminAuthed()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/admin-session.test.ts`
Expected: FAIL — cannot resolve `./admin-session`.

- [ ] **Step 3: Write minimal implementation** — create `lib/admin-session.ts`

```typescript
import { cookies } from 'next/headers';
import { hashAdminPassword } from './admin-auth';

export async function isAdminAuthed(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === hashAdminPassword(password);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/admin-session.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Refactor `app/admin/page.tsx` to use it** — replace the entire file

```tsx
import { isAdminAuthed } from '@/lib/admin-session';
import { getAllResponses } from '@/lib/supabase-admin';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const responses = await getAllResponses();
  return (
    <main className="h-dvh overflow-auto bg-navy p-8">
      <ResponsesTable responses={responses} />
    </main>
  );
}
```

- [ ] **Step 6: Run the full suite to confirm nothing broke**

Run: `npx vitest run`
Expected: all test files pass.

- [ ] **Step 7: Commit**

```bash
git add lib/admin-session.ts lib/admin-session.test.ts app/admin/page.tsx
git commit -m "Extract isAdminAuthed helper and use it in the admin page"
```

---

## Task 3: Content save API route

**Files:**
- Create: `app/api/admin/content/route.ts`
- Test: `app/api/admin/content/route.test.ts`

- [ ] **Step 1: Write the failing test** — create `app/api/admin/content/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin-session', () => ({ isAdminAuthed: vi.fn() }));
const upsertMock = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdminClient: () => ({ from: () => ({ upsert: upsertMock }) }),
}));

import { POST } from './route';
import { isAdminAuthed } from '@/lib/admin-session';

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/content', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/content', () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await POST(req({ letter: 'x', confirmationAttending: 'a', confirmationNotAttending: 'b' }));
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('upserts the three rows and returns ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await POST(req({ letter: 'Hello', confirmationAttending: 'Yay', confirmationNotAttending: 'Aww' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'letter', value: 'Hello' }),
        expect.objectContaining({ key: 'confirmation_attending', value: 'Yay' }),
        expect.objectContaining({ key: 'confirmation_not_attending', value: 'Aww' }),
      ])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/content/route.test.ts`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write minimal implementation** — create `app/api/admin/content/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

interface ContentBody {
  letter: string;
  confirmationAttending: string;
  confirmationNotAttending: string;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ContentBody;
  try {
    body = (await request.json()) as ContentBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const rows = [
    { key: 'letter', value: body.letter ?? '', updated_at: updatedAt },
    { key: 'confirmation_attending', value: body.confirmationAttending ?? '', updated_at: updatedAt },
    { key: 'confirmation_not_attending', value: body.confirmationNotAttending ?? '', updated_at: updatedAt },
  ];

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/content/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/content/route.ts app/api/admin/content/route.test.ts
git commit -m "Add protected POST /api/admin/content upsert endpoint"
```

---

## Task 4: Public read path (server page → client Wizard → modules)

**Files:**
- Create: `components/Wizard.tsx`
- Modify: `app/page.tsx` (full rewrite)
- Modify: `components/modules/LetterModule.tsx` (full rewrite)
- Modify: `components/modules/LetterModule.test.tsx` (full rewrite)
- Modify: `components/modules/ClosingModule.tsx`
- Modify: `components/modules/ClosingModule.test.tsx` (full rewrite)

- [ ] **Step 1: Update the failing test for LetterModule** — replace `components/modules/LetterModule.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LetterModule from './LetterModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('LetterModule', () => {
  it('renders the provided paragraphs and advances the unchanged draft on Next', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    const paragraphs = ['First paragraph.', 'Last paragraph.'];
    render(<LetterModule draft={EMPTY_DRAFT} paragraphs={paragraphs} onAdvance={onAdvance} />);

    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Last paragraph.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: FAIL — `LetterModule` does not accept a `paragraphs` prop yet (TS error / paragraphs not rendered).

- [ ] **Step 3: Rewrite `components/modules/LetterModule.tsx`**

```tsx
'use client';
import ModulePanel from '@/components/ModulePanel';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel draggable>
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/modules/LetterModule.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Update the failing test for ClosingModule** — replace `components/modules/ClosingModule.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClosingModule from './ClosingModule';
import { EMPTY_DRAFT } from '@/lib/types';

const CONFIRMATIONS = {
  confirmationAttending: 'See you in Santorini',
  confirmationNotAttending: 'Thanks for letting us know',
};

describe('ClosingModule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('posts the draft with the note to /api/submit and shows the attending confirmation', async () => {
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );

    await user.type(screen.getByLabelText(/anything else you'd like to share/i), 'Can\'t wait');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/submit',
      expect.objectContaining({ method: 'POST' })
    );
    expect(await screen.findByText(/see you in santorini/i)).toBeInTheDocument();
  });

  it('shows the not-attending pre-submit headline when attending is false', () => {
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
  });

  it('shows the not-attending confirmation after sending', async () => {
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText(/thanks for letting us know/i)).toBeInTheDocument();
  });

  it('shows the error state and re-enables Send when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );

    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).not.toBeDisabled();
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={onBack}
        {...CONFIRMATIONS}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/modules/ClosingModule.test.tsx`
Expected: FAIL — `ClosingModule` does not accept `confirmationAttending`/`confirmationNotAttending` yet, and the not-attending confirmation test can't find the text.

- [ ] **Step 7: Modify `components/modules/ClosingModule.tsx`**

Change the props interface (lines 6-9) to:

```tsx
interface ClosingModuleProps {
  draft: DraftResponse;
  onBack: () => void;
  confirmationAttending: string;
  confirmationNotAttending: string;
}
```

Change the function signature (line 11) to:

```tsx
export default function ClosingModule({
  draft,
  onBack,
  confirmationAttending,
  confirmationNotAttending,
}: ClosingModuleProps) {
```

Change the `sent` heading (the `<h2>` inside the `status === 'sent'` block, lines 32-34) to:

```tsx
        <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
          {draft.attending ? confirmationAttending : confirmationNotAttending}
        </h2>
```

(Leave the pre-submit headings `'One last thing'` / `'Sorry to miss you'` and the note prompt unchanged.)

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/modules/ClosingModule.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 9: Create `components/Wizard.tsx`** (the current `Home` logic, now taking `content`)

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
      <AboutIcon visible={moduleId !== 'letter'} />
      <WeatherWidget />
      {moduleId === 'letter' && <LetterModule draft={draft} paragraphs={letterParagraphs} onAdvance={advance} />}
      {moduleId === 'opening' && <OpeningModule draft={draft} onAdvance={advance} />}
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

- [ ] **Step 10: Rewrite `app/page.tsx`** as a server component

```tsx
import Wizard from '@/components/Wizard';
import { getSiteContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await getSiteContent();
  return <Wizard content={content} />;
}
```

- [ ] **Step 11: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass; tsc reports no errors (confirms `page.tsx`, `Wizard`, and the modules typecheck together).

- [ ] **Step 12: Commit**

```bash
git add app/page.tsx components/Wizard.tsx components/modules/LetterModule.tsx components/modules/LetterModule.test.tsx components/modules/ClosingModule.tsx components/modules/ClosingModule.test.tsx
git commit -m "Read editable letter and confirmations from server-fetched content"
```

---

## Task 5: Admin ContentEditor UI

**Files:**
- Create: `components/ContentEditor.tsx`
- Test: `components/ContentEditor.test.tsx`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Write the failing test** — create `components/ContentEditor.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentEditor from './ContentEditor';

const content = {
  letter: 'Hello friend.',
  confirmationAttending: 'See you in Santorini',
  confirmationNotAttending: 'Thanks for letting us know',
};

describe('ContentEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('seeds the fields from the passed content', () => {
    render(<ContentEditor content={content} />);
    expect(screen.getByLabelText(/^letter$/i)).toHaveValue('Hello friend.');
    expect(screen.getByLabelText(/confirmation — attending/i)).toHaveValue('See you in Santorini');
    expect(screen.getByLabelText(/confirmation — not attending/i)).toHaveValue('Thanks for letting us know');
  });

  it('posts edited content to the API and shows a saved state', async () => {
    const user = userEvent.setup();
    render(<ContentEditor content={content} />);
    const letter = screen.getByLabelText(/^letter$/i);
    await user.clear(letter);
    await user.type(letter, 'New letter body');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/content',
      expect.objectContaining({ method: 'POST' })
    );
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(JSON.parse(call.body).letter).toBe('New letter body');
    expect(await screen.findByText(/saved\./i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ContentEditor.test.tsx`
Expected: FAIL — cannot resolve `./ContentEditor`.

- [ ] **Step 3: Write minimal implementation** — create `components/ContentEditor.tsx`

```tsx
'use client';
import { useState } from 'react';
import type { SiteContent } from '@/lib/site-content';

interface ContentEditorProps {
  content: SiteContent;
}

export default function ContentEditor({ content }: ContentEditorProps) {
  const [letter, setLetter] = useState(content.letter);
  const [confirmationAttending, setConfirmationAttending] = useState(content.confirmationAttending);
  const [confirmationNotAttending, setConfirmationNotAttending] = useState(content.confirmationNotAttending);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function handleSave() {
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter, confirmationAttending, confirmationNotAttending }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-sage">Site Content</h2>

      <label htmlFor="letter" className="block text-sm font-semibold uppercase tracking-wide text-sage">
        Letter
      </label>
      <p className="mb-1 text-xs text-cream/60">Separate paragraphs with a blank line.</p>
      <textarea
        id="letter"
        className="mb-4 h-48 w-full border border-cream/35 bg-transparent p-2 text-sm text-cream outline-none"
        value={letter}
        onChange={(event) => setLetter(event.target.value)}
      />

      <label htmlFor="conf-attending" className="block text-sm font-semibold uppercase tracking-wide text-sage">
        Confirmation — attending
      </label>
      <input
        id="conf-attending"
        className="mb-4 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-sm text-cream outline-none"
        value={confirmationAttending}
        onChange={(event) => setConfirmationAttending(event.target.value)}
      />

      <label htmlFor="conf-not-attending" className="block text-sm font-semibold uppercase tracking-wide text-sage">
        Confirmation — not attending
      </label>
      <input
        id="conf-not-attending"
        className="mb-4 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-sm text-cream outline-none"
        value={confirmationNotAttending}
        onChange={(event) => setConfirmationNotAttending(event.target.value)}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-terracotta px-5 py-2 text-sm font-bold uppercase tracking-wide text-cream disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-sage">Saved.</span>}
        {status === 'error' && (
          <span className="text-xs text-terracotta">Something went wrong — please try again.</span>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ContentEditor.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire `ContentEditor` into `app/admin/page.tsx`** — replace the entire file

```tsx
import { isAdminAuthed } from '@/lib/admin-session';
import { getAllResponses } from '@/lib/supabase-admin';
import { getSiteContent } from '@/lib/site-content';
import AdminLoginForm from '@/components/AdminLoginForm';
import ResponsesTable from '@/components/ResponsesTable';
import ContentEditor from '@/components/ContentEditor';

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const [responses, content] = await Promise.all([getAllResponses(), getSiteContent()]);
  return (
    <main className="h-dvh overflow-auto bg-navy p-8">
      <ContentEditor content={content} />
      <ResponsesTable responses={responses} />
    </main>
  );
}
```

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass; tsc reports no errors.

- [ ] **Step 7: Commit**

```bash
git add components/ContentEditor.tsx components/ContentEditor.test.tsx app/admin/page.tsx
git commit -m "Add admin ContentEditor for the letter and confirmations"
```

---

## Self-Review Notes

- **Spec coverage:** table + migration (Task 1), defaults from `lib/letter-content.ts` (Task 1 `DEFAULT_SITE_CONTENT`), `mergeSiteContent`/`splitParagraphs`/`getSiteContent` (Task 1), `isAdminAuthed` extraction + admin-page refactor (Task 2), protected upsert API with 401 (Task 3), server-component page + `Wizard` + `force-dynamic` (Task 4), `LetterModule`/`ClosingModule` prop changes (Task 4), `ContentEditor` + admin wiring (Task 5), all three test suites (Tasks 1/2/3/5) and updated module tests (Task 4). All covered.
- **Type consistency:** `SiteContent { letter, confirmationAttending, confirmationNotAttending }` is used identically in `site-content.ts`, `Wizard.tsx`, `ContentEditor.tsx`, and the API body. Row keys `letter` / `confirmation_attending` / `confirmation_not_attending` match between `mergeSiteContent`, the API upsert, and the merge test.
- **Migration application:** Task 1 Step 2 flags that the table must be created in the hosted Supabase project; until then the public site falls back to defaults and saving returns a 500 (surfaced by the editor's error state).
- **Ordering:** Task 4 depends on `getSiteContent`/`splitParagraphs`/`SiteContent` (Task 1); Task 5 depends on the API (Task 3), `isAdminAuthed` (Task 2), and `getSiteContent` (Task 1). Build order 1→5 satisfies all dependencies.
```
