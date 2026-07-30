import { describe, it, expect } from 'vitest';
import { buildResponsesCsv } from './responses-export';
import type { AdminResponse } from './payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: 'id',
    created_at: '2026-07-15T12:00:00.000Z',
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

describe('buildResponsesCsv', () => {
  it('emits a header row even with no data', () => {
    const csv = buildResponsesCsv([]);
    expect(csv).toBe(
      'Submitted,Name,Attending,Party,Hotel,Windows,Priority,Travel,Travel Note,Dinner,Cruise,Note'
    );
  });

  it('formats booleans as Yes/No and nulls as blank', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Steve', attending: false, dinner_interested: true, cruise_interested: false }),
    ]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toBe('2026-07-15,Steve,No,,,,,,,Yes,No,');
  });

  it('joins selected date windows and shows hotel nights', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Ana', party_size: 3, hotel_staying: true, hotel_nights: 4, window_1_selected: true, window_3_selected: true }),
    ]);
    expect(csv.split('\n')[1]).toContain('Ana');
    expect(csv.split('\n')[1]).toContain('"6/30-7/6, 7/14-7/18"');
    expect(csv.split('\n')[1]).toContain('"Yes, 4n"');
    expect(csv.split('\n')[1]).toContain(',3,');
  });

  it('escapes commas, quotes, and newlines in free text', () => {
    const csv = buildResponsesCsv([row({ name: 'X', note: 'a, "b"\nc' })]);
    expect(csv.split('\n').length).toBeGreaterThan(2);
    expect(csv).toContain('"a, ""b""\nc"');
  });
});
