import { describe, it, expect } from 'vitest';
import { buildResponseRow, validateDraftForSubmit, isValidEmail, validateStayDates } from './payload';
import { EMPTY_DRAFT } from './types';

const attending = { ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: true, partySize: 2 };

describe('isValidEmail', () => {
  it('accepts a plain address and rejects junk', () => {
    expect(isValidEmail('steve@example.com')).toBe(true);
    expect(isValidEmail('  Steve@Example.com ')).toBe(true);
    expect(isValidEmail('steve@example')).toBe(false);
    expect(isValidEmail('steve example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('validateStayDates', () => {
  it('returns null for a valid in-range stay', () => {
    expect(validateStayDates('2027-06-30', '2027-07-06')).toBeNull();
  });
  it('requires both dates', () => {
    expect(validateStayDates(null, '2027-07-06')).toBe('Arrival and departure dates are required');
    expect(validateStayDates('2027-06-30', null)).toBe('Arrival and departure dates are required');
  });
  it('rejects malformed dates', () => {
    expect(validateStayDates('06/30/2027', '2027-07-06')).toBe('Dates must be YYYY-MM-DD');
  });
  it('rejects dates outside the allowed range', () => {
    expect(validateStayDates('2027-06-25', '2027-07-06')).toBe('Dates must fall between 2027-06-26 and 2027-07-12');
    expect(validateStayDates('2027-06-30', '2027-07-13')).toBe('Dates must fall between 2027-06-26 and 2027-07-12');
  });
  it('rejects a departure on or before the arrival', () => {
    expect(validateStayDates('2027-07-01', '2027-07-01')).toBe('Depart needs to be after arrive');
    expect(validateStayDates('2027-07-02', '2027-07-01')).toBe('Depart needs to be after arrive');
  });
});

describe('validateDraftForSubmit', () => {
  it('requires a name and an attending answer', () => {
    expect(validateDraftForSubmit(EMPTY_DRAFT)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('passes for a valid not-attending draft with no email', () => {
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toEqual([]);
  });

  it('requires party size and email when attending', () => {
    const errors = validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: true });
    expect(errors).toContain('Party size is required when attending');
    expect(errors).toContain('A valid email is required when attending');
  });

  it('rejects a malformed email for a not-attending guest but allows it blank', () => {
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false, email: 'steve@nowhere' })).toEqual([
      "That email doesn't look right",
    ]);
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false, email: '   ' })).toEqual([]);
  });

  it('accepts an email with surrounding whitespace and capitals', () => {
    expect(validateDraftForSubmit({ ...attending, email: '  Steve@Example.com ' })).toEqual([]);
  });

  it('requires valid stay dates only when staying at the hotel', () => {
    expect(validateDraftForSubmit({ ...attending, hotelStaying: false })).toEqual([]);
    expect(validateDraftForSubmit({ ...attending, hotelStaying: true })).toContain(
      'Arrival and departure dates are required'
    );
    expect(
      validateDraftForSubmit({ ...attending, hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-01' })
    ).toContain('Depart needs to be after arrive');
    expect(
      validateDraftForSubmit({ ...attending, hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    ).toEqual([]);
  });

  it('does not throw on an empty object payload', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => validateDraftForSubmit({} as any)).not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateDraftForSubmit({} as any)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('does not throw when name is a number instead of a string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 123 as any })).toContain('Name is required');
  });
});

describe('buildResponseRow', () => {
  it('always stamps phase confirm', () => {
    expect(buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false }).phase).toBe('confirm');
  });

  it('nulls out attending-only fields when not attending', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: false,
      partySize: 5,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
      note: 'Miss you all',
    });
    expect(row).toEqual({
      phase: 'confirm',
      name: 'Steve',
      email: null,
      attending: false,
      party_size: null,
      hotel_staying: null,
      arrival_date: null,
      departure_date: null,
      note: 'Miss you all',
    });
  });

  it('carries through attending-path fields and trims/lowercases the email', () => {
    const row = buildResponseRow({
      ...attending,
      email: '  Steve@Example.com ',
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
    });
    expect(row).toEqual(
      expect.objectContaining({
        email: 'steve@example.com',
        party_size: 2,
        hotel_staying: true,
        arrival_date: '2027-06-30',
        departure_date: '2027-07-06',
      })
    );
  });

  it('nulls stale dates when the guest ends on hotel No', () => {
    const row = buildResponseRow({
      ...attending,
      hotelStaying: false,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
    });
    expect(row.hotel_staying).toBe(false);
    expect(row.arrival_date).toBeNull();
    expect(row.departure_date).toBeNull();
  });

  it('keeps an optional email for a not-attending guest', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: false });
    expect(row.email).toBe('steve@example.com');
  });
});
