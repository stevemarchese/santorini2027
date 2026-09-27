# Confirmation Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-window "interest" RSVP with a confirmation flow for the locked week (June 30 – July 6, 2027) that collects in/out, email, crew size, and Adamastos arrival/departure dates, and shows confirmed headcount and hotel demand by night in `/admin` alongside the old interest data.

**Architecture:** Same `responses` table with a new `phase` column (`interest` for the 14 existing rows, `confirm` for new ones) plus `email`, `arrival_date`, `departure_date`. The guest wizard drops to six modules (splash → letter → inOut → nameCrew → hotel → closing). `/admin` gets a Confirmed / Interest tab; stats, sort and CSV export branch on the active tab. One submit route, one notification email builder.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, Supabase (service-role, server only), Resend, Vitest 2 + React Testing Library + user-event, TypeScript 5.

**Spec:** `docs/superpowers/specs/2026-09-27-confirmation-phase-design.md`

## Global Constraints

- Trip window: `2027-06-30` (arrive default) to `2027-07-06` (depart default). Stay dates allowed `2027-06-26` … `2027-07-12` inclusive. Departure must be strictly after arrival.
- Email regex (client and server): `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, applied to the trimmed value. Required only when attending.
- New rows always insert `phase: 'confirm'`. Legacy columns are never written by the new flow.
- Copy: pill labels **"I'm in"** / **"Can't make it"**; Splash CTA **"Dates are set"**; Letter CTA **"Count me in"**; hotel hint **"Depart needs to be after arrive"**; email helper **"So we can send you the details."**
- Notification email subject: `CONFIRMED: <name> (in)` / `CONFIRMED: <name> (out)`.
- Site-content keys: `letter`, `confirmation_attending`, `confirmation_not_attending`, `hotel_booking_note`.
- Deleted modules (component + test): `WindowModule`, `DateWindowsModule`, `TravelTimingModule`, `DinnerCruiseModule`.
- Run tests with `npx vitest run <path>`; the full suite is `npm test`; type-check + build with `npm run build`.
- Commit after every task with the personal identity already set in this repo (`git config user.email` = steve.marchese@gmail.com). Do not push.
- Small deviation from the spec, agreed here: `computeResponsesStats(rows)` keeps a single signature and computes both interest and confirmed figures; `ResponsesTable` decides which cards to show per tab. Simpler than a `phase` parameter and equivalent for the reader.

## Review Focus

1. **Email typed with spaces or capitals** (`"  Steve@Example.com "`): must be accepted and stored trimmed, never rejected. Pinned in Task 1 (`validateDraftForSubmit` + `buildResponseRow`).
2. **Depart equal to arrive** (`2027-07-01` → `2027-07-01`): zero nights, must be rejected client and server. Pinned in Task 1 (`validateStayDates`) and Task 2 (`canAdvanceFromHotel`).
3. **Guest picks hotel Yes (dates default in), then No, then Send**: row must carry `hotel_staying: false` and null dates, never the stale defaults. Pinned in Task 1 (`buildResponseRow`) and Task 7 (HotelModule clears dates on No).
4. **A stay that starts before or ends after the chart range** (`2027-06-26` → `2027-07-12`): nightly counts must include only nights inside the range and never throw. Pinned in Task 9 (`hotelGuestsByNight`).
5. **Interest rows shown under the Confirmed tab**: the 14 legacy rows must be filtered out of Confirmed and appear under Interest. Pinned in Task 11 (tab filter test).

---

## File map

**Create**
- `supabase/migrations/0004_confirmation_phase.sql` — schema change.
- `lib/trip-dates.ts` — trip constants, night math, short date formatting, nightly range.
- `test-mocks/admin-response.ts` — shared `adminRow()` fixture for admin-side tests.
- `components/modules/InOutModule.tsx` (+ `.test.tsx`) — replaces `WindowModule`.

**Modify**
- `lib/types.ts` — `ModuleId`, `DraftResponse`, `EMPTY_DRAFT`.
- `lib/payload.ts` — `ResponseRow`, `AdminResponse`, validation, `isValidEmail`, `validateStayDates`.
- `lib/flow.ts` — six-module routing and `canAdvanceFrom*`.
- `lib/site-content.ts`, `lib/letter-content.ts` — new defaults + `hotelBookingNote`.
- `components/ContentEditor.tsx`, `app/api/admin/content/route.ts` — booking-note field.
- `lib/email.ts` — confirmed-phase body and subject.
- `components/modules/NameCrewModule.tsx` — email field.
- `components/modules/HotelModule.tsx` — date pickers + booking note.
- `components/modules/SplashModule.tsx`, `LetterModule.tsx` — CTA labels.
- `components/Wizard.tsx` — wiring.
- `lib/responses-stats.ts`, `lib/responses-export.ts`, `lib/responses-sort.ts` — phase-aware.
- `components/ResponsesTable.tsx` — tabs, columns, cards.
- Tests beside each of the above.

**Delete**
- `components/modules/{WindowModule,DateWindowsModule,TravelTimingModule,DinnerCruiseModule}.tsx` and their `.test.tsx`.

---

### Task 1: Data layer — migration, trip dates, types, payload

**Files:**
- Create: `supabase/migrations/0004_confirmation_phase.sql`
- Create: `lib/trip-dates.ts`, `lib/trip-dates.test.ts`
- Create: `test-mocks/admin-response.ts`
- Modify: `lib/types.ts`
- Modify: `lib/payload.ts`
- Modify: `lib/payload.test.ts`
- Modify (fixture swap only): `lib/responses-stats.test.ts`, `lib/responses-export.test.ts`, `lib/responses-sort.test.ts`, `components/ResponsesTable.test.tsx`

**Interfaces:**
- Produces `lib/trip-dates.ts`: `TRIP_START = '2027-06-30'`, `TRIP_END = '2027-07-06'`, `STAY_MIN = '2027-06-26'`, `STAY_MAX = '2027-07-12'`, `isIsoDate(v: unknown): v is string`, `nightsBetween(arrive: string, depart: string): number`, `formatShortDate(iso: string): string` (→ `'Jun 30'`), `eachNight(fromIso: string, toIsoExclusive: string): string[]`.
- Produces `lib/types.ts`: `ModuleId = 'splash' | 'letter' | 'inOut' | 'nameCrew' | 'hotel' | 'closing'`; `DraftResponse { name: string; email: string; attending: boolean | null; partySize: number | null; hotelStaying: boolean | null; arrivalDate: string | null; departureDate: string | null; note: string }`; `EMPTY_DRAFT`.
- Produces `lib/payload.ts`: `ResponsePhase = 'interest' | 'confirm'`; `ResponseRow { phase: 'confirm'; name: string; email: string | null; attending: boolean; party_size: number | null; hotel_staying: boolean | null; arrival_date: string | null; departure_date: string | null; note: string | null }`; `AdminResponse` (every DB column, see code); `isValidEmail(v: unknown): boolean`; `validateStayDates(arrival: string | null, departure: string | null): string | null`; `validateDraftForSubmit(draft): string[]`; `buildResponseRow(draft): ResponseRow`.
- Produces `test-mocks/admin-response.ts`: `adminRow(overrides: Partial<AdminResponse>): AdminResponse` with `phase: 'confirm'` default.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0004_confirmation_phase.sql
alter table responses
  add column phase text not null default 'interest'
    check (phase in ('interest', 'confirm')),
  add column email text,
  add column arrival_date date,
  add column departure_date date,
  add constraint responses_dates_ordered
    check (arrival_date is null or departure_date is null or departure_date > arrival_date);

-- Existing rows keep phase = 'interest' via the default. The new flow inserts
-- phase = 'confirm' and never writes the legacy window/travel/dinner columns.
```

- [ ] **Step 2: Write failing tests for trip-dates**

```ts
// lib/trip-dates.test.ts
import { describe, it, expect } from 'vitest';
import { TRIP_START, TRIP_END, STAY_MIN, STAY_MAX, isIsoDate, nightsBetween, formatShortDate, eachNight } from './trip-dates';

describe('trip-dates constants', () => {
  it('pins the locked week and the allowed stay range', () => {
    expect(TRIP_START).toBe('2027-06-30');
    expect(TRIP_END).toBe('2027-07-06');
    expect(STAY_MIN).toBe('2027-06-26');
    expect(STAY_MAX).toBe('2027-07-12');
  });
});

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD and rejects everything else', () => {
    expect(isIsoDate('2027-06-30')).toBe(true);
    expect(isIsoDate('2027-6-30')).toBe(false);
    expect(isIsoDate('06/30/2027')).toBe(false);
    expect(isIsoDate('2027-02-30')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(20270630)).toBe(false);
  });
});

describe('nightsBetween', () => {
  it('counts whole nights, ignoring timezones', () => {
    expect(nightsBetween('2027-06-30', '2027-07-06')).toBe(6);
    expect(nightsBetween('2027-07-01', '2027-07-01')).toBe(0);
    expect(nightsBetween('2027-07-06', '2027-06-30')).toBe(-6);
  });
});

describe('formatShortDate', () => {
  it('renders Mon D without a timezone shift', () => {
    expect(formatShortDate('2027-06-30')).toBe('Jun 30');
    expect(formatShortDate('2027-07-06')).toBe('Jul 6');
  });
});

describe('eachNight', () => {
  it('lists every night from the start up to but excluding the end', () => {
    expect(eachNight('2027-06-29', '2027-07-02')).toEqual(['2027-06-29', '2027-06-30', '2027-07-01']);
  });
  it('returns an empty list when the end is not after the start', () => {
    expect(eachNight('2027-07-02', '2027-07-02')).toEqual([]);
    expect(eachNight('2027-07-03', '2027-07-02')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run lib/trip-dates.test.ts`
Expected: FAIL, "Failed to resolve import './trip-dates'".

- [ ] **Step 4: Implement trip-dates**

```ts
// lib/trip-dates.ts
export const TRIP_START = '2027-06-30';
export const TRIP_END = '2027-07-06';
export const STAY_MIN = '2027-06-26';
export const STAY_MAX = '2027-07-12';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD as a UTC day number so DST and local offsets never matter. */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function nightsBetween(arrive: string, depart: string): number {
  return dayNumber(depart) - dayNumber(arrive);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

function isoFromDayNumber(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Every night from `fromIso` up to, but not including, `toIsoExclusive`. */
export function eachNight(fromIso: string, toIsoExclusive: string): string[] {
  const start = dayNumber(fromIso);
  const end = dayNumber(toIsoExclusive);
  const nights: string[] = [];
  for (let day = start; day < end; day++) nights.push(isoFromDayNumber(day));
  return nights;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run lib/trip-dates.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Replace `lib/types.ts`**

```ts
// lib/types.ts
export type ModuleId = 'splash' | 'letter' | 'inOut' | 'nameCrew' | 'hotel' | 'closing';

export interface DraftResponse {
  name: string;
  email: string;
  attending: boolean | null;
  partySize: number | null;
  hotelStaying: boolean | null;
  /** ISO YYYY-MM-DD */
  arrivalDate: string | null;
  /** ISO YYYY-MM-DD */
  departureDate: string | null;
  note: string;
}

export const EMPTY_DRAFT: DraftResponse = {
  name: '',
  email: '',
  attending: null,
  partySize: null,
  hotelStaying: null,
  arrivalDate: null,
  departureDate: null,
  note: '',
};
```

- [ ] **Step 7: Write the failing payload tests (replace the file)**

```ts
// lib/payload.test.ts
import { describe, it, expect } from 'vitest';
import { buildResponseRow, validateDraftForSubmit, isValidEmail, validateStayDates } from './payload';
import { EMPTY_DRAFT } from './types';

const attending = { ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: true, partySize: 2 };

describe('isValidEmail', () => {
  it('accepts a plain address and rejects junk', () => {
    expect(isValidEmail('steve@example.com')).toBe(true);
    expect(isValidEmail('  Steve@Example.com ')).toBe(true);
    expect(isValidEmail('steve@example')).toBe(false);
    expect(isValidEmail('steve example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('validateStayDates', () => {
  it('returns null for a valid in-range stay', () => {
    expect(validateStayDates('2027-06-30', '2027-07-06')).toBeNull();
  });
  it('requires both dates', () => {
    expect(validateStayDates(null, '2027-07-06')).toBe('Arrival and departure dates are required');
    expect(validateStayDates('2027-06-30', null)).toBe('Arrival and departure dates are required');
  });
  it('rejects malformed dates', () => {
    expect(validateStayDates('06/30/2027', '2027-07-06')).toBe('Dates must be YYYY-MM-DD');
  });
  it('rejects dates outside the allowed range', () => {
    expect(validateStayDates('2027-06-25', '2027-07-06')).toBe('Dates must fall between 2027-06-26 and 2027-07-12');
    expect(validateStayDates('2027-06-30', '2027-07-13')).toBe('Dates must fall between 2027-06-26 and 2027-07-12');
  });
  it('rejects a departure on or before the arrival', () => {
    expect(validateStayDates('2027-07-01', '2027-07-01')).toBe('Depart needs to be after arrive');
    expect(validateStayDates('2027-07-02', '2027-07-01')).toBe('Depart needs to be after arrive');
  });
});

describe('validateDraftForSubmit', () => {
  it('requires a name and an attending answer', () => {
    expect(validateDraftForSubmit(EMPTY_DRAFT)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('passes for a valid not-attending draft with no email', () => {
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toEqual([]);
  });

  it('requires party size and email when attending', () => {
    const errors = validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: true });
    expect(errors).toContain('Party size is required when attending');
    expect(errors).toContain('A valid email is required when attending');
  });

  it('accepts an email with surrounding whitespace and capitals', () => {
    expect(validateDraftForSubmit({ ...attending, email: '  Steve@Example.com ' })).toEqual([]);
  });

  it('requires valid stay dates only when staying at the hotel', () => {
    expect(validateDraftForSubmit({ ...attending, hotelStaying: false })).toEqual([]);
    expect(validateDraftForSubmit({ ...attending, hotelStaying: true })).toContain(
      'Arrival and departure dates are required'
    );
    expect(
      validateDraftForSubmit({ ...attending, hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-01' })
    ).toContain('Depart needs to be after arrive');
    expect(
      validateDraftForSubmit({ ...attending, hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    ).toEqual([]);
  });

  it('does not throw on an empty object payload', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => validateDraftForSubmit({} as any)).not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateDraftForSubmit({} as any)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('does not throw when name is a number instead of a string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 123 as any })).toContain('Name is required');
  });
});

describe('buildResponseRow', () => {
  it('always stamps phase confirm', () => {
    expect(buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false }).phase).toBe('confirm');
  });

  it('nulls out attending-only fields when not attending', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: false,
      partySize: 5,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
      note: 'Miss you all',
    });
    expect(row).toEqual({
      phase: 'confirm',
      name: 'Steve',
      email: null,
      attending: false,
      party_size: null,
      hotel_staying: null,
      arrival_date: null,
      departure_date: null,
      note: 'Miss you all',
    });
  });

  it('carries through attending-path fields and trims/lowercases the email', () => {
    const row = buildResponseRow({
      ...attending,
      email: '  Steve@Example.com ',
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
    });
    expect(row).toEqual(
      expect.objectContaining({
        email: 'steve@example.com',
        party_size: 2,
        hotel_staying: true,
        arrival_date: '2027-06-30',
        departure_date: '2027-07-06',
      })
    );
  });

  it('nulls stale dates when the guest ends on hotel No', () => {
    const row = buildResponseRow({
      ...attending,
      hotelStaying: false,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
    });
    expect(row.hotel_staying).toBe(false);
    expect(row.arrival_date).toBeNull();
    expect(row.departure_date).toBeNull();
  });

  it('keeps an optional email for a not-attending guest', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: false });
    expect(row.email).toBe('steve@example.com');
  });
});
```

- [ ] **Step 8: Run to verify failure**

Run: `npx vitest run lib/payload.test.ts`
Expected: FAIL, `isValidEmail` / `validateStayDates` not exported.

- [ ] **Step 9: Replace `lib/payload.ts`**

```ts
// lib/payload.ts
import type { DraftResponse } from './types';
import { STAY_MIN, STAY_MAX, isIsoDate, nightsBetween } from './trip-dates';

export type ResponsePhase = 'interest' | 'confirm';

/** What the confirmation flow inserts. Legacy interest columns are never written. */
export interface ResponseRow {
  phase: 'confirm';
  name: string;
  email: string | null;
  attending: boolean;
  party_size: number | null;
  hotel_staying: boolean | null;
  arrival_date: string | null;
  departure_date: string | null;
  note: string | null;
}

/** Every column of `responses`, as read by /admin. Interest rows populate the legacy columns. */
export interface AdminResponse {
  id: string;
  created_at: string;
  phase: ResponsePhase;
  name: string;
  email: string | null;
  attending: boolean;
  party_size: number | null;
  hotel_staying: boolean | null;
  hotel_nights: number | null;
  arrival_date: string | null;
  departure_date: string | null;
  window_1_selected: boolean;
  window_2_selected: boolean;
  window_3_selected: boolean;
  window_priority: string | null;
  travel_timing: string | null;
  travel_note: string | null;
  dinner_interested: boolean | null;
  cruise_interested: boolean | null;
  note: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidEmail(value: unknown): boolean {
  return EMAIL_PATTERN.test(asTrimmedString(value));
}

function normalizeEmail(value: unknown): string | null {
  const trimmed = asTrimmedString(value).toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** Null when valid; otherwise the message to show the guest. */
export function validateStayDates(arrival: string | null, departure: string | null): string | null {
  if (!arrival || !departure) return 'Arrival and departure dates are required';
  if (!isIsoDate(arrival) || !isIsoDate(departure)) return 'Dates must be YYYY-MM-DD';
  if (arrival < STAY_MIN || arrival > STAY_MAX || departure < STAY_MIN || departure > STAY_MAX) {
    return `Dates must fall between ${STAY_MIN} and ${STAY_MAX}`;
  }
  if (nightsBetween(arrival, departure) < 1) return 'Depart needs to be after arrive';
  return null;
}

export function validateDraftForSubmit(draft: DraftResponse): string[] {
  const errors: string[] = [];
  if (typeof draft?.name !== 'string' || !draft.name.trim()) errors.push('Name is required');
  if (!draft || draft.attending === null || draft.attending === undefined) errors.push('Attending is required');
  if (draft?.attending === true) {
    if (draft.partySize === null || draft.partySize === undefined || draft.partySize < 1) {
      errors.push('Party size is required when attending');
    }
    if (!isValidEmail(draft.email)) errors.push('A valid email is required when attending');
    if (draft.hotelStaying === true) {
      const dateError = validateStayDates(draft.arrivalDate ?? null, draft.departureDate ?? null);
      if (dateError) errors.push(dateError);
    }
  }
  return errors;
}

export function buildResponseRow(draft: DraftResponse): ResponseRow {
  const attending = draft.attending === true;
  const staying = attending && draft.hotelStaying === true;
  return {
    phase: 'confirm',
    name: asTrimmedString(draft.name),
    email: normalizeEmail(draft.email),
    attending,
    party_size: attending ? draft.partySize : null,
    hotel_staying: attending ? draft.hotelStaying : null,
    arrival_date: staying ? draft.arrivalDate : null,
    departure_date: staying ? draft.departureDate : null,
    note: asTrimmedString(draft.note) || null,
  };
}
```

- [ ] **Step 10: Run to verify pass**

Run: `npx vitest run lib/payload.test.ts`
Expected: PASS (all tests).

- [ ] **Step 11: Add the shared admin fixture and swap the four copies**

```ts
// test-mocks/admin-response.ts
import type { AdminResponse } from '@/lib/payload';

export function adminRow(overrides: Partial<AdminResponse> = {}): AdminResponse {
  return {
    id: overrides.name ?? 'id',
    created_at: '2026-07-01T00:00:00.000Z',
    phase: 'confirm',
    name: 'Person',
    email: null,
    attending: true,
    party_size: null,
    hotel_staying: null,
    hotel_nights: null,
    arrival_date: null,
    departure_date: null,
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
```

In each of `lib/responses-stats.test.ts`, `lib/responses-export.test.ts`, `lib/responses-sort.test.ts`, `components/ResponsesTable.test.tsx`: delete the local `function row(...)` block and its `AdminResponse` type import, add `import { adminRow as row } from '@/test-mocks/admin-response';`. Note `lib/responses-export.test.ts` used `created_at: '2026-07-15T12:00:00.000Z'`; keep that by passing `created_at` in the one test that asserts on it (`'2026-07-15,Steve,No,...'`): change that test's row call to `row({ name: 'Steve', created_at: '2026-07-15T12:00:00.000Z', ... })`.

- [ ] **Step 12: Run the four admin suites**

Run: `npx vitest run lib/responses-stats.test.ts lib/responses-export.test.ts lib/responses-sort.test.ts components/ResponsesTable.test.tsx`
Expected: PASS. (They still exercise interest-only behaviour; Tasks 9–11 change them.)

- [ ] **Step 13: Commit**

```bash
git add supabase/migrations/0004_confirmation_phase.sql lib/trip-dates.ts lib/trip-dates.test.ts lib/types.ts lib/payload.ts lib/payload.test.ts test-mocks/admin-response.ts lib/responses-stats.test.ts lib/responses-export.test.ts lib/responses-sort.test.ts components/ResponsesTable.test.tsx
git commit -m "Add confirmation-phase data layer: migration, trip dates, draft/row types, validation"
```

---

### Task 2: Flow routing for six modules

**Files:**
- Modify: `lib/flow.ts`
- Modify: `lib/flow.test.ts`

**Interfaces:**
- Consumes `DraftResponse`, `ModuleId` (Task 1), `isValidEmail`, `validateStayDates` (Task 1).
- Produces: `getNextModule(current: ModuleId, draft: DraftResponse): ModuleId`, `canAdvanceFromInOut(draft): boolean`, `canAdvanceFromNameCrew(draft): boolean`, `canAdvanceFromHotel(draft): boolean`.

- [ ] **Step 1: Replace `lib/flow.test.ts`**

```ts
// lib/flow.test.ts
import { describe, it, expect } from 'vitest';
import { getNextModule, canAdvanceFromInOut, canAdvanceFromNameCrew, canAdvanceFromHotel } from './flow';
import { EMPTY_DRAFT } from './types';

describe('getNextModule', () => {
  it('walks splash → letter → inOut → nameCrew unconditionally', () => {
    expect(getNextModule('splash', EMPTY_DRAFT)).toBe('letter');
    expect(getNextModule('letter', EMPTY_DRAFT)).toBe('inOut');
    expect(getNextModule('inOut', { ...EMPTY_DRAFT, attending: true })).toBe('nameCrew');
    expect(getNextModule('inOut', { ...EMPTY_DRAFT, attending: false })).toBe('nameCrew');
  });

  it('routes attending guests through hotel and others straight to closing', () => {
    expect(getNextModule('nameCrew', { ...EMPTY_DRAFT, attending: true })).toBe('hotel');
    expect(getNextModule('nameCrew', { ...EMPTY_DRAFT, attending: false })).toBe('closing');
    expect(getNextModule('hotel', EMPTY_DRAFT)).toBe('closing');
    expect(getNextModule('closing', EMPTY_DRAFT)).toBe('closing');
  });
});

describe('canAdvanceFromInOut', () => {
  it('requires an attending answer', () => {
    expect(canAdvanceFromInOut(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromInOut({ ...EMPTY_DRAFT, attending: true })).toBe(true);
    expect(canAdvanceFromInOut({ ...EMPTY_DRAFT, attending: false })).toBe(true);
  });
});

describe('canAdvanceFromNameCrew', () => {
  it('requires only a name when not attending', () => {
    expect(canAdvanceFromNameCrew({ ...EMPTY_DRAFT, attending: false })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toBe(true);
  });

  it('requires name, party size and a valid email when attending', () => {
    const base = { ...EMPTY_DRAFT, attending: true, name: 'Steve' };
    expect(canAdvanceFromNameCrew(base)).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2 })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2, email: 'nope' })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2, email: 'steve@example.com' })).toBe(true);
  });
});

describe('canAdvanceFromHotel', () => {
  it('requires an answer, and valid ordered dates only when staying', () => {
    expect(canAdvanceFromHotel(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: false })).toBe(true);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true })).toBe(false);
    expect(
      canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-01' })
    ).toBe(false);
    expect(
      canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/flow.test.ts`
Expected: FAIL, `canAdvanceFromInOut` not exported.

- [ ] **Step 3: Replace `lib/flow.ts`**

```ts
// lib/flow.ts
import type { DraftResponse, ModuleId } from './types';
import { isValidEmail, validateStayDates } from './payload';

export function getNextModule(current: ModuleId, draft: DraftResponse): ModuleId {
  switch (current) {
    case 'splash':
      return 'letter';
    case 'letter':
      return 'inOut';
    case 'inOut':
      return 'nameCrew';
    case 'nameCrew':
      return draft.attending ? 'hotel' : 'closing';
    case 'hotel':
      return 'closing';
    case 'closing':
      return 'closing';
  }
}

export function canAdvanceFromInOut(draft: DraftResponse): boolean {
  return draft.attending !== null;
}

export function canAdvanceFromNameCrew(draft: DraftResponse): boolean {
  if (!draft.name.trim()) return false;
  if (draft.attending !== true) return true;
  if (draft.partySize === null || draft.partySize < 1) return false;
  return isValidEmail(draft.email);
}

export function canAdvanceFromHotel(draft: DraftResponse): boolean {
  if (draft.hotelStaying === null) return false;
  if (draft.hotelStaying === false) return true;
  return validateStayDates(draft.arrivalDate, draft.departureDate) === null;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/flow.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/flow.ts lib/flow.test.ts
git commit -m "Route the wizard through six confirmation modules"
```

---

### Task 3: Site content — new letter, confirmation copy, hotel booking note

**Files:**
- Modify: `lib/letter-content.ts`
- Modify: `lib/site-content.ts`, `lib/site-content.test.ts`
- Modify: `components/ContentEditor.tsx`, `components/ContentEditor.test.tsx`
- Modify: `app/api/admin/content/route.ts`

**Interfaces:**
- Produces `SiteContent { letter; confirmationAttending; confirmationNotAttending; hotelBookingNote }`, DB key `hotel_booking_note`, `DEFAULT_SITE_CONTENT.hotelBookingNote`.

- [ ] **Step 1: Replace the letter default**

```ts
// lib/letter-content.ts
export const LETTER_PARAGRAPHS: string[] = [
  'Hi friend.',
  'You answered, we counted, and the winner is clear: June 30 through July 6, 2027. Twenty years to the day from the last time most of you watched us do this under the watchful eye of Greek Jesus.',
  "Now we need the real thing. Are you in? Who's coming? And if you're staying at the Adamastos, which nights? That's it. The rest — dinners, a sunset cruise, beach and pool hangs — we'll sort out together closer to the date.",
  "If the week doesn't work, tell us that too. No hard feelings. Twenty years of inflation is real.",
  'With love,',
  'Steve, Andi & Nicolas',
];
```

- [ ] **Step 2: Extend the site-content tests**

In `lib/site-content.test.ts`, replace the `overrides defaults with row values` test and add one:

```ts
  it('overrides defaults with row values', () => {
    const merged = mergeSiteContent(
      [
        { key: 'letter', value: 'New letter' },
        { key: 'confirmation_attending', value: 'Yay' },
        { key: 'confirmation_not_attending', value: 'Aww' },
        { key: 'hotel_booking_note', value: 'Call the front desk' },
      ],
      DEFAULT_SITE_CONTENT
    );
    expect(merged).toEqual({
      letter: 'New letter',
      confirmationAttending: 'Yay',
      confirmationNotAttending: 'Aww',
      hotelBookingNote: 'Call the front desk',
    });
  });

  it('ships a default hotel booking note that tells guests to book directly', () => {
    expect(DEFAULT_SITE_CONTENT.hotelBookingNote).toMatch(/book directly/i);
  });
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run lib/site-content.test.ts`
Expected: FAIL, `hotelBookingNote` missing.

- [ ] **Step 4: Update `lib/site-content.ts`**

Change the interface, defaults, and merge:

```ts
export interface SiteContent {
  letter: string;
  confirmationAttending: string;
  confirmationNotAttending: string;
  hotelBookingNote: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  letter: LETTER_PARAGRAPHS.join('\n\n'),
  confirmationAttending:
    "You're on the list. Book the hotel when you can — the good rooms go. We'll send details as things firm up.",
  confirmationNotAttending:
    "Thanks for letting us know. We will miss you but totally understand this isn't an easy trip to make. It's 20 years of inflation. Greece is more expensive, we all have families. We'll see each other soon. Promise.",
  hotelBookingNote: "Book directly with the hotel and mention you're with Steve & Andi's group.",
};
```

and in `mergeSiteContent` add `hotelBookingNote: pick('hotel_booking_note', defaults.hotelBookingNote),` to the returned object.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run lib/site-content.test.ts`
Expected: PASS.

- [ ] **Step 6: Extend the ContentEditor test**

In `components/ContentEditor.test.tsx`, add `hotelBookingNote: 'Book direct'` to the `content` const, and in `seeds the fields from the passed content once opened` add:

```ts
    expect(screen.getByLabelText(/hotel booking note/i)).toHaveValue('Book direct');
```

Add a new test after `posts edited content…`:

```ts
  it('includes the hotel booking note in the POST body', async () => {
    const user = userEvent.setup();
    render(<ContentEditor content={content} />);
    await user.click(screen.getByText(/site content/i));
    const note = screen.getByLabelText(/hotel booking note/i);
    await user.clear(note);
    await user.type(note, 'Use code MARCHESE');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(JSON.parse(call.body).hotelBookingNote).toBe('Use code MARCHESE');
  });
```

- [ ] **Step 7: Run to verify failure**

Run: `npx vitest run components/ContentEditor.test.tsx`
Expected: FAIL, no label matches /hotel booking note/.

- [ ] **Step 8: Update `components/ContentEditor.tsx`**

Add state `const [hotelBookingNote, setHotelBookingNote] = useState(content.hotelBookingNote);`, include `hotelBookingNote` in the POST body object, and insert this block after the "Confirmation — not attending" input:

```tsx
        <label htmlFor="hotel-booking-note" className="block text-sm font-semibold uppercase tracking-wide text-sage">
          Hotel booking note
        </label>
        <p className="mb-1 text-xs text-cream/60">Shown under the Adamastos dates. The hotel link is added automatically.</p>
        <input
          id="hotel-booking-note"
          className="mb-4 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-sm text-cream outline-none"
          value={hotelBookingNote}
          onChange={(event) => setHotelBookingNote(event.target.value)}
        />
```

- [ ] **Step 9: Update `app/api/admin/content/route.ts`**

Add `hotelBookingNote: string;` to `ContentBody` and this row to `rows`:

```ts
    { key: 'hotel_booking_note', value: body.hotelBookingNote ?? '', updated_at: updatedAt },
```

- [ ] **Step 10: Run to verify pass**

Run: `npx vitest run components/ContentEditor.test.tsx lib/site-content.test.ts`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add lib/letter-content.ts lib/site-content.ts lib/site-content.test.ts components/ContentEditor.tsx components/ContentEditor.test.tsx app/api/admin/content/route.ts
git commit -m "Announce the locked week in the letter, add admin-editable hotel booking note"
```

---

### Task 4: Notification email for confirmations

**Files:**
- Modify: `lib/email.ts`
- Modify: `lib/email.test.ts`

**Interfaces:**
- Consumes `ResponseRow` (Task 1), `formatShortDate`, `nightsBetween` (Task 1).
- Produces: `buildNotificationEmailText(row: ResponseRow): string`, `sendNotificationEmail(client, row)` (signature unchanged).

- [ ] **Step 1: Replace the `buildNotificationEmailText` describe block and the subject assertion**

```ts
describe('buildNotificationEmailText', () => {
  it('lists email, crew, and hotel dates with night count for an attending guest', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      email: 'steve@example.com',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
      note: 'Bringing the dog',
    });
    const text = buildNotificationEmailText(row);
    expect(text).toBe(
      ['Steve — IN', 'Email: steve@example.com', 'Crew: 2', 'Adamastos: yes, arrive Jun 30 → depart Jul 6 (6 nights)', 'Note: Bringing the dog'].join('\n')
    );
  });

  it('says Adamastos: no when not staying', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: true, partySize: 1, hotelStaying: false,
    });
    expect(buildNotificationEmailText(row)).toContain('Adamastos: no');
  });

  it('keeps the not-attending summary short', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });
    const text = buildNotificationEmailText(row);
    expect(text).toBe('Steve — OUT');
  });
});
```

And in `sendNotificationEmail › sends via the injected client…` change the subject expectation to:

```ts
        subject: 'CONFIRMED: Steve (out)',
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/email.test.ts`
Expected: FAIL on the body text and subject.

- [ ] **Step 3: Rewrite the builder and subject in `lib/email.ts`**

Replace `buildNotificationEmailText` and the `subject` line:

```ts
import { formatShortDate, nightsBetween } from './trip-dates';

export function buildNotificationEmailText(row: ResponseRow): string {
  const lines = [`${row.name} — ${row.attending ? 'IN' : 'OUT'}`];
  if (row.email) lines.push(`Email: ${row.email}`);
  if (row.attending) {
    lines.push(`Crew: ${row.party_size}`);
    if (row.hotel_staying && row.arrival_date && row.departure_date) {
      const nights = nightsBetween(row.arrival_date, row.departure_date);
      lines.push(
        `Adamastos: yes, arrive ${formatShortDate(row.arrival_date)} → depart ${formatShortDate(row.departure_date)} (${nights} night${nights === 1 ? '' : 's'})`
      );
    } else {
      lines.push('Adamastos: no');
    }
  }
  if (row.note) lines.push(`Note: ${row.note}`);
  return lines.join('\n');
}
```

```ts
    subject: `CONFIRMED: ${row.name} (${row.attending ? 'in' : 'out'})`,
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/email.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts lib/email.test.ts
git commit -m "Send CONFIRMED notification emails with email, crew, and hotel dates"
```

---

### Task 5: InOutModule replaces WindowModule; delete retired modules

**Files:**
- Create: `components/modules/InOutModule.tsx`, `components/modules/InOutModule.test.tsx`
- Delete: `components/modules/WindowModule.tsx`, `WindowModule.test.tsx`, `DateWindowsModule.tsx`, `DateWindowsModule.test.tsx`, `TravelTimingModule.tsx`, `TravelTimingModule.test.tsx`, `DinnerCruiseModule.tsx`, `DinnerCruiseModule.test.tsx`

**Interfaces:**
- Consumes `canAdvanceFromInOut` (Task 2), `QuizGate`, `ModulePanel`, `ModuleWaveHeader`.
- Produces `InOutModule` props: `{ draft: DraftResponse; onAdvance: (updated: DraftResponse) => void; quizPassed: boolean; onQuizPassed: () => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// components/modules/InOutModule.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InOutModule from './InOutModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('InOutModule', () => {
  it('shows the locked dates and the two pills', () => {
    render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByText('June 30 – July 6, 2027')).toBeInTheDocument();
    expect(screen.getByText(/from tuesday june 30 through monday july 6, 2027/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /i'm in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /can't make it/i })).toBeInTheDocument();
  });

  it('disables Next until a pill is picked, then advances with attending set', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<InOutModule draft={EMPTY_DRAFT} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: true }));
  });

  it('clears party size when switching to Can\'t make it', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(
      <InOutModule draft={{ ...EMPTY_DRAFT, partySize: 3 }} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: false, partySize: null }));
  });

  describe('quiz gate', () => {
    it('shows the quiz when a pill is clicked before passing', async () => {
      const user = userEvent.setup();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('hides the quiz and calls onQuizPassed on the right answer', async () => {
      const user = userEvent.setup();
      const onQuizPassed = vi.fn();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={onQuizPassed} />);
      await user.click(screen.getByRole('button', { name: /can't make it/i }));
      await user.click(screen.getByRole('button', { name: 'Kiku' }));
      expect(onQuizPassed).toHaveBeenCalled();
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });

    it('never shows the quiz once passed', async () => {
      const user = userEvent.setup();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/modules/InOutModule.test.tsx`
Expected: FAIL, cannot resolve `./InOutModule`.

- [ ] **Step 3: Create the module**

```tsx
// components/modules/InOutModule.tsx
'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import QuizGate from '@/components/QuizGate';
import { canAdvanceFromInOut } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface InOutModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function InOutModule({ draft, onAdvance, quizPassed, onQuizPassed }: InOutModuleProps) {
  const [local, setLocal] = useState(draft);
  const [showQuiz, setShowQuiz] = useState(false);

  function maybeTriggerQuiz() {
    if (!quizPassed && !showQuiz) setShowQuiz(true);
  }

  if (showQuiz && !quizPassed) {
    return (
      <QuizGate
        onPass={() => {
          setShowQuiz(false);
          onQuizPassed();
        }}
      />
    );
  }

  const pill = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
      selected ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
    }`;

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader title="ThE bIg QueStion" subtitle="June 30 – July 6, 2027" titleClassName="text-[24px]" />
      <p className="mt-[6px] text-sm text-cream">
        We&apos;ll be on Santorini from Tuesday June 30 through Monday July 6, 2027. Group things will happen
        inside that window.
      </p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-sage">Are you in? *</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: true });
          }}
          className={pill(local.attending === true)}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: false, partySize: null });
          }}
          className={pill(local.attending === false)}
        >
          Can&apos;t make it
        </button>
      </div>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromInOut(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run components/modules/InOutModule.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Delete the retired modules**

```bash
git rm components/modules/WindowModule.tsx components/modules/WindowModule.test.tsx \
  components/modules/DateWindowsModule.tsx components/modules/DateWindowsModule.test.tsx \
  components/modules/TravelTimingModule.tsx components/modules/TravelTimingModule.test.tsx \
  components/modules/DinnerCruiseModule.tsx components/modules/DinnerCruiseModule.test.tsx
```

Then `grep -rn "WindowModule\|DateWindowsModule\|TravelTimingModule\|DinnerCruiseModule" components lib app` should list only `components/Wizard.tsx` (fixed in Task 8).

- [ ] **Step 6: Commit**

```bash
git add components/modules/InOutModule.tsx components/modules/InOutModule.test.tsx
git commit -m "Add In/Out module for the locked week, retire window/travel/dinner modules"
```

---

### Task 6: NameCrewModule collects email

**Files:**
- Modify: `components/modules/NameCrewModule.tsx`
- Modify: `components/modules/NameCrewModule.test.tsx`

**Interfaces:**
- Consumes `canAdvanceFromNameCrew` (Task 2). Props unchanged.

- [ ] **Step 1: Update the tests**

Replace the first test and add two:

```tsx
  it('advances with name, email and party size when attending', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={onAdvance} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', email: 'steve@example.com', partySize: 2 })
    );
  });

  it('keeps Next disabled while the email is invalid when attending', async () => {
    const user = userEvent.setup();
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={vi.fn()} onBack={vi.fn()} />);
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.type(screen.getByLabelText(/^email/i), 'steve@nowhere');
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/^email/i), '.com');
    expect(screen.getByRole('button', { name: /^next/i })).toBeEnabled();
  });

  it('shows the email helper text and marks email optional when not attending', () => {
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: false }} onAdvance={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('So we can send you the details.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).not.toBeRequired();
  });
```

Also update the existing `offers six party-size pills` test: no change needed. The `advances with just a name when not attending` test stays as-is (email optional).

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/modules/NameCrewModule.test.tsx`
Expected: FAIL, no label /^email/.

- [ ] **Step 3: Add the email field**

In `components/modules/NameCrewModule.tsx`, after the name `<input … />` insert:

```tsx
      <label htmlFor="email" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Email {local.attending === true ? '*' : ''}
      </label>
      <p className="text-xs text-sage">So we can send you the details.</p>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required={local.attending === true}
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={local.email}
        onChange={(event) => setLocal({ ...local, email: event.target.value })}
      />
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run components/modules/NameCrewModule.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/modules/NameCrewModule.tsx components/modules/NameCrewModule.test.tsx
git commit -m "Collect guest email on the name/crew step"
```

---

### Task 7: HotelModule with arrival/departure dates and booking note

**Files:**
- Modify: `components/modules/HotelModule.tsx`
- Modify: `components/modules/HotelModule.test.tsx`

**Interfaces:**
- Consumes `canAdvanceFromHotel` (Task 2), `validateStayDates` (Task 1), `TRIP_START`, `TRIP_END`, `STAY_MIN`, `STAY_MAX` (Task 1).
- Produces props: `{ draft: DraftResponse; bookingNote: string; onAdvance: (updated: DraftResponse) => void; onBack: () => void }`.

- [ ] **Step 1: Replace the test file**

```tsx
// components/modules/HotelModule.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelModule from './HotelModule';
import { EMPTY_DRAFT } from '@/lib/types';

const NOTE = "Book directly and mention Steve & Andi's group.";

function renderHotel(overrides = {}, onAdvance = vi.fn(), onBack = vi.fn()) {
  render(<HotelModule draft={{ ...EMPTY_DRAFT, ...overrides }} bookingNote={NOTE} onAdvance={onAdvance} onBack={onBack} />);
  return { onAdvance, onBack };
}

describe('HotelModule', () => {
  it('links the hotel name and asks the staying question', () => {
    renderHotel();
    const link = screen.getByRole('link', { name: 'Adamastos Hotel' });
    expect(link).toHaveAttribute('href', 'https://adamastoshotel.com/en/');
    expect(link.parentElement?.textContent).toBe('Staying at the Adamastos Hotel? *');
  });

  it('pre-fills the trip dates on Yes and advances with them', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-06-30');
    expect(screen.getByLabelText(/^depart/i)).toHaveValue('2027-07-06');
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    );
  });

  it('bounds the date inputs to the allowed stay range', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveAttribute('min', '2027-06-26');
    expect(screen.getByLabelText(/^arrive/i)).toHaveAttribute('max', '2027-07-12');
    expect(screen.getByLabelText(/^depart/i)).toHaveAttribute('min', '2027-06-26');
    expect(screen.getByLabelText(/^depart/i)).toHaveAttribute('max', '2027-07-12');
  });

  it('disables Next and shows the hint when depart is not after arrive', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-06-30' } });
    expect(screen.getByText('Depart needs to be after arrive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-07-02' } });
    expect(screen.queryByText('Depart needs to be after arrive')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeEnabled();
  });

  it('shows the booking note with the hotel link when staying', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /adamastos/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('clears the dates when the guest switches to No', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    await user.click(screen.getByRole('button', { name: /^no$/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: false, arrivalDate: null, departureDate: null })
    );
  });

  it('keeps dates the guest already chose when returning to the step', async () => {
    const user = userEvent.setup();
    renderHotel({ hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-04' });
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-07-01');
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-07-01');
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderHotel();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run components/modules/HotelModule.test.tsx`
Expected: FAIL (no `bookingNote` prop, no date inputs).

- [ ] **Step 3: Replace `components/modules/HotelModule.tsx`**

```tsx
// components/modules/HotelModule.tsx
'use client';
import { useState } from 'react';
import ExpandableSection from '@/components/ExpandableSection';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromHotel } from '@/lib/flow';
import { validateStayDates } from '@/lib/payload';
import { STAY_MAX, STAY_MIN, TRIP_END, TRIP_START } from '@/lib/trip-dates';
import type { DraftResponse } from '@/lib/types';

const HOTEL_URL = 'https://adamastoshotel.com/en/';

interface HotelModuleProps {
  draft: DraftResponse;
  bookingNote: string;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

function HotelLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={HOTEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-cream"
    >
      {children}
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

export default function HotelModule({ draft, bookingNote, onAdvance, onBack }: HotelModuleProps) {
  const [local, setLocal] = useState(draft);
  const staying = local.hotelStaying === true;
  const dateError = staying ? validateStayDates(local.arrivalDate, local.departureDate) : null;
  const showHint = staying && local.arrivalDate !== null && local.departureDate !== null && dateError !== null;

  function chooseYes() {
    setLocal({
      ...local,
      hotelStaying: true,
      arrivalDate: local.arrivalDate ?? TRIP_START,
      departureDate: local.departureDate ?? TRIP_END,
    });
  }

  function chooseNo() {
    setLocal({ ...local, hotelStaying: false, arrivalDate: null, departureDate: null });
  }

  const pill = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
      selected ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
    }`;
  const dateInput = 'mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none [color-scheme:dark]';

  return (
    <ModulePanel>
      <ModuleWaveHeader title="ThE fAmily HoTel" subtitle="Nicely Upgraded Since 2007" titleClassName="text-[24px]" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">
        Staying at the <HotelLink>Adamastos Hotel</HotelLink>? *
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={chooseYes} className={pill(local.hotelStaying === true)}>
          Yes
        </button>
        <button type="button" onClick={chooseNo} className={pill(local.hotelStaying === false)}>
          No
        </button>
      </div>
      <ExpandableSection open={staying}>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="arrive" className="block text-sm font-semibold uppercase tracking-wide text-sage">
              Arrive *
            </label>
            <input
              id="arrive"
              type="date"
              min={STAY_MIN}
              max={STAY_MAX}
              className={dateInput}
              value={local.arrivalDate ?? ''}
              onChange={(event) => setLocal({ ...local, arrivalDate: event.target.value || null })}
            />
          </div>
          <div>
            <label htmlFor="depart" className="block text-sm font-semibold uppercase tracking-wide text-sage">
              Depart *
            </label>
            <input
              id="depart"
              type="date"
              min={STAY_MIN}
              max={STAY_MAX}
              className={dateInput}
              value={local.departureDate ?? ''}
              onChange={(event) => setLocal({ ...local, departureDate: event.target.value || null })}
            />
          </div>
        </div>
        {showHint && <p className="mt-2 text-xs text-sage">{dateError}</p>}
        <p className="mt-4 text-xs leading-relaxed text-cream/80">
          {bookingNote} <HotelLink>adamastoshotel.com</HotelLink>
        </p>
      </ExpandableSection>
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm font-semibold uppercase tracking-wide text-sage">
          <span className="animate-arrow-bob">←</span> Back
        </button>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromHotel(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
```

Note: the test `links the hotel name` asserts the question paragraph's full text is `Staying at the Adamastos Hotel? *`. If jsdom renders `?` and `*` with different spacing than expected, adjust the JSX whitespace, not the test.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run components/modules/HotelModule.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add components/modules/HotelModule.tsx components/modules/HotelModule.test.tsx
git commit -m "Ask for Adamastos arrival/departure dates with a booking note"
```

---

### Task 8: Wizard wiring, Splash/Letter CTAs

**Files:**
- Modify: `components/Wizard.tsx`, `components/Wizard.test.tsx`
- Modify: `components/modules/SplashModule.tsx`, `SplashModule.test.tsx`
- Modify: `components/modules/LetterModule.tsx`, `LetterModule.test.tsx`

**Interfaces:**
- Consumes `InOutModule` (Task 5), `HotelModule` with `bookingNote` (Task 7), `SiteContent.hotelBookingNote` (Task 3), `getNextModule` (Task 2).

- [ ] **Step 1: Update CTA tests**

`SplashModule.test.tsx`: change `/tell me more/i` to `/dates are set/i` (both the test title text and the query).
`LetterModule.test.tsx`: change `/give us some info/i` to `/count me in/i` (title and query).

- [ ] **Step 2: Replace `components/Wizard.test.tsx`**

```tsx
// components/Wizard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wizard from './Wizard';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content';

async function reachInOut(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /dates are set/i }));
  await user.click(screen.getByRole('button', { name: /count me in/i }));
}

describe('Wizard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('starts on the splash screen and reveals the Letter after Dates are set', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SAntOrIni! PaRT DeUx');
    await user.click(screen.getByRole('button', { name: /dates are set/i }));
    expect(screen.getByRole('button', { name: /count me in/i })).toBeInTheDocument();
  });

  it('does not re-show the quiz gate after passing it once and navigating back', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    await reachInOut(user);
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
  });

  it('walks an attending guest through hotel to send', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    await reachInOut(user);
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByText(DEFAULT_SITE_CONTENT.hotelBookingNote)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.click(screen.getByRole('button', { name: /^send$/i }));
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toMatchObject({
      name: 'Steve', email: 'steve@example.com', attending: true, partySize: 2,
      hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06',
    });
    expect(await screen.findByText(DEFAULT_SITE_CONTENT.confirmationAttending)).toBeInTheDocument();
  });

  it('skips the hotel step for a guest who cannot make it', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    await reachInOut(user);
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    await user.type(screen.getByLabelText(/^name/i), 'Laura');
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(screen.queryByLabelText(/^arrive/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run components/Wizard.test.tsx components/modules/SplashModule.test.tsx components/modules/LetterModule.test.tsx`
Expected: FAIL (old CTA labels, old module imports).

- [ ] **Step 4: Update the CTAs**

`components/modules/SplashModule.tsx`: change the PillButton text `Tell Me More` → `Dates are set`.
`components/modules/LetterModule.tsx`: change `Give Us Some Info` → `Count me in`.

- [ ] **Step 5: Rewrite `components/Wizard.tsx`**

```tsx
// components/Wizard.tsx
'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import AboutIcon from '@/components/AboutIcon';
import WeatherWidget from '@/components/WeatherWidget';
import SplashModule from '@/components/modules/SplashModule';
import LetterModule from '@/components/modules/LetterModule';
import InOutModule from '@/components/modules/InOutModule';
import NameCrewModule from '@/components/modules/NameCrewModule';
import HotelModule from '@/components/modules/HotelModule';
import ClosingModule from '@/components/modules/ClosingModule';
import { getNextModule } from '@/lib/flow';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse, ModuleId } from '@/lib/types';
import { splitParagraphs, type SiteContent } from '@/lib/site-content';

interface WizardProps {
  content: SiteContent;
}

export default function Wizard({ content }: WizardProps) {
  const [moduleId, setModuleId] = useState<ModuleId>('splash');
  const [draft, setDraft] = useState<DraftResponse>(EMPTY_DRAFT);
  const [history, setHistory] = useState<ModuleId[]>([]);
  const [quizPassed, setQuizPassed] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const weatherOverlapsPanel = moduleId === 'splash' || moduleId === 'letter' || aboutOpen;
  const letterParagraphs = splitParagraphs(content.letter);

  function advance(updated: DraftResponse) {
    setDraft(updated);
    setHistory([...history, moduleId]);
    setModuleId(getNextModule(moduleId, updated));
  }

  function goBack() {
    if (history.length === 0) return;
    setModuleId(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  return (
    <main>
      <Hero />
      <AboutIcon
        visible={moduleId !== 'letter' && moduleId !== 'splash'}
        paragraphs={letterParagraphs}
        onOpenChange={setAboutOpen}
      />
      <WeatherWidget variant={weatherOverlapsPanel ? 'cream' : 'terracotta'} />
      {moduleId === 'splash' && <SplashModule draft={draft} onAdvance={advance} />}
      {moduleId === 'letter' && <LetterModule draft={draft} paragraphs={letterParagraphs} onAdvance={advance} />}
      {moduleId === 'inOut' && (
        <InOutModule
          draft={draft}
          onAdvance={advance}
          quizPassed={quizPassed}
          onQuizPassed={() => setQuizPassed(true)}
        />
      )}
      {moduleId === 'nameCrew' && <NameCrewModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'hotel' && (
        <HotelModule draft={draft} bookingNote={content.hotelBookingNote} onAdvance={advance} onBack={goBack} />
      )}
      {moduleId === 'closing' && (
        <ClosingModule
          draft={draft}
          onBack={goBack}
          confirmationAttending={content.confirmationAttending}
          confirmationNotAttending={content.confirmationNotAttending}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run components/Wizard.test.tsx components/modules/SplashModule.test.tsx components/modules/LetterModule.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/Wizard.tsx components/Wizard.test.tsx components/modules/SplashModule.tsx components/modules/SplashModule.test.tsx components/modules/LetterModule.tsx components/modules/LetterModule.test.tsx
git commit -m "Wire the six-module confirmation wizard, update splash and letter CTAs"
```

---

### Task 9: Stats — confirmed cards and hotel guests by night

**Files:**
- Modify: `lib/responses-stats.ts`
- Modify: `lib/responses-stats.test.ts`

**Interfaces:**
- Consumes `AdminResponse` (Task 1), `eachNight`, `STAY_MIN`, `STAY_MAX` (Task 1).
- Produces on `ResponsesStats` (existing fields kept): `householdsAttending: number` (alias of `totalAttending`, not added — use `totalAttending`), `hotelHouseholds: number`, `hotelGuestsByNight: { night: string; guests: number }[]` (one entry per night `2027-06-26` … `2027-07-11`, i.e. `eachNight(STAY_MIN, STAY_MAX)`).

- [ ] **Step 1: Add failing tests**

Append to `lib/responses-stats.test.ts`:

```ts
describe('confirmed-phase stats', () => {
  it('counts hotel households among attending rows only', () => {
    const rows = [
      row({ attending: true, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' }),
      row({ attending: true, hotel_staying: false }),
      row({ attending: false, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' }),
    ];
    expect(computeResponsesStats(rows).hotelHouseholds).toBe(1);
  });

  it('lists every night in the allowed stay range, in order, even with no rows', () => {
    const nights = computeResponsesStats([]).hotelGuestsByNight;
    expect(nights).toHaveLength(16);
    expect(nights[0]).toEqual({ night: '2027-06-26', guests: 0 });
    expect(nights[15]).toEqual({ night: '2027-07-11', guests: 0 });
  });

  it('sums party sizes for each night a household is in the hotel, excluding departure day', () => {
    const rows = [
      row({ attending: true, party_size: 2, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-02' }),
      row({ attending: true, party_size: 3, hotel_staying: true, arrival_date: '2027-07-01', departure_date: '2027-07-04' }),
      row({ attending: true, party_size: 9, hotel_staying: false }),
      row({ attending: false, party_size: 9, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' }),
    ];
    const byNight = Object.fromEntries(computeResponsesStats(rows).hotelGuestsByNight.map((n) => [n.night, n.guests]));
    expect(byNight['2027-06-29']).toBe(0);
    expect(byNight['2027-06-30']).toBe(2);
    expect(byNight['2027-07-01']).toBe(5);
    expect(byNight['2027-07-02']).toBe(3);
    expect(byNight['2027-07-03']).toBe(3);
    expect(byNight['2027-07-04']).toBe(0);
  });

  it('clips a stay that spans the whole range and ignores rows with missing dates', () => {
    const rows = [
      row({ attending: true, party_size: 1, hotel_staying: true, arrival_date: '2027-06-26', departure_date: '2027-07-12' }),
      row({ attending: true, party_size: 4, hotel_staying: true, arrival_date: null, departure_date: null }),
    ];
    const nights = computeResponsesStats(rows).hotelGuestsByNight;
    expect(nights.every((n) => n.guests === 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/responses-stats.test.ts`
Expected: FAIL, `hotelHouseholds` undefined.

- [ ] **Step 3: Extend `lib/responses-stats.ts`**

Add to the imports: `import { STAY_MAX, STAY_MIN, eachNight } from './trip-dates';`
Add to `ResponsesStats`:

```ts
  hotelHouseholds: number;
  hotelGuestsByNight: { night: string; guests: number }[];
```

Add before the `return` in `computeResponsesStats`:

```ts
  const hotelRows = rows.filter((r) => r.attending === true && r.hotel_staying === true);
  const hotelHouseholds = hotelRows.length;
  const hotelGuestsByNight = eachNight(STAY_MIN, STAY_MAX).map((night) => ({
    night,
    guests: hotelRows
      .filter((r) => r.arrival_date != null && r.departure_date != null && r.arrival_date <= night && night < r.departure_date)
      .reduce((sum, r) => sum + (r.party_size ?? 0), 0),
  }));
```

and include `hotelHouseholds, hotelGuestsByNight,` in the returned object.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/responses-stats.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/responses-stats.ts lib/responses-stats.test.ts
git commit -m "Compute hotel households and guests-by-night for confirmed responses"
```

---

### Task 10: Phase-aware CSV export and sort keys

**Files:**
- Modify: `lib/responses-export.ts`, `lib/responses-export.test.ts`
- Modify: `lib/responses-sort.ts`, `lib/responses-sort.test.ts`

**Interfaces:**
- Consumes `AdminResponse`, `ResponsePhase` (Task 1).
- Produces `buildResponsesCsv(rows: AdminResponse[], phase: ResponsePhase): string`; `SortKey` gains `'email' | 'arrival_date'`.

- [ ] **Step 1: Update export tests**

In `lib/responses-export.test.ts`, pass `'interest'` as the second argument in every existing `buildResponsesCsv(...)` call, then append:

```ts
describe('buildResponsesCsv — confirmed phase', () => {
  it('emits the confirmed header row', () => {
    expect(buildResponsesCsv([], 'confirm')).toBe('Submitted,Name,Email,Attending,Crew,Hotel,Arrive,Depart,Note');
  });

  it('writes email, crew and ISO dates', () => {
    const csv = buildResponsesCsv(
      [row({ name: 'Ana', created_at: '2026-10-01T12:00:00.000Z', email: 'ana@example.com', party_size: 3, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' })],
      'confirm'
    );
    expect(csv.split('\n')[1]).toBe('2026-10-01,Ana,ana@example.com,Yes,3,Yes,2027-06-30,2027-07-06,');
  });

  it('leaves hotel and dates blank for a not-attending row', () => {
    const csv = buildResponsesCsv([row({ name: 'Bo', created_at: '2026-10-01T12:00:00.000Z', attending: false })], 'confirm');
    expect(csv.split('\n')[1]).toBe('2026-10-01,Bo,,No,,,,,');
  });
});
```

- [ ] **Step 2: Update sort tests**

Append to `lib/responses-sort.test.ts`:

```ts
  it('sorts by arrival_date as ISO strings with nulls last', () => {
    const rows = [
      row({ name: 'late', arrival_date: '2027-07-02' }),
      row({ name: 'none', arrival_date: null }),
      row({ name: 'early', arrival_date: '2027-06-30' }),
    ];
    expect(sortResponses(rows, 'arrival_date', 'asc').map((r) => r.name)).toEqual(['early', 'late', 'none']);
  });

  it('sorts by email', () => {
    const rows = [row({ name: 'z', email: 'z@example.com' }), row({ name: 'a', email: 'a@example.com' })];
    expect(sortResponses(rows, 'email', 'asc').map((r) => r.name)).toEqual(['a', 'z']);
  });
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run lib/responses-export.test.ts lib/responses-sort.test.ts`
Expected: FAIL (wrong headers / unknown sort keys).

- [ ] **Step 4: Update `lib/responses-export.ts`**

Rename `HEADERS` → `INTEREST_HEADERS`, `rowValues` → `interestRowValues`, add:

```ts
import type { AdminResponse, ResponsePhase } from './payload';

const CONFIRM_HEADERS = ['Submitted', 'Name', 'Email', 'Attending', 'Crew', 'Hotel', 'Arrive', 'Depart', 'Note'];

function confirmRowValues(row: AdminResponse): string[] {
  return [
    row.created_at.slice(0, 10),
    row.name,
    row.email ?? '',
    row.attending ? 'Yes' : 'No',
    row.party_size == null ? '' : String(row.party_size),
    yesNo(row.hotel_staying),
    row.arrival_date ?? '',
    row.departure_date ?? '',
    row.note ?? '',
  ];
}

export function buildResponsesCsv(rows: AdminResponse[], phase: ResponsePhase): string {
  const headers = phase === 'confirm' ? CONFIRM_HEADERS : INTEREST_HEADERS;
  const toValues = phase === 'confirm' ? confirmRowValues : interestRowValues;
  const lines = [headers, ...rows.map(toValues)].map((cols) => cols.map(escapeCsv).join(','));
  return lines.join('\n');
}
```

- [ ] **Step 5: Update `lib/responses-sort.ts`**

Add `| 'email' | 'arrival_date'` to `SortKey` and these cases to `accessor`:

```ts
    case 'email':
      return row.email;
    case 'arrival_date':
      return row.arrival_date;
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run lib/responses-export.test.ts lib/responses-sort.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/responses-export.ts lib/responses-export.test.ts lib/responses-sort.ts lib/responses-sort.test.ts
git commit -m "Export and sort confirmed responses by phase"
```

---

### Task 11: ResponsesTable — Confirmed / Interest tabs

**Files:**
- Modify: `components/ResponsesTable.tsx`
- Modify: `components/ResponsesTable.test.tsx`

**Interfaces:**
- Consumes `computeResponsesStats` (Task 9), `buildResponsesCsv(rows, phase)` (Task 10), `SortKey` (Task 10), `formatShortDate`, `TRIP_START`, `TRIP_END` (Task 1).
- Props unchanged: `{ responses: AdminResponse[] }`.

- [ ] **Step 1: Update the existing tests for the tab default**

The Confirmed tab is the default. In `components/ResponsesTable.test.tsx`:

1. The interest-specific tests (`renders the summary stats cards with headcount and hotel/dinner/cruise numbers`, `renders the window priority breakdown…`, `renders the window totals breakdown…`, `shows a dash for the average hotel stay…`) must set `phase: 'interest'` on each row and click the Interest tab first. Add a helper at the top of the file:

```tsx
async function showInterest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^interest/i }));
}
```

and in each of those four tests: make every `row({...})` include `phase: 'interest'`, create `const user = userEvent.setup();`, render, then `await showInterest(user);` before the assertions (mark the test `async`).

2. The `data` const and the sort/delete/edit tests stay on the Confirmed tab (fixture default `phase: 'confirm'`), no change.

- [ ] **Step 2: Add new tests**

```tsx
  describe('phase tabs', () => {
    const mixed = [
      row({ name: 'Legacy', phase: 'interest', window_priority: 'window_1' }),
      row({ name: 'Fresh', phase: 'confirm', email: 'fresh@example.com', party_size: 2, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' }),
    ];

    it('shows only confirmed rows by default and hides interest rows', () => {
      render(<ResponsesTable responses={mixed} />);
      expect(screen.getByText('Fresh')).toBeInTheDocument();
      expect(screen.queryByText('Legacy')).not.toBeInTheDocument();
      expect(screen.getByText(/^1 response$/i)).toBeInTheDocument();
    });

    it('switches to interest rows and legacy columns on the Interest tab', async () => {
      const user = userEvent.setup();
      render(<ResponsesTable responses={mixed} />);
      await user.click(screen.getByRole('button', { name: /^interest/i }));
      expect(screen.getByText('Legacy')).toBeInTheDocument();
      expect(screen.queryByText('Fresh')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /priority/i })).toBeInTheDocument();
    });

    it('renders confirmed columns with email and short dates', () => {
      render(<ResponsesTable responses={mixed} />);
      expect(screen.getByRole('button', { name: /^email/i })).toBeInTheDocument();
      expect(screen.getByText('fresh@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jun 30')).toBeInTheDocument();
      expect(screen.getByText('Jul 6')).toBeInTheDocument();
    });

    it('renders confirmed stat cards and the hotel-by-night strip', () => {
      render(<ResponsesTable responses={mixed} />);
      expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('2 guests');
      expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('1/1 households');
      expect(screen.getByTestId('stat-hotel-households')).toHaveTextContent('1');
      const strip = screen.getByTestId('stat-hotel-nights');
      const bar = strip.querySelector('[data-night="2027-06-30"]');
      expect(bar?.className).toContain('bg-terracotta');
      expect(strip.querySelector('[data-night="2027-06-27"]')?.className).not.toContain('bg-terracotta');
    });

    it('names the CSV download by phase', async () => {
      const user = userEvent.setup();
      const clicks: string[] = [];
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        clicks.push(this.download);
      });
      vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
      render(<ResponsesTable responses={mixed} />);
      await user.click(screen.getByRole('button', { name: /download csv/i }));
      await user.click(screen.getByRole('button', { name: /^interest/i }));
      await user.click(screen.getByRole('button', { name: /download csv/i }));
      expect(clicks).toEqual(['santorini2027-confirmed.csv', 'santorini2027-interest.csv']);
    });
  });
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: FAIL, no Interest tab button.

- [ ] **Step 4: Rework `components/ResponsesTable.tsx`**

Changes, in order:

Imports:
```tsx
import type { AdminResponse, ResponsePhase } from '@/lib/payload';
import { TRIP_END, TRIP_START, formatShortDate } from '@/lib/trip-dates';
```

Replace `COLUMNS` with two lists:
```tsx
type Column = { key: SortKey | null; label: string; srOnly?: boolean };

const INTEREST_COLUMNS: Column[] = [
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

const CONFIRM_COLUMNS: Column[] = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'attending', label: 'Attending' },
  { key: 'party_size', label: 'Crew' },
  { key: null, label: 'Hotel' },
  { key: 'arrival_date', label: 'Arrive' },
  { key: null, label: 'Depart' },
  { key: null, label: 'Note' },
  { key: null, label: 'Actions', srOnly: true },
];
```

State and derived values (replace the `sorted`/`stats` lines):
```tsx
  const [phase, setPhase] = useState<ResponsePhase>('confirm');
  const visible = items.filter((r) => r.phase === phase);
  const columns = phase === 'confirm' ? CONFIRM_COLUMNS : INTEREST_COLUMNS;
  const sorted = sortResponses(visible, sortKey, sortDir);
  const stats = computeResponsesStats(visible);
  const nightsMax = Math.max(1, ...stats.hotelGuestsByNight.map((n) => n.guests));
```

`handleDownload`: use `buildResponsesCsv(visible, phase)` and `anchor.download = phase === 'confirm' ? 'santorini2027-confirmed.csv' : 'santorini2027-interest.csv';`.

When switching tabs, reset the sort so a confirmed-only key never applies to interest rows:
```tsx
  function switchPhase(next: ResponsePhase) {
    setPhase(next);
    setSortKey('created_at');
    setSortDir('desc');
    setActionError(null);
  }
```

Tab toggle, rendered first inside the returned `<div>`:
```tsx
      <div className="mb-4 flex gap-2">
        {(['confirm', 'interest'] as ResponsePhase[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => switchPhase(p)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
              phase === p ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
            }`}
          >
            {p === 'confirm' ? 'Confirmed' : 'Interest'}
          </button>
        ))}
      </div>
```

Stats block: wrap the existing interest cards grid in `{phase === 'interest' && ( … )}` and add a confirmed block before it:
```tsx
      {phase === 'confirm' && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div data-testid="stat-confirmed" className="rounded-md border border-cream/25 p-3">
            <div className="text-xs uppercase tracking-wide text-sage">Confirmed</div>
            <div className="text-2xl font-bold text-cream">{stats.totalGuests} guests</div>
            <div className="text-xs text-sage">
              {stats.totalAttending}/{stats.totalResponses} households
            </div>
          </div>
          <div data-testid="stat-hotel-households" className="rounded-md border border-cream/25 p-3">
            <div className="text-xs uppercase tracking-wide text-sage">At Adamastos</div>
            <div className="text-2xl font-bold text-cream">{stats.hotelHouseholds}</div>
            <div className="text-xs text-sage">households</div>
          </div>
          <div data-testid="stat-hotel-nights" className="rounded-md border border-cream/25 p-3 md:col-span-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-sage">Hotel guests by night</div>
            <div className="flex items-end gap-1">
              {stats.hotelGuestsByNight.map(({ night, guests }) => {
                const inWeek = night >= TRIP_START && night < TRIP_END;
                return (
                  <div key={night} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-cream">{guests}</span>
                    <div className="flex h-16 w-full items-end overflow-hidden rounded bg-cream/10">
                      <div
                        data-night={night}
                        className={inWeek ? 'w-full bg-terracotta' : 'w-full bg-cream/30'}
                        style={{ height: `${(guests / nightsMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-sage">{formatShortDate(night).split(' ')[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
```

Response count line: use `visible.length` instead of `items.length`.

Table header: map over `columns` instead of `COLUMNS`.

Table body: keep the Submitted and editable Name cells, then branch:
```tsx
              {phase === 'confirm' ? (
                <>
                  <td className="p-2">{row.email ?? '—'}</td>
                  <td className="p-2">{row.attending ? 'Yes' : 'No'}</td>
                  <td className="p-2">{row.party_size ?? '—'}</td>
                  <td className="p-2">{row.hotel_staying ? 'Yes' : row.hotel_staying === false ? 'No' : '—'}</td>
                  <td className="p-2">{row.arrival_date ? formatShortDate(row.arrival_date) : '—'}</td>
                  <td className="p-2">{row.departure_date ? formatShortDate(row.departure_date) : '—'}</td>
                  <td className="p-2">{row.note ?? '—'}</td>
                </>
              ) : (
                <>
                  {/* existing interest cells from Attending through Note, unchanged */}
                </>
              )}
```
followed by the existing Actions cell.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run components/ResponsesTable.test.tsx`
Expected: PASS. If the `names the CSV download by phase` test fights jsdom's `URL` stub, replace the `vi.stubGlobal('URL', …)` line with `vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});` (jsdom 25 lacks `createObjectURL`, so define it first if the spy throws: `URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {};`).

- [ ] **Step 6: Commit**

```bash
git add components/ResponsesTable.tsx components/ResponsesTable.test.tsx
git commit -m "Split /admin into Confirmed and Interest tabs with hotel-by-night chart"
```

---

### Task 12: Whole-suite verification and build

**Files:** none new.

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: all green; no test file references a deleted module. If anything fails, fix it in the owning file from the tasks above, and re-run.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors. Common leftovers to fix if it fails: a stray `hotelNights`/`windowPriority` reference in `AboutIcon`, `SignatureLine`, or `ClosingModule` (none expected), or `app/admin/page.tsx` typing (`getAllResponses` returns `AdminResponse[]`, unchanged).

- [ ] **Step 3: Grep for leftovers**

```bash
grep -rn "window_1_selected\|windowPriority\|hotelNights\|dinnerInterested\|Tell Me More\|Give Us Some Info" app components lib --include=*.ts --include=*.tsx | grep -v "\.test\." | grep -v "responses-\(stats\|export\|sort\)\|ResponsesTable\|payload.ts"
```
Expected: no output. (The interest-phase admin files legitimately still reference legacy columns.)

- [ ] **Step 4: Commit anything the build fixed**

```bash
git status --short
git add -A && git commit -m "Fix build leftovers from confirmation phase" || echo "nothing to commit"
```

- [ ] **Step 5: Hand off**

Do not deploy. Report to Steve: tests + build green, migration `0004` must be run in the Supabase SQL editor and explicitly confirmed before `vercel --prod --yes`, and the three open copy items (splash CTA, booking wording, letter) are live-editable in `/admin` except the splash CTA.
