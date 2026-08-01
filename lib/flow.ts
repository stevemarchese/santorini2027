import type { DraftResponse, ModuleId, WindowKey } from './types';

export function getNextModule(current: ModuleId, draft: DraftResponse): ModuleId {
  switch (current) {
    case 'splash':
      return 'letter';
    case 'letter':
      return 'opening';
    case 'opening':
      return draft.attending ? 'hotel' : 'closing';
    case 'hotel':
      return 'dateWindows';
    case 'dateWindows':
      return 'travelTiming';
    case 'travelTiming':
      return 'dinnerCruise';
    case 'dinnerCruise':
      return 'closing';
    case 'closing':
      return 'closing';
  }
}

export function canAdvanceFromOpening(draft: DraftResponse): boolean {
  if (!draft.name.trim()) return false;
  if (draft.attending === null) return false;
  if (draft.attending === true && (draft.partySize === null || draft.partySize < 1)) return false;
  return true;
}

export function canAdvanceFromHotel(draft: DraftResponse): boolean {
  if (draft.hotelStaying === null) return false;
  if (draft.hotelStaying === true && (draft.hotelNights === null || draft.hotelNights < 1)) return false;
  return true;
}

export function canAdvanceFromDateWindows(draft: DraftResponse): boolean {
  return draft.window1Selected || draft.window2Selected || draft.window3Selected;
}

export function canAdvanceFromTravelTiming(draft: DraftResponse): boolean {
  return draft.travelTiming !== null;
}

export function canAdvanceFromDinnerCruise(draft: DraftResponse): boolean {
  return draft.dinnerInterested !== null && draft.cruiseInterested !== null;
}

function windowField(key: WindowKey): 'window1Selected' | 'window2Selected' | 'window3Selected' {
  if (key === 'window_1') return 'window1Selected';
  if (key === 'window_2') return 'window2Selected';
  return 'window3Selected';
}

export function toggleWindow(draft: DraftResponse, key: WindowKey): DraftResponse {
  const field = windowField(key);
  const updated: DraftResponse = { ...draft, [field]: !draft[field] };

  const selected = (['window_1', 'window_2', 'window_3'] as WindowKey[]).filter(
    (k) => updated[windowField(k)]
  );

  if (selected.length === 1) {
    updated.windowPriority = selected[0];
  } else if (selected.length === 0) {
    updated.windowPriority = null;
  } else if (updated.windowPriority && !selected.includes(updated.windowPriority)) {
    updated.windowPriority = null;
  }

  return updated;
}

export function setWindowPriority(draft: DraftResponse, key: WindowKey): DraftResponse {
  return { ...draft, windowPriority: key };
}
