# Admin: Collapsible Site Content Section — Design

**Date:** 2026-07-31
**Status:** Approved

## Goal

Wrap the admin page's "Site Content" editor (letter + confirmation copy + Save) in an accordion that defaults to closed, so it doesn't dominate the top of the page above the responses table/stats.

## Current state

`components/ContentEditor.tsx` renders a `<section>` with an always-visible `<h2>Site Content</h2>` heading followed directly by the letter textarea, two confirmation-copy inputs, and the Save button/status row.

## Changes

Replace the `<section>`/`<h2>` wrapper with a native `<details>`/`<summary>` pair:
- `<details className="group mb-10">` — no `open` attribute, so it renders closed by default.
- `<summary>` replaces the `<h2>`, styled the same (`text-lg font-bold uppercase tracking-wide text-sage`), plus a small chevron (`▸`) that rotates 90° via Tailwind's `group-open:rotate-90` when expanded. `list-none` removes the browser's default disclosure triangle so only our chevron shows. `cursor-pointer` on the summary.
- Everything currently below the heading (letter label/textarea, both confirmation inputs, Save button + status text) moves inside the `<details>`, in a wrapper `<div>` with top margin, unchanged otherwise — same fields, same `handleSave` logic, same state.

No new component, no new API calls, no change to `/api/admin/content` or `lib/site-content.ts`. Native `<details>` gives keyboard (Enter/Space on the summary toggles it) and screen-reader semantics for free — no custom JS toggle state needed.

## Testing

`components/ContentEditor.test.tsx`'s existing two tests currently query the letter/confirmation fields directly without opening anything — since the section now defaults closed, both tests need to click the "Site Content" summary first before querying/interacting with the fields. Add one new test: the fields are not immediately visible/queryable-by-label before the summary is clicked (asserting the closed-by-default behavior itself is real, not just assumed).

## Out of scope (YAGNI)

No animation beyond the chevron rotation (no slide/height transition on the content itself — native `<details>` toggles instantly, which is fine here). No "remember last open/closed state" persistence across page loads.
