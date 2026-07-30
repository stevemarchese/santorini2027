# Admin-Editable Letter + Post-Submit Copy — Design

**Date:** 2026-07-30
**Status:** Approved

## Goal

Let the admin edit, without a redeploy:

1. **The letter** (shown in the first wizard screen).
2. **The two post-submit confirmation headings** — attending (`See you in Santorini`) and not-attending (`Thanks for letting us know`).

Content moves from hardcoded constants into a Supabase table, with an admin editing UI and a protected save API. The public site reads the content server-side.

## Current state

- **Letter:** `lib/letter-content.ts` exports `LETTER_PARAGRAPHS: string[]`; `components/modules/LetterModule.tsx` imports it directly and maps to `<p>` tags.
- **Post-submit headings:** hardcoded in `components/modules/ClosingModule.tsx` — the `status === 'sent'` branch renders `draft.attending ? 'See you in Santorini' : 'Thanks for letting us know'`.
- **`app/page.tsx`** is a **client component** (`'use client'`) holding the wizard state machine; it renders each module conditionally.
- **`app/admin/page.tsx`** is a server component; after a cookie-hash auth check it renders `<ResponsesTable>`. The auth check is inlined: `session === hashAdminPassword(process.env.ADMIN_PASSWORD)`.

## Approach

**Server-fetch + props.** The public page fetches content server-side and passes it into the (client) wizard, so the letter — the first screen — is server-rendered with no loading flash, and edits appear on the next page load. (Rejected: client-side fetch of a public API, which flashes blank/stale copy before hydration; and a CMS like Sanity, which is overkill for a Supabase project.)

## Storage

New migration `supabase/migrations/0002_create_site_content.sql`:

```sql
create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
```

Keys used: `letter`, `confirmation_attending`, `confirmation_not_attending`. The table may be empty — code supplies defaults, so no seeding is required. Saving performs an upsert.

## Read path (public site)

**`lib/site-content.ts`**

- `SiteContent` shape: `{ letter: string; confirmationAttending: string; confirmationNotAttending: string }`.
- `DEFAULT_SITE_CONTENT` — `letter` = `LETTER_PARAGRAPHS.join('\n\n')`; confirmations = the current hardcoded strings. `lib/letter-content.ts` is retained as the source of the default letter.
- `mergeSiteContent(rows, defaults)` — pure. Takes `{ key, value }[]` and returns a full `SiteContent`, using a row's value when present (and non-empty) else the default. Unit-tested.
- `splitParagraphs(text)` — pure. Splits on one-or-more blank lines, trims each, drops empties, returns `string[]`. Unit-tested.
- `getSiteContent()` — reads all rows from `site_content` via the Supabase admin client and returns `mergeSiteContent(rows, DEFAULT_SITE_CONTENT)`. On query error, returns `DEFAULT_SITE_CONTENT` (never breaks the public page).

**`app/page.tsx`** becomes a **server component**: `const content = await getSiteContent();` then renders `<Wizard content={content} />`. Add `export const dynamic = 'force-dynamic'` so edits reflect immediately.

**`components/Wizard.tsx`** (new client component) — the existing `Home` wizard logic moved verbatim, now accepting `content: SiteContent`. It passes `splitParagraphs(content.letter)` to `LetterModule` as `paragraphs`, and the two confirmation strings to `ClosingModule`.

**`components/modules/LetterModule.tsx`** — add a `paragraphs: string[]` prop; render it instead of importing `LETTER_PARAGRAPHS`.

**`components/modules/ClosingModule.tsx`** — add `confirmationAttending: string` and `confirmationNotAttending: string` props; the `sent` branch renders `draft.attending ? confirmationAttending : confirmationNotAttending`.

## Write path (admin)

**`lib/admin-session.ts`** — `isAdminAuthed(): Promise<boolean>`. Reads the `admin_session` cookie via `next/headers` `cookies()` and compares to `hashAdminPassword(process.env.ADMIN_PASSWORD)` (returns false if the env var is unset). `app/admin/page.tsx` is refactored to use it (behavior identical).

**`app/api/admin/content/route.ts`** (POST)
- If `!(await isAdminAuthed())` → `401 { error: 'Unauthorized' }`.
- Parse body `{ letter, confirmationAttending, confirmationNotAttending }` (strings). On invalid JSON → `400`.
- Upsert three rows into `site_content` (keys above; `updated_at = now()`), via the Supabase admin client. On DB error → `500 { error }`.
- Success → `{ ok: true }`.

**`components/ContentEditor.tsx`** (new client component) — props: the current `SiteContent`. Renders a labeled `<textarea>` for the letter (helper text: "Separate paragraphs with a blank line") and two labeled `<input>`s for the confirmation headings, plus a **Save** button. On save, POSTs JSON to `/api/admin/content`; shows a saving/saved/error status. Styled to match the existing admin (navy bg, cream/sage text).

**`app/admin/page.tsx`** — after auth, fetch `getSiteContent()` and render `<ContentEditor content={content} />` above `<ResponsesTable>`.

## Testing

- `lib/site-content.test.ts` — `splitParagraphs`: blank-line splitting, trimming, ignores runs of blank lines, single-paragraph input, empty string → `[]`. `mergeSiteContent`: empty rows → defaults; present rows override; empty-string row value falls back to default.
- `app/api/admin/content/route.test.ts` — returns 401 when `isAdminAuthed()` is false; on authed request with valid body, calls the Supabase upsert and returns `{ ok: true }`. (Mock `lib/admin-session` and the Supabase admin client, mirroring existing route tests.)
- `components/ContentEditor.test.tsx` — renders the three fields seeded with the passed content; clicking Save POSTs to `/api/admin/content` with the edited values (mock `fetch`).

## Out of scope (YAGNI)

Rich-text editing, version history, per-paragraph fields, and editing the other closing-screen copy (pre-submit headings, note prompt) are excluded.
