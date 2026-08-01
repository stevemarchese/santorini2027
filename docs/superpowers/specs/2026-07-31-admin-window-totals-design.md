# Admin: Window Totals Box — Design

**Date:** 2026-07-31
**Status:** Approved

## Goal

Add a second stat to the admin dashboard alongside "Window Priority": a "Window Totals" box showing how many responses selected each date window as *available* (`window_1_selected`/`window_2_selected`/`window_3_selected`), independent of which window each guest picked as their single top priority.

## Current state

- `lib/responses-stats.ts`'s `computeResponsesStats` already computes `windowPriorityCounts` (tally of `window_priority`, a single pick per response) and `topPriorityWindow` (the leading pick, or `null` on a tie/zero votes). It has no equivalent tally for the `_selected` boolean fields.
- `components/ResponsesTable.tsx` renders one full-width box (`data-testid="stat-window-priority"`, `md:col-span-3`) with a horizontal bar per window, using `windowPriorityCounts` and highlighting `topPriorityWindow`'s bar in terracotta.

## Changes

### 1. `computeResponsesStats` — new `windowSelectionCounts`

Add a new field, computed the same way as `windowPriorityCounts` but tallying the three `_selected` booleans instead of `window_priority` (a response can count toward multiple windows here, since availability isn't exclusive):

```ts
windowSelectionCounts: { window_1: number; window_2: number; window_3: number };
```

No "top" concept for this one — no highlight, just three counts. `ResponsesStats` gains this one field; every other field is unchanged.

### 2. Rendering — split into two side-by-side boxes

Replace the single full-width `stat-window-priority` box with a full-width wrapper (`md:col-span-3`) containing a `grid grid-cols-1 md:grid-cols-2 gap-3` with two children:
- **Window Priority** (`data-testid="stat-window-priority"`) — unchanged bars/highlight logic, just narrower (half-width on desktop instead of full).
- **Window Totals** (`data-testid="stat-window-totals"`) — same bar-chart visual style, using `windowSelectionCounts`, no highlight (every bar renders the same dimmed fill, since there's no "winner" here — this is a count, not a preference ranking).

Both boxes stack full-width on mobile (`grid-cols-1`), side-by-side on desktop (`md:grid-cols-2`).

## Testing

- `lib/responses-stats.test.ts` — add cases for `windowSelectionCounts`: a response can be counted in more than one window's total (multi-select is not exclusive), zero-selection responses count toward none, empty list yields all-zero counts.
- `components/ResponsesTable.test.tsx` — add a test rendering both boxes and asserting the Window Totals box shows the right per-window counts with no bar carrying the highlight class (unlike the existing Window Priority test, which does assert a highlight).

## Out of scope (YAGNI)

No highlight/"leading window" concept for totals. No change to the underlying `window_priority`/`window_N_selected` data model or the per-row table columns.
