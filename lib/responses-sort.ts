import type { AdminResponse } from './payload';

export type SortKey =
  | 'created_at'
  | 'name'
  | 'attending'
  | 'party_size'
  | 'hotel_nights'
  | 'window_priority'
  | 'travel_timing'
  | 'dinner_interested'
  | 'cruise_interested';

export type SortDirection = 'asc' | 'desc';

function accessor(row: AdminResponse, key: SortKey): number | string | null {
  switch (key) {
    case 'created_at':
      return new Date(row.created_at).getTime();
    case 'name':
      return row.name;
    case 'attending':
      return row.attending ? 1 : 0;
    case 'party_size':
      return row.party_size;
    case 'hotel_nights':
      return row.hotel_nights;
    case 'window_priority':
      return row.window_priority;
    case 'travel_timing':
      return row.travel_timing;
    case 'dinner_interested':
      return row.dinner_interested == null ? null : row.dinner_interested ? 1 : 0;
    case 'cruise_interested':
      return row.cruise_interested == null ? null : row.cruise_interested ? 1 : 0;
  }
}

export function sortResponses(rows: AdminResponse[], key: SortKey, dir: SortDirection): AdminResponse[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((r1, r2) => {
    const a = accessor(r1, key);
    const b = accessor(r2, key);
    if (a == null && b == null) return 0;
    if (a == null) return 1; // nulls always last
    if (b == null) return -1;
    const c =
      typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return c * sign;
  });
}
