import { describe, it, expect } from 'vitest';
import { computeResponsesStats } from './responses-stats';
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

describe('computeResponsesStats', () => {
  it('handles an empty list', () => {
    const stats = computeResponsesStats([]);
    expect(stats.totalResponses).toBe(0);
    expect(stats.totalAttending).toBe(0);
    expect(stats.avgHotelNights).toBeNull();
    expect(stats.windowPriorityCounts).toEqual({ window_1: 0, window_2: 0, window_3: 0 });
    expect(stats.topPriorityWindow).toBeNull();
    expect(stats.dinnerYesCount).toBe(0);
    expect(stats.cruiseYesCount).toBe(0);
  });

  it('counts total responses and attending', () => {
    const rows = [row({ attending: true }), row({ attending: false }), row({ attending: true })];
    const stats = computeResponsesStats(rows);
    expect(stats.totalResponses).toBe(3);
    expect(stats.totalAttending).toBe(2);
  });

  it('averages hotel nights only across those staying, rounded to 1 decimal', () => {
    const rows = [
      row({ hotel_staying: true, hotel_nights: 3 }),
      row({ hotel_staying: true, hotel_nights: 4 }),
      row({ hotel_staying: true, hotel_nights: 4 }),
      row({ hotel_staying: false, hotel_nights: null }),
    ];
    expect(computeResponsesStats(rows).avgHotelNights).toBeCloseTo(3.7, 5);
  });

  it('returns a null average when nobody is staying at the hotel', () => {
    const rows = [row({ hotel_staying: false }), row({ hotel_staying: null })];
    expect(computeResponsesStats(rows).avgHotelNights).toBeNull();
  });

  it('ignores a staying row with a missing nights value', () => {
    const rows = [row({ hotel_staying: true, hotel_nights: 5 }), row({ hotel_staying: true, hotel_nights: null })];
    expect(computeResponsesStats(rows).avgHotelNights).toBe(5);
  });

  it('tallies window priority picks and names the top window', () => {
    const rows = [
      row({ window_priority: 'window_2' }),
      row({ window_priority: 'window_1' }),
      row({ window_priority: 'window_2' }),
    ];
    const stats = computeResponsesStats(rows);
    expect(stats.windowPriorityCounts).toEqual({ window_1: 1, window_2: 2, window_3: 0 });
    expect(stats.topPriorityWindow).toBe('window_2');
  });

  it('returns a null top window on a tie', () => {
    const rows = [row({ window_priority: 'window_1' }), row({ window_priority: 'window_2' })];
    expect(computeResponsesStats(rows).topPriorityWindow).toBeNull();
  });

  it('counts dinner and cruise yes votes', () => {
    const rows = [
      row({ dinner_interested: true, cruise_interested: false }),
      row({ dinner_interested: true, cruise_interested: true }),
      row({ dinner_interested: null, cruise_interested: null }),
    ];
    const stats = computeResponsesStats(rows);
    expect(stats.dinnerYesCount).toBe(2);
    expect(stats.cruiseYesCount).toBe(1);
  });

  it('reports zero guest counts for an empty list', () => {
    const stats = computeResponsesStats([]);
    expect(stats.totalGuests).toBe(0);
    expect(stats.dinnerGuestCount).toBe(0);
    expect(stats.cruiseGuestCount).toBe(0);
  });

  it('sums party sizes of attending rows for totalGuests, ignoring non-attending rows', () => {
    const rows = [
      row({ attending: true, party_size: 4 }),
      row({ attending: true, party_size: 2 }),
      row({ attending: false, party_size: 6 }),
    ];
    expect(computeResponsesStats(rows).totalGuests).toBe(6);
  });

  it('treats a null party_size as 0 when summing totalGuests', () => {
    const rows = [row({ attending: true, party_size: null }), row({ attending: true, party_size: 3 })];
    expect(computeResponsesStats(rows).totalGuests).toBe(3);
  });

  it('sums party sizes across dinner-interested rows rather than counting them', () => {
    const rows = [
      row({ dinner_interested: true, party_size: 5 }),
      row({ dinner_interested: true, party_size: 1 }),
      row({ dinner_interested: false, party_size: 9 }),
    ];
    expect(computeResponsesStats(rows).dinnerGuestCount).toBe(6);
  });

  it('sums party sizes across cruise-interested rows rather than counting them', () => {
    const rows = [
      row({ cruise_interested: true, party_size: 2 }),
      row({ cruise_interested: true, party_size: 7 }),
      row({ cruise_interested: null, party_size: 9 }),
    ];
    expect(computeResponsesStats(rows).cruiseGuestCount).toBe(9);
  });
});
