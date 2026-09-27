# Confirmation phase: announce the week, collect confirmations

**Date:** 2026-09-27
**Status:** Draft for Steve's review

## Context

The site has been running an "interest" RSVP since 2026-07-30: guests said whether
they could come, which of three date windows worked, party size, hotel nights,
travel timing, and dinner/cruise interest. 14 responses (50 guests) came in.
On 2026-09-27 Steve and Andi locked **Window 1: Tuesday June 30 – Monday July 6,
2027** (which includes the July 4 anniversary).

The site now needs to (a) tell guests the dates are set and (b) collect a firm
confirmation from each household: in or out, who, and hotel dates. Guests book
the Adamastos Hotel themselves.

The responses table has no email column, so the site cannot email the 14
existing responders. Steve sends them the link himself. The new flow collects
email so this is possible next time.

## Goals

- Every returning or new guest can confirm in under a minute.
- Steve and Andi see confirmed headcount and hotel demand by night in `/admin`.
- The 14 interest responses stay visible in `/admin` for comparison.
- Minimal new code: reuse the existing table, submit route, module system,
  admin table, and notification email.

## Non-goals

- Guest-facing email of any kind (invites, reminders, confirmations).
- Editing an existing response by the guest (they just submit again).
- Itinerary, guest list, or booking integration. Later phase.
- Matching confirmations to interest rows by name. Admin eyeballs it.

## Approach

**Phase column on the existing `responses` table.** Existing rows are phase
`interest`; new submissions are phase `confirm`. One table, one `/api/submit`
route, one admin table with a phase toggle. A separate `confirmations` table was
rejected because it doubles the API/email/admin code for 14 rows. Updating
interest rows in place by name was rejected because names vary and it would
silently merge households.

## Guest flow

```
splash → letter → inOut → nameCrew → [attending] hotel → closing → sent
                                   → [not attending] closing → sent
```

Module ids: `splash`, `letter`, `inOut`, `nameCrew`, `hotel`, `closing`.
Deleted: `window`, `dateWindows`, `travelTiming`, `dinnerCruise` (components,
tests, and their `flow.ts` helpers `canAdvanceFromDateWindows`,
`canAdvanceFromTravelTiming`, `canAdvanceFromDinnerCruise`, `toggleWindow`,
`setWindowPriority`, `windowField`).

### Splash
Unchanged except the pill CTA reads **"Dates are set"** instead of "Tell Me
More". (Steve may keep "Tell Me More"; note this in review.)

### Letter
Same component, same admin-editable `letter` content key. Proposed new default
text in `lib/letter-content.ts` (Steve edits freely; the live value can also be
changed in `/admin` without a deploy):

> Hi friend.
>
> You answered, we counted, and the winner is clear: **June 30 through July 6,
> 2027.** Twenty years to the day from the last time most of you watched us do
> this under the watchful eye of Greek Jesus.
>
> Now we need the real thing. Are you in? Who's coming? And if you're staying
> at the Adamastos, which nights? That's it. The rest — dinners, a sunset
> cruise, beach and pool hangs — we'll sort out together closer to the date.
>
> If the week doesn't work, tell us that too. No hard feelings. Twenty years of
> inflation is real.
>
> With love,
> Steve, Andi & Nicolas

The signature-line special case in `SignatureLine` keeps working because the
last two paragraphs are unchanged. CTA on the Letter: **"Count me in"** (opens
the In/Out module; the label is a CTA, not the answer).

### In/Out (`InOutModule`, replaces `WindowModule`)
Wave header title "ThE bIg QueStion", subtitle "June 30 – July 6, 2027".
Body: "We'll be on Santorini from Tuesday June 30 through Monday July 6, 2027.
Group things will happen inside that window." Two pills: **"I'm in"** /
**"Can't make it"**. The Kiku quiz gate triggers on first pill click exactly as
it does today in `WindowModule`. Next enabled once one pill is chosen.

### Name / crew (`NameCrewModule`, extended)
Adds an **Email** field under Name (`type="email"`, required when attending,
optional when not). Crew size pills unchanged. Copy under the email: "So we can
send you the details." Client validation: name non-empty; if attending, email
matches a simple `x@y.z` pattern and crew size chosen.

### Hotel (`HotelModule`, reworked)
Wave header unchanged ("ThE fAmily HoTel" / "Nicely Upgraded Since 2007").
Question: "Staying at the Adamastos Hotel?" Yes / No pills.

On **Yes**, an `ExpandableSection` reveals:
- **Arrive** and **Depart** as native `<input type="date">` fields, styled like
  the existing underline inputs. `min="2027-06-26"`, `max="2027-07-12"`.
  Defaults: arrive `2027-06-30`, depart `2027-07-06`, pre-filled so the common
  case is one click. Depart must be after arrive; the Next button stays disabled
  and a small sage hint reads "Depart needs to be after arrive" until it is.
- A booking note paragraph, admin-editable (`site_content` key
  `hotel_booking_note`), default: "Book directly with the hotel and mention
  you're with Steve & Andi's group." followed by the existing external link to
  `https://adamastoshotel.com/en/`.

On **No**, dates are cleared to null. Steve should confirm the "mention the
group" wording and whether there is a code before launch; it is editable in
`/admin` afterward regardless.

### Closing
Unchanged UI. Submits the draft. Confirmation copy defaults change:
- attending: "You're on the list. Book the hotel when you can — the good rooms
  go. We'll send details as things firm up."
- not attending: unchanged from today.
Both remain admin-editable under the existing keys.

## Data

### Migration `supabase/migrations/0004_confirmation_phase.sql`

```sql
alter table responses
  add column phase text not null default 'interest'
    check (phase in ('interest', 'confirm')),
  add column email text,
  add column arrival_date date,
  add column departure_date date,
  add constraint responses_dates_ordered
    check (arrival_date is null or departure_date is null or departure_date > arrival_date);
```

Existing 14 rows get `phase = 'interest'` via the default. Legacy columns
(`window_*`, `window_priority`, `travel_timing`, `travel_note`,
`dinner_interested`, `cruise_interested`, `hotel_nights`) stay; new rows leave
them at their defaults/null. Steve runs the migration in the Supabase SQL
editor before the deploy (house rule:
get explicit confirmation it ran, not a bare "yes").

### Types (`lib/types.ts`)

`DraftResponse` gains `email: string`, `arrivalDate: string | null`,
`departureDate: string | null` (ISO `YYYY-MM-DD`). The `window*`,
`windowPriority`, `travelTiming`, `travelNote`, `dinnerInterested`,
`cruiseInterested`, `hotelNights` fields are removed from `DraftResponse` and
`EMPTY_DRAFT`. `WindowKey` is removed. `ModuleId` becomes the six ids above.

`ResponseRow` (`lib/payload.ts`) is what the submit route inserts:
`phase: 'confirm'`, `name`, `email`, `attending`, `party_size`, `hotel_staying`,
`arrival_date`, `departure_date`, `note`. `AdminResponse` is what `/admin`
reads and must still carry every column in the table (including legacy ones)
because the interest tab renders them. Define it explicitly rather than as
`ResponseRow & {...}`.

### Validation (`validateDraftForSubmit`)

Server-side, mirrors the client:
- name required; attending required.
- attending → party size ≥ 1; email present and matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- hotel_staying true → both dates present, within `2027-06-26..2027-07-12`,
  departure after arrival.
- not attending → party_size, hotel fields, dates all forced to null.

### Submit route

Unchanged shape. `buildResponseRow` sets `phase: 'confirm'`.

## Admin

### Tabs
`ResponsesTable` gets a two-pill toggle above the stats bar: **Confirmed** (default)
/ **Interest**, filtering rows by `phase`. Tab choice lives in component state;
no URL param.

### Columns
- **Confirmed:** Submitted, Name, Email, Attending, Crew, Hotel (Yes/No), Arrive,
  Depart, Note, Actions. Sortable: submitted, name, attending, crew, arrive.
- **Interest:** today's columns unchanged.

Inline name edit and row delete keep working on both tabs (they key on `id`).

### Stats (`lib/responses-stats.ts`)
`computeResponsesStats(rows)` is called with the active tab's rows. Add a
`phase` parameter so the function knows which cards to produce:
- **Confirmed cards:** Responses, Households in, Guests in (sum of `party_size`
  where attending), Hotel households, plus a **hotel guests by night** strip:
  for each night June 26 → July 11, the sum of `party_size` over attending rows
  with `hotel_staying` and `arrival_date <= night < departure_date`. Rendered as
  the existing bar-chart style (same component the window-priority chart uses),
  nights on the x-axis, labelled by day number with the June 30 / July 6 bars
  highlighted in terracotta.
- **Interest cards:** unchanged from today.

### CSV export (`lib/responses-export.ts`)
`toCsv(rows, phase)` picks the header set for the active tab. Filename gains
the phase: `santorini2027-confirmed.csv` / `santorini2027-interest.csv`.

### Content editor
Add `hotel_booking_note` to `ContentEditor` and `SiteContent`
(`hotelBookingNote`), same pattern as the confirmation keys. Default lives in
`DEFAULT_SITE_CONTENT`.

## Notification email (`lib/email.ts`)

Subject: `CONFIRMED: <name> (in / out)`. Body for attending:

```
<name> — IN
Email: <email>
Crew: <party_size>
Adamastos: yes, arrive Jun 30 → depart Jul 6 (6 nights)   | or: no
Note: <note>
```
Not attending: name, OUT, email if given, note. Recipients unchanged
(`NOTIFY_EMAIL`). Dates formatted in the email as `Mon D`; nights computed as
the day difference.

## Error handling

- Client date inputs outside min/max are rejected by the browser; the server
  re-checks so a hand-crafted POST can't store out-of-range dates.
- Migration not yet run → the insert fails on the unknown `phase` column and
  the route returns 500 with the Supabase message, same as today. This is why
  the migration is confirmed before deploy.
- Email failure is logged and swallowed, as today.

## Testing (Vitest + RTL, existing setup)

- `lib/flow.test.ts`: new transitions; not-attending skips hotel; every
  `canAdvanceFrom*` for the four live modules incl. date-ordering and email
  rules.
- `lib/payload.test.ts`: `validateDraftForSubmit` matrix; `buildResponseRow`
  sets `phase: 'confirm'` and nulls hotel/date fields when not attending or
  not staying.
- `components/modules/InOutModule.test.tsx`, `NameCrewModule.test.tsx`,
  `HotelModule.test.tsx`: render, pill selection, quiz gate trigger, date
  defaults, disabled Next until valid.
- `components/Wizard.test.tsx`: walk both paths end to end.
- `components/ResponsesTable.test.tsx`: tab toggle filters rows; confirmed
  columns; export filename per tab.
- `lib/responses-stats.test.ts`: per-phase cards; nightly hotel counts on a
  small fixture (two households, overlapping and non-overlapping stays).
- `lib/email.test.ts`: attending and not-attending bodies, nights math.
- Tests for deleted modules are deleted.

## Rollout

1. Merge to `main`, run `vercel --prod --yes` under the personal Vercel scope
   (memory: `steve-marcheses-projects`, `gh auth switch --user stevemarchese`
   first).
2. Before deploy: Steve runs migration 0004 in the Supabase SQL editor and
   confirms explicitly.
3. After deploy: Steve reviews the letter and hotel booking note in `/admin`
   and adjusts copy live if wanted.
4. Steve sends the link to the 14 households himself.

## Open items for Steve (do not block the plan)

- Keep "Tell Me More" on the splash or switch to "Dates are set"?
- Exact hotel booking wording; is there a group code?
- Letter copy above is a proposal; edit before or after launch.
