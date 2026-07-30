import { describe, it, expect } from 'vitest';
import { sortResponses } from './responses-sort';
import type { AdminResponse } from './payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: 'id',
    created_at: '2026-07-01T00:00:00.000Z',
    name: 'Person',
    attending: true,
    party_size: null,
    hotel_staying: null,
    hotel_nights: null,
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

describe('sortResponses', () => {
  it('sorts by name ascending and descending', () => {
    const rows = [row({ name: 'Charlie' }), row({ name: 'Alice' }), row({ name: 'Bob' })];
    expect(sortResponses(rows, 'name', 'asc').map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(sortResponses(rows, 'name', 'desc').map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts by created_at as dates, not string length', () => {
    const rows = [
      row({ name: 'old', created_at: '2026-01-01T00:00:00.000Z' }),
      row({ name: 'new', created_at: '2026-12-01T00:00:00.000Z' }),
    ];
    expect(sortResponses(rows, 'created_at', 'desc').map((r) => r.name)).toEqual(['new', 'old']);
  });

  it('always places null values last, in both directions', () => {
    const rows = [row({ name: 'a', party_size: 2 }), row({ name: 'b', party_size: null }), row({ name: 'c', party_size: 5 })];
    expect(sortResponses(rows, 'party_size', 'asc').map((r) => r.name)).toEqual(['a', 'c', 'b']);
    expect(sortResponses(rows, 'party_size', 'desc').map((r) => r.name)).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input array', () => {
    const rows = [row({ name: 'B' }), row({ name: 'A' })];
    const before = rows.map((r) => r.name);
    sortResponses(rows, 'name', 'asc');
    expect(rows.map((r) => r.name)).toEqual(before);
  });
});
