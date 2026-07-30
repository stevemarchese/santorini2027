# Admin Dashboard Restyle + Editable Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the `/admin` summary stats bar into stat cards + a mini bar chart, and make the Name column click-to-edit inline.

**Architecture:** The stats redesign is pure presentation in `components/ResponsesTable.tsx` — `computeResponsesStats` already returns every value the cards need, so no `lib/responses-stats.ts` changes. Editable Name adds a new `PATCH /api/admin/responses/[id]` handler (mirroring the existing `DELETE` handler's auth-guard pattern) backed by a new `updateResponseName` helper in `lib/supabase-admin.ts`, plus click-to-edit state in `ResponsesTable.tsx` that reuses the existing local-state-update pattern established by delete.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4.

## Global Constraints

- The `PATCH` route uses the same `isAdminAuthed()` guard as the existing `DELETE` handler in the same file and returns `401` when not authed.
- An empty or whitespace-only name returns `400 { error: 'Name is required' }` without calling Supabase.
- Renaming is non-destructive — no `window.confirm()` gate (unlike delete).
- `Escape` cancels an in-progress edit without saving; `Enter` or blur saves. A cancel must not also trigger a save (removing focus from an element being unmounted fires a native blur event — guard against double-firing).
- The stats bar shows exactly: Attending (guest headcount + response count), Avg Hotel Stay, combined Dinner/Cruise, and a Window Priority bar chart (leading window highlighted, or no highlight on a tie/zero votes) — no additional stats.

---

## File Structure

- `lib/supabase-admin.ts` — MODIFY: add `updateResponseName(id, name)`.
- `lib/supabase-admin.test.ts` — MODIFY: add tests for `updateResponseName`.
- `app/api/admin/responses/[id]/route.ts` — MODIFY: add `PATCH` handler.
- `app/api/admin/responses/[id]/route.test.ts` — MODIFY: add `PATCH` tests.
- `components/ResponsesTable.tsx` — MODIFY: stats bar becomes cards + bar chart (Task 2), then Name column becomes click-to-edit (Task 3).
- `components/ResponsesTable.test.tsx` — MODIFY: replace the 3 stats-bar tests with card/bar-chart equivalents (Task 2), add an "edit name" test block (Task 3).

---

## Task 1: `updateResponseName` helper + `PATCH` route

**Files:**
- Modify: `lib/supabase-admin.ts`
- Modify: `lib/supabase-admin.test.ts`
- Modify: `app/api/admin/responses/[id]/route.ts`
- Modify: `app/api/admin/responses/[id]/route.test.ts`

**Interfaces:**
- Consumes: `isAdminAuthed()` (`lib/admin-session.ts`, existing), `getSupabaseAdminClient()` (`lib/supabase-admin.ts`, existing).
- Produces: `updateResponseName(id: string, name: string): Promise<{ error: string | null }>` from `lib/supabase-admin.ts`, and the route's `PATCH` export — both consumed by Task 3's `fetch` call to `/api/admin/responses/${id}` with method `PATCH`.

- [ ] **Step 1: Write the failing test for `updateResponseName`** — append to `lib/supabase-admin.test.ts`, after the existing `describe('deleteResponse', ...)` block, in the same style (module-level `fromMock`, `vi.resetModules()`, dynamic `import()`):

```typescript
describe('updateResponseName', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('updates the name by id and returns no error on success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ update });

    const { updateResponseName } = await import('./supabase-admin');
    const result = await updateResponseName('abc-123', 'New Name');

    expect(fromMock).toHaveBeenCalledWith('responses');
    expect(update).toHaveBeenCalledWith({ name: 'New Name' });
    expect(eq).toHaveBeenCalledWith('id', 'abc-123');
    expect(result).toEqual({ error: null });
  });

  it('returns the error message on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    const update = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ update });

    const { updateResponseName } = await import('./supabase-admin');
    const result = await updateResponseName('abc-123', 'New Name');

    expect(result).toEqual({ error: 'boom' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: FAIL — `updateResponseName` is not exported (the file's other tests still pass).

- [ ] **Step 3: Add `updateResponseName` to `lib/supabase-admin.ts`**

Append after `deleteResponse`:

```typescript
export async function updateResponseName(id: string, name: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').update({ name }).eq('id', id);
  return { error: error?.message ?? null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: PASS (7 tests — 5 pre-existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase-admin.ts lib/supabase-admin.test.ts
git commit -m "Add updateResponseName helper"
```

- [ ] **Step 6: Write the failing test for the `PATCH` route** — replace the entire contents of `app/api/admin/responses/[id]/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin-session', () => ({ isAdminAuthed: vi.fn() }));
const deleteResponseMock = vi.fn();
const updateResponseNameMock = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  deleteResponse: (id: string) => deleteResponseMock(id),
  updateResponseName: (id: string, name: string) => updateResponseNameMock(id, name),
}));

import { DELETE, PATCH } from './route';
import { isAdminAuthed } from '@/lib/admin-session';

function req(id: string): Request {
  return new Request(`http://localhost/api/admin/responses/${id}`, { method: 'DELETE' });
}

function patchReq(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/admin/responses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/admin/responses/[id]', () => {
  beforeEach(() => {
    deleteResponseMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(401);
    expect(deleteResponseMock).not.toHaveBeenCalled();
  });

  it('deletes and returns ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteResponseMock).toHaveBeenCalledWith('abc');
  });

  it('returns 500 with the error message when the delete fails', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    deleteResponseMock.mockResolvedValue({ error: 'boom' });
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'boom' });
  });
});

describe('PATCH /api/admin/responses/[id]', () => {
  beforeEach(() => {
    updateResponseNameMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await PATCH(patchReq('abc', { name: 'New Name' }), ctx('abc'));
    expect(res.status).toBe(401);
    expect(updateResponseNameMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the name is empty or whitespace-only', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await PATCH(patchReq('abc', { name: '   ' }), ctx('abc'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Name is required' });
    expect(updateResponseNameMock).not.toHaveBeenCalled();
  });

  it('trims and updates the name, returning ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await PATCH(patchReq('abc', { name: '  New Name  ' }), ctx('abc'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateResponseNameMock).toHaveBeenCalledWith('abc', 'New Name');
  });

  it('returns 500 with the error message when the update fails', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    updateResponseNameMock.mockResolvedValue({ error: 'boom' });
    const res = await PATCH(patchReq('abc', { name: 'New Name' }), ctx('abc'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'boom' });
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run "app/api/admin/responses/[id]/route.test.ts"`
Expected: FAIL — `PATCH` is not exported from `./route`.

- [ ] **Step 8: Add the `PATCH` handler** — replace the entire contents of `app/api/admin/responses/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { deleteResponse, updateResponseName } from '@/lib/supabase-admin';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await deleteResponse(id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await updateResponseName(id, name);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run "app/api/admin/responses/[id]/route.test.ts"`
Expected: PASS (7 tests — 3 pre-existing DELETE + 4 new PATCH).

- [ ] **Step 10: Run the full suite**

Run: `npx vitest run`
Expected: all test files pass, total test count up from 127 to 133 (6 new: 2 in supabase-admin.test.ts, 4 in route.test.ts — the other 3 tests in the route file's full-file replace are the pre-existing DELETE tests being carried over, not additions).

- [ ] **Step 11: Commit**

```bash
git add "app/api/admin/responses/[id]/route.ts" "app/api/admin/responses/[id]/route.test.ts"
git commit -m "Add PATCH /api/admin/responses/[id] route for renaming"
```

---

## Task 2: Stats bar → cards + bar chart

**Files:**
- Modify: `components/ResponsesTable.tsx` (stats section only — Name column and error-state naming are untouched in this task)
- Modify: `components/ResponsesTable.test.tsx`

**Interfaces:**
- Consumes: `computeResponsesStats` (existing, unchanged) — `totalGuests`, `totalAttending`, `totalResponses`, `avgHotelNights`, `dinnerGuestCount`, `cruiseGuestCount`, `windowPriorityCounts`, `topPriorityWindow`.
- Produces: `data-testid` hooks (`stat-attending`, `stat-hotel`, `stat-dinner-cruise`, `stat-window-priority`) and `data-bar-key` on each priority bar fill — Task 3's tests don't touch these, but keep them intact since Task 3 modifies the same file.

- [ ] **Step 1: Write the failing tests** — replace the entire contents of `components/ResponsesTable.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsesTable from './ResponsesTable';
import type { AdminResponse } from '@/lib/payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: overrides.name ?? 'id',
    created_at: '2026-07-01T00:00:00.000Z',
    name: 'Person',
    attending: true,
    party_size: null,
    hotel_staying: null,
    hotel_nights: null,
    window_1_selected: false,
    window_2_selected: false,
    window_3_selected: false,
    window_priority: null,
    travel_timing: null,
    travel_note: null,
    dinner_interested: null,
    cruise_interested: null,
    note: null,
    ...overrides,
  };
}

function bodyNames(): (string | null)[] {
  const rows = within(screen.getByRole('table').querySelector('tbody') as HTMLElement).getAllByRole('row');
  return rows.map((r) => within(r).getAllByRole('cell')[1].textContent);
}

describe('ResponsesTable', () => {
  const data = [row({ name: 'Charlie' }), row({ name: 'Alice' }), row({ name: 'Bob' })];

  it('reorders rows when the Name header is clicked', async () => {
    const user = userEvent.setup();
    render(<ResponsesTable responses={data} />);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(bodyNames()).toEqual(['Alice', 'Bob', 'Charlie']);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(bodyNames()).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('renders a Download CSV button', () => {
    render(<ResponsesTable responses={data} />);
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
  });

  it('renders the summary stats cards with headcount and hotel/dinner/cruise numbers', () => {
    const statsData = [
      row({ name: 'A', attending: true, party_size: 4, dinner_interested: true, cruise_interested: true }),
      row({ name: 'B', attending: false, party_size: 2 }),
      row({ name: 'C', attending: true, party_size: 2, dinner_interested: true, cruise_interested: false }),
    ];
    render(<ResponsesTable responses={statsData} />);
    const attendingCard = screen.getByTestId('stat-attending');
    expect(within(attendingCard).getByText(/6 guests/i)).toBeInTheDocument();
    expect(within(attendingCard).getByText(/2\/3 responses/i)).toBeInTheDocument();
    expect(screen.getByTestId('stat-dinner-cruise')).toHaveTextContent('6 dinner · 4 cruise');
  });

  it('renders the window priority breakdown as bars with per-window counts and highlights the top window', () => {
    const windowData = [
      row({ name: 'A', window_priority: 'window_2' }),
      row({ name: 'B', window_priority: 'window_1' }),
      row({ name: 'C', window_priority: 'window_2' }),
    ];
    render(<ResponsesTable responses={windowData} />);
    const priorityCard = screen.getByTestId('stat-window-priority');
    expect(within(priorityCard).getByText('6/30-7/6')).toBeInTheDocument();
    expect(within(priorityCard).getByText('7/7-7/13')).toBeInTheDocument();
    expect(within(priorityCard).getByText('7/14-7/18')).toBeInTheDocument();
    expect(within(priorityCard).getByText('1')).toBeInTheDocument();
    expect(within(priorityCard).getByText('2')).toBeInTheDocument();
    const topBar = priorityCard.querySelector('[data-bar-key="window_2"]');
    const nonTopBar = priorityCard.querySelector('[data-bar-key="window_1"]');
    expect(topBar?.className).toContain('bg-terracotta');
    expect(nonTopBar?.className).not.toContain('bg-terracotta');
  });

  it('shows a dash for the average hotel stay when nobody is staying at the hotel', () => {
    const noHotelData = [row({ name: 'A', hotel_staying: false }), row({ name: 'B', hotel_staying: null })];
    render(<ResponsesTable responses={noHotelData} />);
    expect(within(screen.getByTestId('stat-hotel')).getByText('—')).toBeInTheDocument();
  });

  describe('delete', () => {
    it('removes the row and updates the stats bar after confirming', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/responses/${data[0].id}`, { method: 'DELETE' });
      expect(await screen.findByText(/^2 responses$/i)).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });

    it('keeps the row when the confirm is declined', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows an inline error and keeps the row when the delete fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(await screen.findByText(/couldn.t delete/i)).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows an inline error and keeps the row when the fetch promise rejects', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(await screen.findByText(/couldn.t delete/i)).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL — no elements with `data-testid="stat-attending"` etc. exist yet (current markup is plain text spans).

- [ ] **Step 3: Write the implementation** — replace the entire contents of `components/ResponsesTable.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';
import { computeResponsesStats } from '@/lib/responses-stats';

interface ResponsesTableProps {
  responses: AdminResponse[];
}

const COLUMNS: { key: SortKey | null; label: string; srOnly?: boolean }[] = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'name', label: 'Name' },
  { key: 'attending', label: 'Attending' },
  { key: 'party_size', label: 'Party' },
  { key: 'hotel_nights', label: 'Hotel' },
  { key: null, label: 'Windows' },
  { key: 'window_priority', label: 'Priority' },
  { key: 'travel_timing', label: 'Travel' },
  { key: null, label: 'Travel Note' },
  { key: 'dinner_interested', label: 'Dinner' },
  { key: 'cruise_interested', label: 'Cruise' },
  { key: null, label: 'Note' },
  { key: null, label: 'Actions', srOnly: true },
];

const WINDOW_LABELS = { window_1: '6/30-7/6', window_2: '7/7-7/13', window_3: '7/14-7/18' } as const;
const WINDOW_KEYS = Object.keys(WINDOW_LABELS) as (keyof typeof WINDOW_LABELS)[];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [items, setItems] = useState(responses);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sorted = sortResponses(items, sortKey, sortDir);
  const stats = computeResponsesStats(items);
  const windowMaxCount = Math.max(...WINDOW_KEYS.map((key) => stats.windowPriorityCounts[key]));

  function handleSort(key: SortKey) {
    setDeleteError(null);
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
    setDeleteError(null);
    const csv = buildResponsesCsv(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `santorini-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(row: AdminResponse) {
    if (!window.confirm(`Delete ${row.name}'s response? This can't be undone.`)) return;
    setDeleteError(null);
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((current) => current.filter((r) => r.id !== row.id));
      } else {
        setDeleteError(`Couldn't delete ${row.name}'s response — try again.`);
      }
    } catch {
      setDeleteError(`Couldn't delete ${row.name}'s response — try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div data-testid="stat-attending" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Attending</div>
          <div className="text-2xl font-bold text-cream">{stats.totalGuests} guests</div>
          <div className="text-xs text-sage">
            {stats.totalAttending}/{stats.totalResponses} responses
          </div>
        </div>
        <div data-testid="stat-hotel" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Avg Hotel Stay</div>
          <div className="text-2xl font-bold text-cream">
            {stats.avgHotelNights == null ? '—' : `${stats.avgHotelNights} nights`}
          </div>
        </div>
        <div data-testid="stat-dinner-cruise" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Dinner / Cruise</div>
          <div className="text-lg font-bold text-cream">
            {stats.dinnerGuestCount} dinner · {stats.cruiseGuestCount} cruise
          </div>
        </div>
        <div data-testid="stat-window-priority" className="rounded-md border border-cream/25 p-3 md:col-span-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-sage">Window Priority</div>
          {WINDOW_KEYS.map((key) => (
            <div key={key} className="mb-1 flex items-center gap-2 text-xs text-cream last:mb-0">
              <span className="w-20 shrink-0">{WINDOW_LABELS[key]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-cream/10">
                <div
                  data-bar-key={key}
                  className={stats.topPriorityWindow === key ? 'h-full bg-terracotta' : 'h-full bg-cream/30'}
                  style={{ width: `${(stats.windowPriorityCounts[key] / Math.max(1, windowMaxCount)) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right">{stats.windowPriorityCounts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-sage">
          {items.length} response{items.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-cream/35 px-3 py-1.5 text-sm text-cream hover:bg-cream/10"
        >
          Download CSV
        </button>
      </div>

      {deleteError && <p className="mb-2 text-sm text-terracotta">{deleteError}</p>}

      <table className="w-full border-collapse text-sm text-cream">
        <thead>
          <tr className="border-b border-cream/35 text-left uppercase text-sage">
            {COLUMNS.map((col) => (
              <th key={col.label} className="p-2">
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key as SortKey)}
                    className="uppercase hover:text-cream"
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                ) : col.srOnly ? (
                  <span className="sr-only">{col.label}</span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-cream/10">
              <td className="p-2">{new Date(row.created_at).toLocaleDateString()}</td>
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
              <td className="p-2">{row.travel_note ?? '—'}</td>
              <td className="p-2">{row.dinner_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.cruise_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.note ?? '—'}</td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  disabled={deletingId === row.id}
                  className="rounded border border-cream/35 px-2 py-1 text-xs text-cream hover:border-terracotta hover:text-terracotta disabled:opacity-40"
                >
                  {deletingId === row.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (133 total, unchanged from the end of Task 1 — this task's 3 stats tests replace 3 existing ones 1:1, a net-zero change to the overall count); tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ResponsesTable.tsx components/ResponsesTable.test.tsx
git commit -m "Restyle admin stats bar as cards with a window-priority bar chart"
```

---

## Task 3: Click-to-edit Name

**Files:**
- Modify: `components/ResponsesTable.tsx` (adds editing state/handlers, renames `deleteError` → `actionError`, changes the Name cell)
- Modify: `components/ResponsesTable.test.tsx` (adds an "edit name" test block)

**Interfaces:**
- Consumes: `PATCH /api/admin/responses/[id]` (Task 1).
- Produces: no new exports — this is the same top-level component `AdminPage` already renders.

- [ ] **Step 1: Write the failing tests** — append a new `describe('edit name', ...)` block inside the existing `describe('ResponsesTable', ...)` in `components/ResponsesTable.test.tsx`, right after the closing `});` of the `describe('delete', ...)` block (and before the outer describe's closing `});`):

```typescript
  describe('edit name', () => {
    it('shows an input pre-filled with the current name when clicked', async () => {
      const user = userEvent.setup();
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
    });

    it('saves the new name on Enter and updates the row', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Enter}');
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/responses/${data[0].id}`,
        expect.objectContaining({ method: 'PATCH' })
      );
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(JSON.parse(call.body).name).toBe('Charlotte');
      expect(await screen.findByText('Charlotte')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Charlotte')).not.toBeInTheDocument();
    });

    it('cancels on Escape without saving', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Escape}');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows an error and keeps editing when the name is empty', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, '   {Enter}');
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('   ')).toBeInTheDocument();
    });

    it('shows an inline error and keeps editing when the save fails', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Enter}');
      expect(await screen.findByText(/couldn.t save/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Charlotte')).toBeInTheDocument();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL — clicking "Charlie" does nothing yet, no input appears.

- [ ] **Step 3: Write the implementation** — replace the entire contents of `components/ResponsesTable.tsx`:

```tsx
'use client';

import { useRef, useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';
import { computeResponsesStats } from '@/lib/responses-stats';

interface ResponsesTableProps {
  responses: AdminResponse[];
}

const COLUMNS: { key: SortKey | null; label: string; srOnly?: boolean }[] = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'name', label: 'Name' },
  { key: 'attending', label: 'Attending' },
  { key: 'party_size', label: 'Party' },
  { key: 'hotel_nights', label: 'Hotel' },
  { key: null, label: 'Windows' },
  { key: 'window_priority', label: 'Priority' },
  { key: 'travel_timing', label: 'Travel' },
  { key: null, label: 'Travel Note' },
  { key: 'dinner_interested', label: 'Dinner' },
  { key: 'cruise_interested', label: 'Cruise' },
  { key: null, label: 'Note' },
  { key: null, label: 'Actions', srOnly: true },
];

const WINDOW_LABELS = { window_1: '6/30-7/6', window_2: '7/7-7/13', window_3: '7/14-7/18' } as const;
const WINDOW_KEYS = Object.keys(WINDOW_LABELS) as (keyof typeof WINDOW_LABELS)[];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [items, setItems] = useState(responses);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const cancelingEditRef = useRef(false);

  const sorted = sortResponses(items, sortKey, sortDir);
  const stats = computeResponsesStats(items);
  const windowMaxCount = Math.max(...WINDOW_KEYS.map((key) => stats.windowPriorityCounts[key]));

  function handleSort(key: SortKey) {
    setActionError(null);
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
    setActionError(null);
    const csv = buildResponsesCsv(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `santorini-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(row: AdminResponse) {
    if (!window.confirm(`Delete ${row.name}'s response? This can't be undone.`)) return;
    setActionError(null);
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((current) => current.filter((r) => r.id !== row.id));
      } else {
        setActionError(`Couldn't delete ${row.name}'s response — try again.`);
      }
    } catch {
      setActionError(`Couldn't delete ${row.name}'s response — try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  function handleStartEdit(row: AdminResponse) {
    setActionError(null);
    setEditingId(row.id);
    setEditingValue(row.name);
  }

  function handleCancelEdit() {
    // Unmounting a focused input fires a native blur event — this flag lets
    // the blur handler tell "cancel" apart from "focus genuinely left" so a
    // cancel never also triggers a save.
    cancelingEditRef.current = true;
    setEditingId(null);
    setEditingValue('');
  }

  async function handleSaveEdit(row: AdminResponse) {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setActionError('Name is required');
      return;
    }
    if (trimmed === row.name) {
      handleCancelEdit();
      return;
    }
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setItems((current) => current.map((r) => (r.id === row.id ? { ...r, name: trimmed } : r)));
        handleCancelEdit();
      } else {
        setActionError(`Couldn't save ${row.name}'s name — try again.`);
      }
    } catch {
      setActionError(`Couldn't save ${row.name}'s name — try again.`);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div data-testid="stat-attending" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Attending</div>
          <div className="text-2xl font-bold text-cream">{stats.totalGuests} guests</div>
          <div className="text-xs text-sage">
            {stats.totalAttending}/{stats.totalResponses} responses
          </div>
        </div>
        <div data-testid="stat-hotel" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Avg Hotel Stay</div>
          <div className="text-2xl font-bold text-cream">
            {stats.avgHotelNights == null ? '—' : `${stats.avgHotelNights} nights`}
          </div>
        </div>
        <div data-testid="stat-dinner-cruise" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Dinner / Cruise</div>
          <div className="text-lg font-bold text-cream">
            {stats.dinnerGuestCount} dinner · {stats.cruiseGuestCount} cruise
          </div>
        </div>
        <div data-testid="stat-window-priority" className="rounded-md border border-cream/25 p-3 md:col-span-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-sage">Window Priority</div>
          {WINDOW_KEYS.map((key) => (
            <div key={key} className="mb-1 flex items-center gap-2 text-xs text-cream last:mb-0">
              <span className="w-20 shrink-0">{WINDOW_LABELS[key]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-cream/10">
                <div
                  data-bar-key={key}
                  className={stats.topPriorityWindow === key ? 'h-full bg-terracotta' : 'h-full bg-cream/30'}
                  style={{ width: `${(stats.windowPriorityCounts[key] / Math.max(1, windowMaxCount)) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right">{stats.windowPriorityCounts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-sage">
          {items.length} response{items.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-cream/35 px-3 py-1.5 text-sm text-cream hover:bg-cream/10"
        >
          Download CSV
        </button>
      </div>

      {actionError && <p className="mb-2 text-sm text-terracotta">{actionError}</p>}

      <table className="w-full border-collapse text-sm text-cream">
        <thead>
          <tr className="border-b border-cream/35 text-left uppercase text-sage">
            {COLUMNS.map((col) => (
              <th key={col.label} className="p-2">
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key as SortKey)}
                    className="uppercase hover:text-cream"
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                ) : col.srOnly ? (
                  <span className="sr-only">{col.label}</span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-cream/10">
              <td className="p-2">{new Date(row.created_at).toLocaleDateString()}</td>
              <td className="p-2">
                {editingId === row.id ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => {
                      if (cancelingEditRef.current) {
                        cancelingEditRef.current = false;
                        return;
                      }
                      handleSaveEdit(row);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full border-b border-cream/35 bg-transparent text-cream outline-none"
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStartEdit(row)}
                    className="cursor-pointer hover:underline"
                  >
                    {row.name}
                  </span>
                )}
              </td>
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
              <td className="p-2">{row.travel_note ?? '—'}</td>
              <td className="p-2">{row.dinner_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.cruise_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.note ?? '—'}</td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  disabled={deletingId === row.id}
                  className="rounded border border-cream/35 px-2 py-1 text-xs text-cream hover:border-terracotta hover:text-terracotta disabled:opacity-40"
                >
                  {deletingId === row.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: PASS (14 tests — 9 from Task 2 + 5 new).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass (138 total: 133 after Task 1/2 + 5 new in this task); tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ResponsesTable.tsx components/ResponsesTable.test.tsx
git commit -m "Add click-to-edit Name in the admin table"
```

---

## Local Preview

Before deploying, from the repo root:

```bash
vercel env pull .env.local
npm run dev
```

Then visit `http://localhost:3000/admin` and log in with the real `ADMIN_PASSWORD` value (now present in `.env.local`).

---

## Self-Review Notes

- **Spec coverage:** `updateResponseName` + `PATCH` route + auth guard + empty-name 400 (Task 1); stats cards for Attending/Avg Hotel Stay/Dinner-Cruise + Window Priority bar chart with tie/zero-vote no-highlight (Task 2); click-to-edit Name, Enter/blur-saves, Escape-cancels, empty-name and failed-save inline errors via the renamed `actionError` (Task 3); local-preview instructions via `vercel env pull`. All covered.
- **Type consistency:** `updateResponseName(id: string, name: string): Promise<{ error: string | null }>` (supabase-admin.ts) and the route's `PATCH` are referenced identically across Tasks 1 and 3. `ResponsesStats` fields consumed in Task 2/3 match the existing `lib/responses-stats.ts` shape verbatim — no changes needed there.
- **Cross-task file ownership:** Tasks 2 and 3 both fully rewrite `components/ResponsesTable.tsx` and `components/ResponsesTable.test.tsx` — each task's code block is the complete, exact starting point for the next task, so there's no ambiguity about what "modify" means at each step.
- **Known browser/testing gotcha:** the `cancelingEditRef` guard in Task 3 exists specifically because removing a focused DOM node (on Escape) fires a native blur event in real browsers and in jsdom; without the guard, Escape would cancel and then immediately re-trigger a save via the blur handler.
