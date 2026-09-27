import { describe, it, expect } from 'vitest';
import { getNextModule, canAdvanceFromInOut, canAdvanceFromNameCrew, canAdvanceFromHotel } from './flow';
import { EMPTY_DRAFT } from './types';

describe('getNextModule', () => {
  it('walks splash → letter → inOut → nameCrew unconditionally', () => {
    expect(getNextModule('splash', EMPTY_DRAFT)).toBe('letter');
    expect(getNextModule('letter', EMPTY_DRAFT)).toBe('inOut');
    expect(getNextModule('inOut', { ...EMPTY_DRAFT, attending: true })).toBe('nameCrew');
    expect(getNextModule('inOut', { ...EMPTY_DRAFT, attending: false })).toBe('nameCrew');
  });

  it('routes attending guests through hotel and others straight to closing', () => {
    expect(getNextModule('nameCrew', { ...EMPTY_DRAFT, attending: true })).toBe('hotel');
    expect(getNextModule('nameCrew', { ...EMPTY_DRAFT, attending: false })).toBe('closing');
    expect(getNextModule('hotel', EMPTY_DRAFT)).toBe('closing');
    expect(getNextModule('closing', EMPTY_DRAFT)).toBe('closing');
  });
});

describe('canAdvanceFromInOut', () => {
  it('requires an attending answer', () => {
    expect(canAdvanceFromInOut(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromInOut({ ...EMPTY_DRAFT, attending: true })).toBe(true);
    expect(canAdvanceFromInOut({ ...EMPTY_DRAFT, attending: false })).toBe(true);
  });
});

describe('canAdvanceFromNameCrew', () => {
  it('requires only a name when not attending', () => {
    expect(canAdvanceFromNameCrew({ ...EMPTY_DRAFT, attending: false })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toBe(true);
  });

  it('rejects a non-empty invalid email even when not attending, but allows it empty', () => {
    const base = { ...EMPTY_DRAFT, attending: false, name: 'Steve' };
    expect(canAdvanceFromNameCrew({ ...base, email: '' })).toBe(true);
    expect(canAdvanceFromNameCrew({ ...base, email: 'steve@nowhere' })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, email: 'steve@example.com' })).toBe(true);
  });

  it('requires name, party size and a valid email when attending', () => {
    const base = { ...EMPTY_DRAFT, attending: true, name: 'Steve' };
    expect(canAdvanceFromNameCrew(base)).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2 })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2, email: 'nope' })).toBe(false);
    expect(canAdvanceFromNameCrew({ ...base, partySize: 2, email: 'steve@example.com' })).toBe(true);
  });
});

describe('canAdvanceFromHotel', () => {
  it('requires an answer, and valid ordered dates only when staying', () => {
    expect(canAdvanceFromHotel(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: false })).toBe(true);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true })).toBe(false);
    expect(
      canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-01' })
    ).toBe(false);
    expect(
      canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    ).toBe(true);
  });
});
