# Admin Delete Submission + Summary Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin remove a bad/test submission from the `/admin` RSVP table, and see a live summary stats bar (attending count, avg hotel stay, window priority breakdown, dinner/cruise interest) above the table.

**Architecture:** A pure, unit-tested `computeResponsesStats` helper in `lib/` computes the stats bar values from whatever rows are currently loaded. A new authenticated `DELETE /api/admin/responses/[id]` route (mirroring the existing `/api/admin/content` route's auth-guard pattern) deletes a row via a new `deleteResponse` helper in `lib/supabase-admin.ts`. `components/ResponsesTable.tsx` holds its rows in local state (instead of reading the `responses` prop directly) so a successful delete updates the table and stats bar immediately, without a page reload.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4.

## Global Constraints

- Delete requires a native `window.confirm()` before calling the API — no custom modal.
- The DELETE route uses the same `isAdminAuthed()` guard as `app/api/admin/content/route.ts` and returns `401` when not authed.
- Stats bar shows exactly five numbers: attending count, average hotel stay (nights), window priority breakdown (with the leading window highlighted, or no highlight on a tie/zero votes), dinner yes count, cruise yes count. No other stats — this is intentionally scoped, see spec's "Out of scope."

---

## File Structure

- `lib/responses-stats.ts` — CREATE: `ResponsesStats` type, `computeResponsesStats(rows)` pure function.
- `lib/responses-stats.test.ts` — CREATE: unit tests for the stats calculation.
- `lib/supabase-admin.ts` — MODIFY: add `deleteResponse(id)`.
- `app/api/admin/responses/[id]/route.ts` — CREATE: `DELETE` handler.
- `app/api/admin/responses/[id]/route.test.ts` — CREATE: unit tests for the route.
- `components/ResponsesTable.tsx` — MODIFY: local `items` state, Delete column, stats bar.
- `components/ResponsesTable.test.tsx` — MODIFY: add stats bar + delete tests.

---

## Task 1: Summary stats helper

**Files:**
- Create: `lib/responses-stats.ts`
- Test: `lib/responses-stats.test.ts`

**Interfaces:**
- Consumes: `AdminResponse` type from `lib/payload.ts` (already exists — has `attending: boolean`, `hotel_staying: boolean | null`, `hotel_nights: number | null`, `window_priority: string | null`, `dinner_interested: boolean | null`, `cruise_interested: boolean | null`).
- Produces: `ResponsesStats` interface and `computeResponsesStats(rows: AdminResponse[]): ResponsesStats`, used by Task 3.

- [ ] **Step 1: Write the failing test** — create `lib/responses-stats.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeResponsesStats } from './responses-stats';
import type { AdminResponse } from './payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: 'id',
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

describe('computeResponsesStats', () => {
  it('handles an empty list', () => {
    const stats = computeResponsesStats([]);
    expect(stats.totalResponses).toBe(0);
    expect(stats.totalAttending).toBe(0);
    expect(stats.avgHotelNights).toBeNull();
    expect(stats.windowPriorityCounts).toEqual({ window_1: 0, window_2: 0, window_3: 0 });
    expect(stats.topPriorityWindow).toBeNull();
    expect(stats.dinnerYesCount).toBe(0);
    expect(stats.cruiseYesCount).toBe(0);
  });

  it('counts total responses and attending', () => {
    const rows = [row({ attending: true }), row({ attending: false }), row({ attending: true })];
    const stats = computeResponsesStats(rows);
    expect(stats.totalResponses).toBe(3);
    expect(stats.totalAttending).toBe(2);
  });

  it('averages hotel nights only across those staying, rounded to 1 decimal', () => {
    const rows = [
      row({ hotel_staying: true, hotel_nights: 3 }),
      row({ hotel_staying: true, hotel_nights: 4 }),
      row({ hotel_staying: true, hotel_nights: 4 }),
      row({ hotel_staying: false, hotel_nights: null }),
    ];
    expect(computeResponsesStats(rows).avgHotelNights).toBeCloseTo(3.7, 5);
  });

  it('returns a null average when nobody is staying at the hotel', () => {
    const rows = [row({ hotel_staying: false }), row({ hotel_staying: null })];
    expect(computeResponsesStats(rows).avgHotelNights).toBeNull();
  });

  it('ignores a staying row with a missing nights value', () => {
    const rows = [row({ hotel_staying: true, hotel_nights: 5 }), row({ hotel_staying: true, hotel_nights: null })];
    expect(computeResponsesStats(rows).avgHotelNights).toBe(5);
  });

  it('tallies window priority picks and names the top window', () => {
    const rows = [
      row({ window_priority: 'window_2' }),
      row({ window_priority: 'window_1' }),
      row({ window_priority: 'window_2' }),
    ];
    const stats = computeResponsesStats(rows);
    expect(stats.windowPriorityCounts).toEqual({ window_1: 1, window_2: 2, window_3: 0 });
    expect(stats.topPriorityWindow).toBe('window_2');
  });

  it('returns a null top window on a tie', () => {
    const rows = [row({ window_priority: 'window_1' }), row({ window_priority: 'window_2' })];
    expect(computeResponsesStats(rows).topPriorityWindow).toBeNull();
  });

  it('counts dinner and cruise yes votes', () => {
    const rows = [
      row({ dinner_interested: true, cruise_interested: false }),
      row({ dinner_interested: true, cruise_interested: true }),
      row({ dinner_interested: null, cruise_interested: null }),
    ];
    const stats = computeResponsesStats(rows);
    expect(stats.dinnerYesCount).toBe(2);
    expect(stats.cruiseYesCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/responses-stats.test.ts`
Expected: FAIL — cannot resolve `./responses-stats` / `computeResponsesStats` is not defined.

- [ ] **Step 3: Write minimal implementation** — create `lib/responses-stats.ts`

```typescript
import type { AdminResponse } from './payload';

export interface ResponsesStats {
  totalResponses: number;
  totalAttending: number;
  avgHotelNights: number | null;
  windowPriorityCounts: { window_1: number; window_2: number; window_3: number };
  topPriorityWindow: 'window_1' | 'window_2' | 'window_3' | null;
  dinnerYesCount: number;
  cruiseYesCount: number;
}

export function computeResponsesStats(rows: AdminResponse[]): ResponsesStats {
  const totalResponses = rows.length;
  const totalAttending = rows.filter((r) => r.attending).length;

  const hotelNights = rows
    .filter((r): r is AdminResponse & { hotel_nights: number } => r.hotel_staying === true && r.hotel_nights != null)
    .map((r) => r.hotel_nights);
  const avgHotelNights =
    hotelNights.length === 0
      ? null
      : Math.round((hotelNights.reduce((sum, n) => sum + n, 0) / hotelNights.length) * 10) / 10;

  const windowPriorityCounts = { window_1: 0, window_2: 0, window_3: 0 };
  for (const row of rows) {
    if (row.window_priority === 'window_1') windowPriorityCounts.window_1++;
    else if (row.window_priority === 'window_2') windowPriorityCounts.window_2++;
    else if (row.window_priority === 'window_3') windowPriorityCounts.window_3++;
  }

  const entries = Object.entries(windowPriorityCounts) as ['window_1' | 'window_2' | 'window_3', number][];
  const maxCount = Math.max(...entries.map(([, count]) => count));
  const topEntries = entries.filter(([, count]) => count === maxCount);
  const topPriorityWindow = maxCount === 0 || topEntries.length > 1 ? null : topEntries[0][0];

  const dinnerYesCount = rows.filter((r) => r.dinner_interested === true).length;
  const cruiseYesCount = rows.filter((r) => r.cruise_interested === true).length;

  return {
    totalResponses,
    totalAttending,
    avgHotelNights,
    windowPriorityCounts,
    topPriorityWindow,
    dinnerYesCount,
    cruiseYesCount,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/responses-stats.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/responses-stats.ts lib/responses-stats.test.ts
git commit -m "Add computeResponsesStats helper for admin summary bar"
```

---

## Task 2: Delete API route

**Files:**
- Modify: `lib/supabase-admin.ts`
- Modify: `lib/supabase-admin.test.ts` (already exists — add to it, don't replace it)
- Create: `app/api/admin/responses/[id]/route.ts`
- Test: `app/api/admin/responses/[id]/route.test.ts`

**Interfaces:**
- Consumes: `isAdminAuthed()` from `lib/admin-session.ts` (existing, returns `Promise<boolean>`), `getSupabaseAdminClient()` from `lib/supabase-admin.ts` (existing).
- Produces: `deleteResponse(id: string): Promise<{ error: string | null }>` (exported from `lib/supabase-admin.ts`, used by the route in this task); the route exports `DELETE`, consumed by Task 3's fetch call to `/api/admin/responses/${id}`.

- [ ] **Step 1: Write the failing test for `deleteResponse`** — `lib/supabase-admin.test.ts` already exists (added on another machine, has `getSupabaseAdminClient`/`getAllResponses` tests using a module-level `fromMock` + dynamic `import('./supabase-admin')` pattern because each test needs fresh env vars via `vi.resetModules()`). Add a new `describe('deleteResponse', ...)` block at the end of the file, in that same style — do NOT create a new file or use static `import`/top-level `vi.mock` with a different shape:

```typescript
describe('deleteResponse', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('deletes by id and returns no error on success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ delete: del });

    const { deleteResponse } = await import('./supabase-admin');
    const result = await deleteResponse('abc-123');

    expect(fromMock).toHaveBeenCalledWith('responses');
    expect(eq).toHaveBeenCalledWith('id', 'abc-123');
    expect(result).toEqual({ error: null });
  });

  it('returns the error message on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    const del = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ delete: del });

    const { deleteResponse } = await import('./supabase-admin');
    const result = await deleteResponse('abc-123');

    expect(result).toEqual({ error: 'boom' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: FAIL — `deleteResponse` is not exported (the file's other tests still pass).

- [ ] **Step 3: Add `deleteResponse` to `lib/supabase-admin.ts`**

Append this function after `getAllResponses`:

```typescript
export async function deleteResponse(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').delete().eq('id', id);
  return { error: error?.message ?? null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/supabase-admin.test.ts`
Expected: PASS (5 tests — 3 pre-existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase-admin.ts lib/supabase-admin.test.ts
git commit -m "Add deleteResponse helper"
```

- [ ] **Step 6: Write the failing test for the route** — create `app/api/admin/responses/[id]/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin-session', () => ({ isAdminAuthed: vi.fn() }));
const deleteResponseMock = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({ deleteResponse: (id: string) => deleteResponseMock(id) }));

import { DELETE } from './route';
import { isAdminAuthed } from '@/lib/admin-session';

function req(id: string): Request {
  return new Request(`http://localhost/api/admin/responses/${id}`, { method: 'DELETE' });
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
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run "app/api/admin/responses/[id]/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 8: Write the implementation** — create `app/api/admin/responses/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-session';
import { deleteResponse } from '@/lib/supabase-admin';

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
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run "app/api/admin/responses/[id]/route.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add "app/api/admin/responses/[id]/route.ts" "app/api/admin/responses/[id]/route.test.ts"
git commit -m "Add DELETE /api/admin/responses/[id] route"
```

---

## Task 3: Wire delete + stats bar into ResponsesTable

**Files:**
- Modify: `components/ResponsesTable.tsx` (full rewrite of the current ~115-line file)
- Modify: `components/ResponsesTable.test.tsx` (add stats bar + delete tests to the existing file)

**Interfaces:**
- Consumes: `computeResponsesStats` (Task 1), `DELETE /api/admin/responses/[id]` (Task 2), plus the existing `sortResponses`/`buildResponsesCsv`.
- Produces: no new exports — this is the top-level component `AdminPage` already renders.

- [ ] **Step 1: Write the failing tests** — append to the end of the existing `describe('ResponsesTable', ...)` block in `components/ResponsesTable.test.tsx`, just before its closing `});`

```typescript
  it('renders the summary stats bar', () => {
    const statsData = [
      row({ name: 'A', attending: true, dinner_interested: true, cruise_interested: true }),
      row({ name: 'B', attending: false }),
    ];
    render(<ResponsesTable responses={statsData} />);
    expect(screen.getByText(/attending: 1 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/dinner: 1 yes/i)).toBeInTheDocument();
    expect(screen.getByText(/cruise: 1 yes/i)).toBeInTheDocument();
  });

  describe('delete', () => {
    it('removes the row and updates the stats bar after confirming', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/responses/${data[0].id}`, { method: 'DELETE' });
      expect(await screen.findByText(/2 responses/i)).toBeInTheDocument();
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
  });
```

Also add `vi` to the existing `import { describe, it, expect } from 'vitest';` line at the top of the file, making it `import { describe, it, expect, vi } from 'vitest';`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL — no "Delete" buttons exist yet and no stats text is rendered.

- [ ] **Step 3: Write the implementation** — replace the entire contents of `components/ResponsesTable.tsx`

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

const COLUMNS: { key: SortKey | null; label: string }[] = [
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
  { key: null, label: '' },
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

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
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
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-sage">
        <span>
          Attending: {stats.totalAttending} / {stats.totalResponses}
        </span>
        <span>Avg hotel stay: {stats.avgHotelNights == null ? '—' : `${stats.avgHotelNights} nights`}</span>
        <span>
          Window priority:{' '}
          {WINDOW_KEYS.map((key, i) => (
            <span key={key} className={stats.topPriorityWindow === key ? 'font-bold text-cream' : undefined}>
              {i > 0 ? ' · ' : ''}
              {WINDOW_LABELS[key]} {stats.windowPriorityCounts[key]}
            </span>
          ))}
        </span>
        <span>Dinner: {stats.dinnerYesCount} yes</span>
        <span>Cruise: {stats.cruiseYesCount} yes</span>
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
Expected: PASS (6 tests: 2 existing + 4 new).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass; tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ResponsesTable.tsx components/ResponsesTable.test.tsx
git commit -m "Add delete action and summary stats bar to admin table"
```

---

## Self-Review Notes

- **Spec coverage:** delete route + auth guard + local-state removal (Task 2 + Task 3), native `confirm()` gate (Task 3), inline error on failure (Task 3), all five stats — attending, avg hotel nights, window priority breakdown + top window, dinner yes, cruise yes (Task 1 + Task 3 rendering). All covered.
- **Type consistency:** `AdminResponse` (payload.ts, unchanged), `ResponsesStats`/`computeResponsesStats` (responses-stats.ts) and `deleteResponse` (supabase-admin.ts) are referenced with identical names/signatures across Tasks 1–3.
- **Next.js 16 dynamic route:** `params` is typed as `Promise<{ id: string }>` and awaited, matching the async-params requirement introduced in Next 15+.
- **jsdom:** delete tests use `vi.stubGlobal('fetch', ...)` and `vi.spyOn(window, 'confirm')`, the same pattern already used in `ContentEditor.test.tsx` — no new test infrastructure needed.
