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
