# Admin: Delete Submission + Summary Stats — Design

**Date:** 2026-07-30
**Status:** Approved

## Goal

Add two capabilities to the `/admin` RSVP table:

1. **Delete a submission** — remove a response row (e.g. test entries like "Steve Test").
2. **Summary stats bar** — at-a-glance planning numbers computed from the current responses.

## Current state

- `app/admin/page.tsx` — server component. Authenticates via `isAdminAuthed()` (`lib/admin-session.ts`), fetches `getAllResponses()` (`lib/supabase-admin.ts`) and site content, renders `<ContentEditor>` and `<ResponsesTable responses={...} />`.
- `components/ResponsesTable.tsx` — client component (`'use client'`). Takes `responses: AdminResponse[]` as a prop, derives sorted rows each render via `sortResponses` (no local copy of `responses` itself), renders a "Download CSV" button and a sortable-header table.
- `lib/supabase-admin.ts` — `getSupabaseAdminClient()` (service-role client) + `getAllResponses()`.
- Existing authenticated admin API route pattern: `app/api/admin/content/route.ts` — `isAdminAuthed()` guard, returns `401` if not authed, otherwise does the Supabase write and returns `{ ok: true }` or `{ error }`.
- Row shape: `AdminResponse` = `ResponseRow & { id: string; created_at: string }` (`lib/payload.ts`).

## Changes

### 1. Delete a submission

**API route:** `app/api/admin/responses/[id]/route.ts`
- `DELETE` handler, same auth guard as the content route: `if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- Calls a new `deleteResponse(id: string)` in `lib/supabase-admin.ts`: `supabase.from('responses').delete().eq('id', id)`.
- Returns `{ ok: true }` on success, `{ error: error.message }` with status `500` on failure.

**`ResponsesTable` changes:**
- Holds `responses` in local state (`const [items, setItems] = useState(responses)`) instead of reading the prop directly, so a delete updates the UI without a page reload. Sorting/stats derive from `items`.
- Each row gets a "Delete" button in a new trailing column.
- Click flow: `window.confirm(`Delete ${row.name}'s response? This can't be undone.`)` → if confirmed, `fetch('/api/admin/responses/' + row.id, { method: 'DELETE' })` → on success, `setItems` filters out the deleted row; on failure, show an inline error message near the button (e.g. a small red text under the row that clears on next action) rather than a blocking alert.
- No loading spinner needed — deletes are near-instant against Supabase; the button can `disabled` itself for the duration of the in-flight request to prevent double-clicks.

### 2. Summary stats bar

New pure helper `lib/responses-stats.ts`:

```ts
export interface ResponsesStats {
  totalResponses: number;
  totalAttending: number;
  avgHotelNights: number | null; // null when nobody is staying at the hotel
  windowPriorityCounts: { window_1: number; window_2: number; window_3: number };
  topPriorityWindow: 'window_1' | 'window_2' | 'window_3' | null; // null on a tie or zero votes
  dinnerYesCount: number;
  cruiseYesCount: number;
}

export function computeResponsesStats(rows: AdminResponse[]): ResponsesStats
```

- `totalAttending` — count where `attending === true`.
- `avgHotelNights` — average of `hotel_nights` across rows where `hotel_staying === true`, rounded to 1 decimal. `null` if that set is empty (render as "—").
- `windowPriorityCounts` — tally of `window_priority` values (`'window_1' | 'window_2' | 'window_3'`); rows with `null`/other values aren't counted in any bucket.
- `topPriorityWindow` — the key with the highest count in `windowPriorityCounts`; `null` if all counts are zero or there's a tie for first (ambiguous, so don't claim a winner).
- `dinnerYesCount` / `cruiseYesCount` — count where `dinner_interested`/`cruise_interested === true`.

**Rendering in `ResponsesTable`:**
- A stats row above the table (next to/replacing the current "N responses" line), computed via `computeResponsesStats(items)` so it updates live after a delete.
- Display, e.g.:
  - `Attending: 6 / 8`
  - `Avg hotel stay: 3.6 nights`
  - `Window priority: 6/30–7/6 3 · 7/7–7/13 4 · 7/14–7/18 1` with the top one visually bolded/highlighted (only when `topPriorityWindow` is non-null)
  - `Dinner: 7 yes`
  - `Cruise: 6 yes`
- Plain text/flex layout consistent with the existing cream-on-navy admin styling — no new dependencies.

## Code structure

- `lib/supabase-admin.ts` — add `deleteResponse(id: string): Promise<void>`.
- `app/api/admin/responses/[id]/route.ts` — new, `DELETE` handler.
- `lib/responses-stats.ts` — new, `computeResponsesStats`.
- `components/ResponsesTable.tsx` — add local `items` state, Delete column, stats bar rendering.

## Testing

- `lib/responses-stats.test.ts` — empty input; totals/attending count; avg hotel nights (including the "nobody staying" → `null` case and rounding); window priority tally + top-window pick + tie-returns-null; dinner/cruise counts.
- `app/api/admin/responses/[id]/route.test.ts` — `401` when not authed; deletes and returns `{ ok: true }` when authed; propagates Supabase error as `500`.
- `components/ResponsesTable.test.tsx` — clicking Delete + confirming removes the row and updates the stats bar; declining the confirm leaves the row; a failed delete shows an inline error and keeps the row.

## Out of scope (YAGNI)

Undo/soft-delete, bulk delete, and additional stats beyond the five listed above are intentionally excluded.
