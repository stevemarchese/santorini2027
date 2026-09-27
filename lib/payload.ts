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

export const EMAIL_HINT = "That email doesn't look right";

/** True when the email is non-empty but malformed; an empty email is never a problem here. */
export function hasMalformedEmail(value: unknown): boolean {
  return asTrimmedString(value).length > 0 && !isValidEmail(value);
}

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
  if (hasMalformedEmail(draft?.email)) errors.push(EMAIL_HINT);
  if (draft?.attending === true) {
    if (draft.partySize === null || draft.partySize === undefined || draft.partySize < 1) {
      errors.push('Party size is required when attending');
    }
    if (!isValidEmail(draft.email) && !hasMalformedEmail(draft.email)) {
      errors.push('A valid email is required when attending');
    }
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
