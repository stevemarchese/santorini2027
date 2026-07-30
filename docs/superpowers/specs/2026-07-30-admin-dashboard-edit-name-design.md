# Admin: Dashboard-Style Stats Bar + Editable Name — Design

**Date:** 2026-07-30
**Status:** Approved

## Goal

Two changes to the `/admin` page:

1. **Restyle the summary stats bar** from a flat row of text into stat cards + a mini bar chart, so it reads like a real admin dashboard instead of a debug line.
2. **Make the Name column editable** — click-to-edit inline, so typos/nicknames can be fixed without touching the database directly.

## Current state

- `components/ResponsesTable.tsx` — client component. Stats bar is a `flex flex-wrap` row of plain `<span>` text (`components/ResponsesTable.tsx:86-104` as of commit `e26f37d`). `computeResponsesStats` (`lib/responses-stats.ts`) already returns everything both features need — no backend stats changes required.
- `deleteError` (`components/ResponsesTable.tsx:37`) is a single string-or-null state shown as inline red text above the table, set by `handleDelete`'s failure paths and cleared at the start of `handleSort`/`handleDownload`/`handleDelete`.
- `app/api/admin/responses/[id]/route.ts` exports `DELETE` only, guarded by `isAdminAuthed()`.
- Name is currently a plain `<td>{row.name}</td>` (`components/ResponsesTable.tsx:148`), no interactivity.

## Changes

### 1. Stats bar → cards + bar chart (visual only, no new data)

Replace the `flex` row of spans with:

- **Three stat cards in a row** (equal-width grid), each a bordered box (`border border-cream/25 rounded-md p-3`) with an uppercase `sage` label, a large `cream` number, and an optional smaller sub-line:
  - **Attending** — big number `stats.totalGuests` + "guests", sub-line `{totalAttending}/{totalResponses} responses`.
  - **Avg Hotel Stay** — big number `stats.avgHotelNights` + "nights", or "—" when `null` (unchanged null-handling from today).
  - **Dinner / Cruise** — combined into one card: `"{dinnerGuestCount} dinner · {cruiseGuestCount} cruise"`.
- **One full-width card below the row**: **Window Priority**, rendered as three horizontal bars (one per date window), each a label, a track/fill bar, and the count. Bar fill width is `count / max(1, highestCount) * 100` (so the leading window(s) render full-width, others scale proportionally; when all counts are 0 every bar renders at 0% width). The leading window's (`topPriorityWindow`) bar fill uses `bg-terracotta`; all others use a dimmed `bg-cream/30`. When `topPriorityWindow` is `null` (tie or zero votes), no bar gets the terracotta treatment — all render dimmed.
- Grid is responsive: 3 columns on `md:` and up, stacks to 1 column below that (`grid grid-cols-1 md:grid-cols-3 gap-3`), matching the card row; the Window Priority card spans the full grid width at every breakpoint.
- This is pure presentation — no changes to `lib/responses-stats.ts` or its tests. `ResponsesStats` already has every field these cards need.

### 2. Editable Name (click-to-edit inline)

**API route:** extend `app/api/admin/responses/[id]/route.ts` with a `PATCH` handler alongside the existing `DELETE`:
- Same `isAdminAuthed()` guard → `401` if not authed.
- Body: `{ name: string }`. Trim the name; if empty after trimming, return `400 { error: 'Name is required' }` without touching the database.
- Calls a new `updateResponseName(id: string, name: string): Promise<{ error: string | null }>` in `lib/supabase-admin.ts` — `supabase.from('responses').update({ name }).eq('id', id)`, same error-propagation shape as `deleteResponse`.
- Returns `{ ok: true }` on success, `{ error }` with `500` on a Supabase error.

**`ResponsesTable` changes:**
- Generalize `deleteError` (`string | null`) into `actionError` (`string | null`) — same single inline banner, now shared between delete and rename failures. Cleared at the start of `handleSort`, `handleDownload`, `handleDelete`, and the new rename handler.
- New per-row editing state: `editingId: string | null` and `editingValue: string` (the in-progress input value, separate from the row's saved name so a cancel can revert cleanly).
- Name cell: when `editingId !== row.id`, renders the plain name as a clickable span (`onClick` starts editing, seeds `editingValue` from `row.name`). When `editingId === row.id`, renders an `<input>` instead, autofocused, value bound to `editingValue`.
- Input behavior:
  - `Enter` or `onBlur` → save: if the trimmed value is unchanged from the row's current name, just exit edit mode (no network call). Otherwise call `PATCH /api/admin/responses/${row.id}` with `{ name: trimmedValue }`; on success update `items` in place and exit edit mode; on failure (empty-name 400, or any other non-ok/network-throw) set `actionError` and stay in edit mode with the input still showing the attempted value, so the admin can fix and retry without retyping.
  - `Escape` → cancel: exit edit mode, discard `editingValue`, no network call.
- No native `confirm()` for rename (unlike delete) — it's non-destructive and reversible by editing again.

## Code structure

- `lib/supabase-admin.ts` — add `updateResponseName(id, name)`, same shape/pattern as `deleteResponse`.
- `app/api/admin/responses/[id]/route.ts` — add `PATCH` export alongside existing `DELETE`.
- `components/ResponsesTable.tsx` — stats bar becomes cards/bar-chart markup (no new imports beyond what's already there); Name cell becomes click-to-edit; `deleteError` renamed `actionError`.

## Testing

- `lib/supabase-admin.test.ts` — add `updateResponseName` tests (success, error-message propagation), same pattern as the existing `deleteResponse` tests (module-level `fromMock`, `vi.resetModules()`, dynamic import).
- `app/api/admin/responses/[id]/route.test.ts` — add `PATCH` tests: 401 unauthenticated, 400 on empty/whitespace name (no Supabase call), 200 + `{ ok: true }` on success, 500 on Supabase error.
- `components/ResponsesTable.test.tsx`:
  - Stats bar: update the existing headcount assertions to match the new card markup's text content (same numbers, new DOM shape); add an assertion that the bar chart renders all three window labels/counts, and that the leading window's bar element carries the terracotta fill class while the others don't (mirroring the existing top-window-highlight test pattern).
  - Edit Name: click the name → input appears with current value; type + Enter → `PATCH` called with the new name, row updates, input closes; Escape → input closes, no `PATCH` call, original name still shown; a failed save → `actionError` shown, input stays open with the attempted value.

## Local preview

Before deploying, run `vercel env pull .env.local` once (grabs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, etc. from the linked Vercel project), then `npm run dev` and view `http://localhost:3000/admin`, logging in with the real `ADMIN_PASSWORD`.

## Out of scope (YAGNI)

Editing any field other than Name, undo/history for renames, a confirm-before-save step for renames (spec deliberately treats rename as low-risk/reversible, unlike delete), and any change to the underlying `computeResponsesStats` data/shape.
