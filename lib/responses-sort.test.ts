import { describe, it, expect } from 'vitest';
import { sortResponses } from './responses-sort';
import { adminRow as row } from '@/test-mocks/admin-response';

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

  it('sorts by arrival_date as ISO strings with nulls last', () => {
    const rows = [
      row({ name: 'late', arrival_date: '2027-07-02' }),
      row({ name: 'none', arrival_date: null }),
      row({ name: 'early', arrival_date: '2027-06-30' }),
    ];
    expect(sortResponses(rows, 'arrival_date', 'asc').map((r) => r.name)).toEqual(['early', 'late', 'none']);
  });

  it('sorts by email', () => {
    const rows = [row({ name: 'z', email: 'z@example.com' }), row({ name: 'a', email: 'a@example.com' })];
    expect(sortResponses(rows, 'email', 'asc').map((r) => r.name)).toEqual(['a', 'z']);
  });
});
