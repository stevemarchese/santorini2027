# Admin Sortable Columns + CSV Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the `/admin` RSVP table be sorted by clicking column headers and exported to a CSV file, entirely client-side.

**Architecture:** Two pure, unit-tested helpers in `lib/` (`sortResponses`, `buildResponsesCsv`) hold all logic. `components/ResponsesTable.tsx` becomes a `'use client'` component that owns sort state, renders clickable headers, and wires a "Download CSV" button. The `app/admin/page.tsx` server component is unchanged — it still fetches and passes `responses`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest + Testing Library (jsdom), Tailwind 4.

---

## File Structure

- `lib/payload.ts` — MODIFY: add the shared `AdminResponse` row type (row + `id` + `created_at`).
- `lib/responses-sort.ts` — CREATE: `SortKey` type, `SortDirection` type, `sortResponses(rows, key, dir)` pure function (nulls-last, non-mutating).
- `lib/responses-sort.test.ts` — CREATE: unit tests for sorting.
- `lib/responses-export.ts` — CREATE: `buildResponsesCsv(rows)` pure function (all 12 columns, CSV escaping).
- `lib/responses-export.test.ts` — CREATE: unit tests for CSV.
- `components/ResponsesTable.tsx` — MODIFY: becomes client component with sort state + download button.
- `components/ResponsesTable.test.tsx` — CREATE: light component test (header click reorders rows; download button renders).

---

## Task 1: Shared row type + sort logic

**Files:**
- Modify: `lib/payload.ts` (append after the `ResponseRow` interface, ends at line 18)
- Create: `lib/responses-sort.ts`
- Test: `lib/responses-sort.test.ts`

- [ ] **Step 1: Add the `AdminResponse` type to `lib/payload.ts`**

Append this after the `ResponseRow` interface (after line 18):

```typescript
export type AdminResponse = ResponseRow & { id: string; created_at: string };
```

- [ ] **Step 2: Write the failing test** — create `lib/responses-sort.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sortResponses } from './responses-sort';
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

describe('sortResponses', () => {
  it('sorts by name ascending and descending', () => {
    const rows = [row({ name: 'Charlie' }), row({ name: 'Alice' }), row({ name: 'Bob' })];
    expect(sortResponses(rows, 'name', 'asc').map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(sortResponses(rows, 'name', 'desc').map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts by created_at as dates, not string length', () => {
    const rows = [
      row({ name: 'old', created_at: '2026-01-01T00:00:00.000Z' }),
      row({ name: 'new', created_at: '2026-12-01T00:00:00.000Z' }),
    ];
    expect(sortResponses(rows, 'created_at', 'desc').map((r) => r.name)).toEqual(['new', 'old']);
  });

  it('always places null values last, in both directions', () => {
    const rows = [row({ name: 'a', party_size: 2 }), row({ name: 'b', party_size: null }), row({ name: 'c', party_size: 5 })];
    expect(sortResponses(rows, 'party_size', 'asc').map((r) => r.name)).toEqual(['a', 'c', 'b']);
    expect(sortResponses(rows, 'party_size', 'desc').map((r) => r.name)).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input array', () => {
    const rows = [row({ name: 'B' }), row({ name: 'A' })];
    const before = rows.map((r) => r.name);
    sortResponses(rows, 'name', 'asc');
    expect(rows.map((r) => r.name)).toEqual(before);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/responses-sort.test.ts`
Expected: FAIL — cannot resolve `./responses-sort` / `sortResponses` is not defined.

- [ ] **Step 4: Write minimal implementation** — create `lib/responses-sort.ts`

```typescript
import type { AdminResponse } from './payload';

export type SortKey =
  | 'created_at'
  | 'name'
  | 'attending'
  | 'party_size'
  | 'hotel_nights'
  | 'window_priority'
  | 'travel_timing'
  | 'dinner_interested'
  | 'cruise_interested';

export type SortDirection = 'asc' | 'desc';

function accessor(row: AdminResponse, key: SortKey): number | string | null {
  switch (key) {
    case 'created_at':
      return new Date(row.created_at).getTime();
    case 'name':
      return row.name;
    case 'attending':
      return row.attending ? 1 : 0;
    case 'party_size':
      return row.party_size;
    case 'hotel_nights':
      return row.hotel_nights;
    case 'window_priority':
      return row.window_priority;
    case 'travel_timing':
      return row.travel_timing;
    case 'dinner_interested':
      return row.dinner_interested == null ? null : row.dinner_interested ? 1 : 0;
    case 'cruise_interested':
      return row.cruise_interested == null ? null : row.cruise_interested ? 1 : 0;
  }
}

export function sortResponses(rows: AdminResponse[], key: SortKey, dir: SortDirection): AdminResponse[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((r1, r2) => {
    const a = accessor(r1, key);
    const b = accessor(r2, key);
    if (a == null && b == null) return 0;
    if (a == null) return 1; // nulls always last
    if (b == null) return -1;
    const c =
      typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return c * sign;
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/responses-sort.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/payload.ts lib/responses-sort.ts lib/responses-sort.test.ts
git commit -m "Add sortResponses helper and shared AdminResponse type"
```

---

## Task 2: CSV export logic

**Files:**
- Create: `lib/responses-export.ts`
- Test: `lib/responses-export.test.ts`

- [ ] **Step 1: Write the failing test** — create `lib/responses-export.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { buildResponsesCsv } from './responses-export';
import type { AdminResponse } from './payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: 'id',
    created_at: '2026-07-15T12:00:00.000Z',
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

describe('buildResponsesCsv', () => {
  it('emits a header row even with no data', () => {
    const csv = buildResponsesCsv([]);
    expect(csv).toBe(
      'Submitted,Name,Attending,Party,Hotel,Windows,Priority,Travel,Travel Note,Dinner,Cruise,Note'
    );
  });

  it('formats booleans as Yes/No and nulls as blank', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Steve', attending: false, dinner_interested: true, cruise_interested: false }),
    ]);
    const dataLine = csv.split('\n')[1];
    // Submitted, Name, Attending, Party(blank), Hotel(blank), Windows(blank), Priority(blank),
    // Travel(blank), Travel Note(blank), Dinner, Cruise, Note(blank)
    expect(dataLine).toBe('2026-07-15,Steve,No,,,,,,,Yes,No,');
  });

  it('joins selected date windows and shows hotel nights', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Ana', party_size: 3, hotel_staying: true, hotel_nights: 4, window_1_selected: true, window_3_selected: true }),
    ]);
    expect(csv.split('\n')[1]).toContain('Ana');
    expect(csv.split('\n')[1]).toContain('"6/30-7/6, 7/14-7/18"');
    expect(csv.split('\n')[1]).toContain('"Yes, 4n"');
    expect(csv.split('\n')[1]).toContain(',3,');
  });

  it('escapes commas, quotes, and newlines in free text', () => {
    const csv = buildResponsesCsv([row({ name: 'X', note: 'a, "b"\nc' })]);
    expect(csv.split('\n').length).toBeGreaterThan(2); // embedded newline lives inside a quoted field
    expect(csv).toContain('"a, ""b""\nc"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/responses-export.test.ts`
Expected: FAIL — cannot resolve `./responses-export` / `buildResponsesCsv` is not defined.

- [ ] **Step 3: Write minimal implementation** — create `lib/responses-export.ts`

```typescript
import type { AdminResponse } from './payload';

const HEADERS = [
  'Submitted',
  'Name',
  'Attending',
  'Party',
  'Hotel',
  'Windows',
  'Priority',
  'Travel',
  'Travel Note',
  'Dinner',
  'Cruise',
  'Note',
];

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function windowsValue(row: AdminResponse): string {
  return [
    row.window_1_selected && '6/30-7/6',
    row.window_2_selected && '7/7-7/13',
    row.window_3_selected && '7/14-7/18',
  ]
    .filter(Boolean)
    .join(', ');
}

function hotelValue(row: AdminResponse): string {
  if (row.hotel_staying) return `Yes, ${row.hotel_nights}n`;
  if (row.hotel_staying === false) return 'No';
  return '';
}

function yesNo(value: boolean | null): string {
  return value == null ? '' : value ? 'Yes' : 'No';
}

function rowValues(row: AdminResponse): string[] {
  return [
    row.created_at.slice(0, 10),
    row.name,
    row.attending ? 'Yes' : 'No',
    row.party_size == null ? '' : String(row.party_size),
    hotelValue(row),
    windowsValue(row),
    row.window_priority ?? '',
    row.travel_timing ?? '',
    row.travel_note ?? '',
    yesNo(row.dinner_interested),
    yesNo(row.cruise_interested),
    row.note ?? '',
  ];
}

export function buildResponsesCsv(rows: AdminResponse[]): string {
  const lines = [HEADERS, ...rows.map(rowValues)].map((cols) => cols.map(escapeCsv).join(','));
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/responses-export.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/responses-export.ts lib/responses-export.test.ts
git commit -m "Add buildResponsesCsv helper for admin export"
```

---

## Task 3: Wire sorting + download into ResponsesTable

**Files:**
- Modify: `components/ResponsesTable.tsx` (full rewrite of the 52-line file)
- Test: `components/ResponsesTable.test.tsx`

- [ ] **Step 1: Write the failing test** — create `components/ResponsesTable.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
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

function bodyNames(): string[] {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL — no button named "Name" / "Download CSV" (current table has plain `<th>` headers and no button).

- [ ] **Step 3: Write implementation** — replace the entire contents of `components/ResponsesTable.tsx`

```tsx
'use client';

import { useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';

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
];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const sorted = sortResponses(responses, sortKey, sortDir);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
    const csv = buildResponsesCsv(responses);
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-sage">{responses.length} response{responses.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-cream/35 px-3 py-1.5 text-sm text-cream hover:bg-cream/10"
        >
          Download CSV
        </button>
      </div>
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
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all test files pass; tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ResponsesTable.tsx components/ResponsesTable.test.tsx
git commit -m "Make admin table sortable and add CSV download"
```

---

## Self-Review Notes

- **Spec coverage:** sortable columns (Task 3 + Task 1), null-last sorting (Task 1), default Submitted-desc (Task 3 initial state), non-sortable Windows/Travel Note/Note (COLUMNS `key: null`), CSV download button + Blob + dated filename (Task 3), all-12-columns CSV with escaping/formatting (Task 2). All covered.
- **Type consistency:** `AdminResponse` (payload.ts), `SortKey`/`SortDirection`/`sortResponses` (responses-sort.ts), `buildResponsesCsv` (responses-export.ts) are used with identical names across tasks.
- **Note:** the table cell for "Submitted" keeps `toLocaleDateString()` (matches current UI); the CSV uses ISO `slice(0,10)` for deterministic output — intentional and documented in the spec.
- **jsdom:** the component test does not click Download (jsdom lacks `URL.createObjectURL`); it only asserts the button renders, per the spec.
