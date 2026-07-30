import type { AdminResponse } from './payload';

export interface ResponsesStats {
  totalResponses: number;
  totalAttending: number;
  avgHotelNights: number | null;
  windowPriorityCounts: { window_1: number; window_2: number; window_3: number };
  topPriorityWindow: 'window_1' | 'window_2' | 'window_3' | null;
  dinnerYesCount: number;
  cruiseYesCount: number;
  totalGuests: number;
  dinnerGuestCount: number;
  cruiseGuestCount: number;
}

export function computeResponsesStats(rows: AdminResponse[]): ResponsesStats {
  const totalResponses = rows.length;
  const totalAttending = rows.filter((r) => r.attending).length;

  const hotelNights = rows
    .filter((r): r is AdminResponse & { hotel_nights: number } => r.hotel_staying === true && r.hotel_nights != null)
    .map((r) => r.hotel_nights);
  const avgHotelNights =
    hotelNights.length === 0
      ? null
      : Math.round((hotelNights.reduce((sum, n) => sum + n, 0) / hotelNights.length) * 10) / 10;

  const windowPriorityCounts = { window_1: 0, window_2: 0, window_3: 0 };
  for (const row of rows) {
    if (row.window_priority === 'window_1') windowPriorityCounts.window_1++;
    else if (row.window_priority === 'window_2') windowPriorityCounts.window_2++;
    else if (row.window_priority === 'window_3') windowPriorityCounts.window_3++;
  }

  const entries = Object.entries(windowPriorityCounts) as ['window_1' | 'window_2' | 'window_3', number][];
  const maxCount = Math.max(...entries.map(([, count]) => count));
  const topEntries = entries.filter(([, count]) => count === maxCount);
  const topPriorityWindow = maxCount === 0 || topEntries.length > 1 ? null : topEntries[0][0];

  const dinnerYesCount = rows.filter((r) => r.dinner_interested === true).length;
  const cruiseYesCount = rows.filter((r) => r.cruise_interested === true).length;

  const totalGuests = rows
    .filter((r) => r.attending === true)
    .reduce((sum, r) => sum + (r.party_size ?? 0), 0);
  const dinnerGuestCount = rows
    .filter((r) => r.dinner_interested === true)
    .reduce((sum, r) => sum + (r.party_size ?? 0), 0);
  const cruiseGuestCount = rows
    .filter((r) => r.cruise_interested === true)
    .reduce((sum, r) => sum + (r.party_size ?? 0), 0);

  return {
    totalResponses,
    totalAttending,
    avgHotelNights,
    windowPriorityCounts,
    topPriorityWindow,
    dinnerYesCount,
    cruiseYesCount,
    totalGuests,
    dinnerGuestCount,
    cruiseGuestCount,
  };
}
