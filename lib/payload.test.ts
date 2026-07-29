import { describe, it, expect } from 'vitest';
import { buildResponseRow, validateDraftForSubmit } from './payload';
import { EMPTY_DRAFT } from './types';

describe('validateDraftForSubmit', () => {
  it('requires a name and an attending answer', () => {
    expect(validateDraftForSubmit(EMPTY_DRAFT)).toEqual(
      expect.arrayContaining(['Name is required', 'Attending is required'])
    );
  });

  it('passes for a valid not-attending draft', () => {
    expect(validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toEqual([]);
  });

  it('requires party size when attending', () => {
    expect(
      validateDraftForSubmit({ ...EMPTY_DRAFT, name: 'Steve', attending: true })
    ).toContain('Party size is required when attending');
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
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateDraftForSubmit({ ...EMPTY_DRAFT, name: 123 as any })
    ).not.toThrow();
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateDraftForSubmit({ ...EMPTY_DRAFT, name: 123 as any })
    ).toContain('Name is required');
  });
});

describe('buildResponseRow', () => {
  it('nulls out attending-only fields when not attending', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: false,
      partySize: 5,
      hotelStaying: true,
      window1Selected: true,
      note: 'Miss you all',
    });
    expect(row).toEqual(
      expect.objectContaining({
        name: 'Steve',
        attending: false,
        party_size: null,
        hotel_staying: null,
        window_1_selected: false,
        note: 'Miss you all',
      })
    );
  });

  it('carries through attending-path fields', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      hotelNights: 3,
      window2Selected: true,
      windowPriority: 'window_2',
      travelTiming: 'before',
      dinnerInterested: true,
      cruiseInterested: false,
    });
    expect(row).toEqual(
      expect.objectContaining({
        party_size: 2,
        hotel_staying: true,
        hotel_nights: 3,
        window_2_selected: true,
        window_priority: 'window_2',
        travel_timing: 'before',
        dinner_interested: true,
        cruise_interested: false,
      })
    );
  });
});
