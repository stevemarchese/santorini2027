import type { DraftResponse, ModuleId } from './types';
import { hasMalformedEmail, isValidEmail, validateStayDates } from './payload';

export function getNextModule(current: ModuleId, draft: DraftResponse): ModuleId {
  switch (current) {
    case 'splash':
      return 'letter';
    case 'letter':
      return 'nameCrew';
    case 'nameCrew':
      return draft.attending ? 'hotel' : 'closing';
    case 'hotel':
      return 'closing';
    case 'closing':
      return 'closing';
  }
}

export function canAdvanceFromNameCrew(draft: DraftResponse): boolean {
  if (!draft.name.trim()) return false;
  if (hasMalformedEmail(draft.email)) return false;
  if (draft.attending !== true) return true;
  if (draft.partySize === null || draft.partySize < 1) return false;
  return isValidEmail(draft.email);
}

export function canAdvanceFromHotel(draft: DraftResponse): boolean {
  if (draft.hotelStaying === null) return false;
  if (draft.hotelStaying === false) return true;
  return validateStayDates(draft.arrivalDate, draft.departureDate) === null;
}
