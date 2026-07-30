# Admin: Sortable Columns + CSV Export — Design

**Date:** 2026-07-30
**Status:** Approved

## Goal

Add two capabilities to the `/admin` RSVP table:

1. **Sortable columns** — click a header to sort the responses.
2. **CSV export** — a button that downloads all responses as a `.csv`.

Both operate entirely client-side on the already-loaded data. No new API routes, no additional data fetching.

## Current state

- `app/admin/page.tsx` — server component. Authenticates via the `admin_session` cookie, calls `getAllResponses()` (`lib/supabase-admin.ts`, ordered `created_at` desc), and renders `<ResponsesTable responses={...} />`.
- `components/ResponsesTable.tsx` — static server component. A 12-column table with no interactivity.
- Row shape: `ResponseRow & { id: string; created_at: string }` (see `lib/payload.ts` for `ResponseRow`).

## Changes

### 1. `ResponsesTable` becomes a client component

Add `'use client'`. Props are unchanged (`responses` array). `AdminPage` stays a server component and keeps fetching/passing data as-is.

### 2. Sorting

- State: `{ key, dir }` where `dir` is `'asc' | 'desc'`. Default `{ key: 'created_at', dir: 'desc' }` — preserves current behavior (newest first).
- Clicking a sortable header:
  - If it's already the active column, toggle `dir`.
  - Otherwise, make it active with a sensible starting direction (`asc`, except `created_at` which starts `desc`).
- Active column shows a ▲ (asc) / ▼ (desc) indicator.
- **Sortable columns:** Submitted (`created_at`), Name, Attending, Party (`party_size`), Hotel (`hotel_nights`), Priority (`window_priority`), Travel (`travel_timing`), Dinner (`dinner_interested`), Cruise (`cruise_interested`).
- **Non-sortable columns** (free-text / multi-value — sorting adds noise): Windows, Travel Note, Note.
- **Null handling:** null/undefined values always sort last, regardless of direction.

### 3. CSV export

- A **"Download CSV"** button rendered above the table.
- On click: build the CSV string from the full `responses` array (all rows, all 12 columns — export reflects all data, independent of the current on-screen sort), create a `Blob`, and trigger a download via a temporary anchor + `URL.createObjectURL`, then revoke the object URL.
- Filename: `santorini-rsvps-YYYY-MM-DD.csv` (date computed at click time).
- Value formatting in CSV:
  - Booleans → `Yes` / `No`.
  - Nulls / empty → empty string (not the `—` placeholder used in the table).
  - Date (`created_at`) → readable date string.
  - Windows → the joined selected-windows string (e.g. `6/30-7/6, 7/7-7/13`).
  - Hotel → e.g. `Yes, 3n` / `No` / empty.
- Proper CSV escaping: any field containing a comma, double-quote, or newline is wrapped in double-quotes with internal quotes doubled.

## Code structure

Follows the existing `lib/` + colocated Vitest convention.

- `lib/responses-export.ts` — `buildResponsesCsv(rows): string`. Pure function. Owns column order and CSV value formatting + escaping.
- `lib/responses-sort.ts` — `sortResponses(rows, key, dir): rows` plus the per-key value accessors. Pure function. Nulls-last comparator.
- `components/ResponsesTable.tsx` — thin client component. Holds sort state, renders clickable headers with indicators, keeps the existing cell JSX, and wires the Download CSV button to `buildResponsesCsv` + Blob download.

## Testing

- `lib/responses-export.test.ts` — header row present; comma/quote/newline escaping in notes; boolean → Yes/No; nulls → blank; empty input yields header-only output.
- `lib/responses-sort.test.ts` — sorts asc/desc by name and by `created_at`; nulls sort last in both directions; non-mutating (returns a new array).
- `components/ResponsesTable.test.tsx` — light: clicking a header reorders visible rows; the Download CSV button renders. Matches existing component tests (jsdom + Testing Library).

## Out of scope (YAGNI)

Date filtering, pagination, column show/hide, and server-side export are intentionally excluded.
