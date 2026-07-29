import type { DraftResponse } from './types';

export interface ResponseRow {
  name: string;
  attending: boolean;
  party_size: number | null;
  hotel_staying: boolean | null;
  hotel_nights: number | null;
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

export function validateDraftForSubmit(draft: DraftResponse): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('Name is required');
  if (draft.attending === null) errors.push('Attending is required');
  if (draft.attending === true && (draft.partySize === null || draft.partySize < 1)) {
    errors.push('Party size is required when attending');
  }
  return errors;
}

export function buildResponseRow(draft: DraftResponse): ResponseRow {
  const attending = draft.attending === true;
  return {
    name: draft.name.trim(),
    attending,
    party_size: attending ? draft.partySize : null,
    hotel_staying: attending ? draft.hotelStaying : null,
    hotel_nights: attending && draft.hotelStaying ? draft.hotelNights : null,
    window_1_selected: attending ? draft.window1Selected : false,
    window_2_selected: attending ? draft.window2Selected : false,
    window_3_selected: attending ? draft.window3Selected : false,
    window_priority: attending ? draft.windowPriority : null,
    travel_timing: attending ? draft.travelTiming : null,
    travel_note: attending && draft.travelNote.trim() ? draft.travelNote.trim() : null,
    dinner_interested: attending ? draft.dinnerInterested : null,
    cruise_interested: attending ? draft.cruiseInterested : null,
    note: draft.note.trim() ? draft.note.trim() : null,
  };
}
