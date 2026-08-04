export type ModuleId =
  | 'splash'
  | 'letter'
  | 'window'
  | 'dateWindows'
  | 'nameCrew'
  | 'hotel'
  | 'travelTiming'
  | 'dinnerCruise'
  | 'closing';

export type WindowKey = 'window_1' | 'window_2' | 'window_3';

export interface DraftResponse {
  name: string;
  attending: boolean | null;
  partySize: number | null;
  hotelStaying: boolean | null;
  hotelNights: number | null;
  window1Selected: boolean;
  window2Selected: boolean;
  window3Selected: boolean;
  windowPriority: WindowKey | null;
  travelTiming: 'before' | 'after' | 'both' | 'neither' | null;
  travelNote: string;
  dinnerInterested: boolean | null;
  cruiseInterested: boolean | null;
  note: string;
}

export const EMPTY_DRAFT: DraftResponse = {
  name: '',
  attending: null,
  partySize: null,
  hotelStaying: null,
  hotelNights: null,
  window1Selected: false,
  window2Selected: false,
  window3Selected: false,
  windowPriority: null,
  travelTiming: null,
  travelNote: '',
  dinnerInterested: null,
  cruiseInterested: null,
  note: '',
};
