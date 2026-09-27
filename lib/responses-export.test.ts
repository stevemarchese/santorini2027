import { describe, it, expect } from 'vitest';
import { buildResponsesCsv } from './responses-export';
import { adminRow as row } from '@/test-mocks/admin-response';

describe('buildResponsesCsv', () => {
  it('emits a header row even with no data', () => {
    const csv = buildResponsesCsv([], 'interest');
    expect(csv).toBe(
      'Submitted,Name,Attending,Party,Hotel,Windows,Priority,Travel,Travel Note,Dinner,Cruise,Note'
    );
  });

  it('formats booleans as Yes/No and nulls as blank', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Steve', created_at: '2026-07-15T12:00:00.000Z', attending: false, dinner_interested: true, cruise_interested: false }),
    ], 'interest');
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toBe('2026-07-15,Steve,No,,,,,,,Yes,No,');
  });

  it('joins selected date windows and shows hotel nights', () => {
    const csv = buildResponsesCsv([
      row({ name: 'Ana', party_size: 3, hotel_staying: true, hotel_nights: 4, window_1_selected: true, window_3_selected: true }),
    ], 'interest');
    expect(csv.split('\n')[1]).toContain('Ana');
    expect(csv.split('\n')[1]).toContain('"6/30-7/6, 7/14-7/18"');
    expect(csv.split('\n')[1]).toContain('"Yes, 4n"');
    expect(csv.split('\n')[1]).toContain(',3,');
  });

  it('escapes commas, quotes, and newlines in free text', () => {
    const csv = buildResponsesCsv([row({ name: 'X', note: 'a, "b"\nc' })], 'interest');
    expect(csv.split('\n').length).toBeGreaterThan(2);
    expect(csv).toContain('"a, ""b""\nc"');
  });
});

describe('buildResponsesCsv — confirmed phase', () => {
  it('emits the confirmed header row', () => {
    expect(buildResponsesCsv([], 'confirm')).toBe('Submitted,Name,Email,Attending,Crew,Hotel,Arrive,Depart,Note');
  });

  it('writes email, crew and ISO dates', () => {
    const csv = buildResponsesCsv(
      [row({ name: 'Ana', created_at: '2026-10-01T12:00:00.000Z', email: 'ana@example.com', party_size: 3, hotel_staying: true, arrival_date: '2027-06-30', departure_date: '2027-07-06' })],
      'confirm'
    );
    expect(csv.split('\n')[1]).toBe('2026-10-01,Ana,ana@example.com,Yes,3,Yes,2027-06-30,2027-07-06,');
  });

  it('leaves hotel and dates blank for a not-attending row', () => {
    const csv = buildResponsesCsv([row({ name: 'Bo', created_at: '2026-10-01T12:00:00.000Z', attending: false })], 'confirm');
    expect(csv.split('\n')[1]).toBe('2026-10-01,Bo,,No,,,,,');
  });
});
