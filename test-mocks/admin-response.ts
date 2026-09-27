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
