import { describe, it, expect } from 'vitest';
import {
  getNextModule,
  canAdvanceFromOpening,
  canAdvanceFromHotel,
  canAdvanceFromDateWindows,
  canAdvanceFromTravelTiming,
  toggleWindow,
  setWindowPriority,
} from './flow';
import { EMPTY_DRAFT } from './types';

describe('getNextModule', () => {
  it('routes attending=true from opening to hotel', () => {
    expect(getNextModule('opening', { ...EMPTY_DRAFT, attending: true })).toBe('hotel');
  });

  it('routes attending=false from opening straight to closing', () => {
    expect(getNextModule('opening', { ...EMPTY_DRAFT, attending: false })).toBe('closing');
  });

  it('walks the full attending path in order', () => {
    expect(getNextModule('hotel', EMPTY_DRAFT)).toBe('dateWindows');
    expect(getNextModule('dateWindows', EMPTY_DRAFT)).toBe('travelTiming');
    expect(getNextModule('travelTiming', EMPTY_DRAFT)).toBe('dinnerCruise');
    expect(getNextModule('dinnerCruise', EMPTY_DRAFT)).toBe('closing');
  });
});

describe('getNextModule — letter', () => {
  it('routes letter unconditionally to opening', () => {
    expect(getNextModule('letter', EMPTY_DRAFT)).toBe('opening');
  });

  it('routes splash unconditionally to letter', () => {
    expect(getNextModule('splash', EMPTY_DRAFT)).toBe('letter');
  });
});

describe('canAdvanceFromOpening', () => {
  it('requires a name and an attending answer', () => {
    expect(canAdvanceFromOpening(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: false })).toBe(true);
  });

  it('requires party size when attending', () => {
    expect(canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: true })).toBe(false);
    expect(
      canAdvanceFromOpening({ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 })
    ).toBe(true);
  });
});

describe('canAdvanceFromHotel', () => {
  it('requires nights only when staying', () => {
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: false })).toBe(true);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true })).toBe(false);
    expect(canAdvanceFromHotel({ ...EMPTY_DRAFT, hotelStaying: true, hotelNights: 3 })).toBe(true);
  });
});

describe('canAdvanceFromDateWindows', () => {
  it('requires at least one window selected', () => {
    expect(canAdvanceFromDateWindows(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromDateWindows({ ...EMPTY_DRAFT, window2Selected: true })).toBe(true);
  });
});

describe('canAdvanceFromTravelTiming', () => {
  it('requires a selection', () => {
    expect(canAdvanceFromTravelTiming(EMPTY_DRAFT)).toBe(false);
    expect(canAdvanceFromTravelTiming({ ...EMPTY_DRAFT, travelTiming: 'both' })).toBe(true);
  });
});

describe('toggleWindow', () => {
  it('auto-sets priority when exactly one window is selected', () => {
    const updated = toggleWindow(EMPTY_DRAFT, 'window_2');
    expect(updated.window2Selected).toBe(true);
    expect(updated.windowPriority).toBe('window_2');
  });

  it('clears priority when its window is deselected', () => {
    const oneSelected = toggleWindow(EMPTY_DRAFT, 'window_2');
    const deselected = toggleWindow(oneSelected, 'window_2');
    expect(deselected.window2Selected).toBe(false);
    expect(deselected.windowPriority).toBeNull();
  });

  it('does not overwrite an existing priority when a second window is added', () => {
    const first = toggleWindow(EMPTY_DRAFT, 'window_1');
    const second = toggleWindow(first, 'window_3');
    expect(second.windowPriority).toBe('window_1');
  });

  it('reassigns priority to the remaining window when the priority window is deselected and one window remains', () => {
    const twoSelected = toggleWindow(toggleWindow(EMPTY_DRAFT, 'window_1'), 'window_2');
    expect(twoSelected.windowPriority).toBe('window_1');
    const deselectedPriority = toggleWindow(twoSelected, 'window_1');
    expect(deselectedPriority.window1Selected).toBe(false);
    expect(deselectedPriority.window2Selected).toBe(true);
    expect(deselectedPriority.windowPriority).toBe('window_2');
  });

  it('clears priority to null when the priority window is deselected and two windows remain', () => {
    const allThree = toggleWindow(toggleWindow(toggleWindow(EMPTY_DRAFT, 'window_1'), 'window_2'), 'window_3');
    expect(allThree.windowPriority).toBe('window_1');
    const deselectedPriority = toggleWindow(allThree, 'window_1');
    expect(deselectedPriority.window2Selected).toBe(true);
    expect(deselectedPriority.window3Selected).toBe(true);
    expect(deselectedPriority.windowPriority).toBeNull();
  });
});

describe('setWindowPriority', () => {
  it('sets the priority explicitly', () => {
    const draft = { ...EMPTY_DRAFT, window1Selected: true, window2Selected: true };
    expect(setWindowPriority(draft, 'window_2').windowPriority).toBe('window_2');
  });
});
