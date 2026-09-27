import { describe, it, expect } from 'vitest';
import { TRIP_START, TRIP_END, STAY_MIN, STAY_MAX, isIsoDate, nightsBetween, formatShortDate, eachNight } from './trip-dates';

describe('trip-dates constants', () => {
  it('pins the locked week and the allowed stay range', () => {
    expect(TRIP_START).toBe('2027-06-30');
    expect(TRIP_END).toBe('2027-07-06');
    expect(STAY_MIN).toBe('2027-06-26');
    expect(STAY_MAX).toBe('2027-07-12');
  });
});

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD and rejects everything else', () => {
    expect(isIsoDate('2027-06-30')).toBe(true);
    expect(isIsoDate('2027-6-30')).toBe(false);
    expect(isIsoDate('06/30/2027')).toBe(false);
    expect(isIsoDate('2027-02-30')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(20270630)).toBe(false);
  });
});

describe('nightsBetween', () => {
  it('counts whole nights, ignoring timezones', () => {
    expect(nightsBetween('2027-06-30', '2027-07-06')).toBe(6);
    expect(nightsBetween('2027-07-01', '2027-07-01')).toBe(0);
    expect(nightsBetween('2027-07-06', '2027-06-30')).toBe(-6);
  });
});

describe('formatShortDate', () => {
  it('renders Mon D without a timezone shift', () => {
    expect(formatShortDate('2027-06-30')).toBe('Jun 30');
    expect(formatShortDate('2027-07-06')).toBe('Jul 6');
  });
});

describe('eachNight', () => {
  it('lists every night from the start up to but excluding the end', () => {
    expect(eachNight('2027-06-29', '2027-07-02')).toEqual(['2027-06-29', '2027-06-30', '2027-07-01']);
  });
  it('returns an empty list when the end is not after the start', () => {
    expect(eachNight('2027-07-02', '2027-07-02')).toEqual([]);
    expect(eachNight('2027-07-03', '2027-07-02')).toEqual([]);
  });
});
