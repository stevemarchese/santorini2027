'use client';
import { useState } from 'react';
import ExpandableSection from '@/components/ExpandableSection';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromHotel } from '@/lib/flow';
import { validateStayDates } from '@/lib/payload';
import { STAY_MAX, STAY_MIN, TRIP_END, TRIP_START } from '@/lib/trip-dates';
import type { DraftResponse } from '@/lib/types';

const HOTEL_URL = 'https://adamastoshotel.com/en/';

interface HotelModuleProps {
  draft: DraftResponse;
  bookingNote: string;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

function HotelLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={HOTEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-cream"
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

export default function HotelModule({ draft, bookingNote, onAdvance, onBack }: HotelModuleProps) {
  const [local, setLocal] = useState(draft);
  const staying = local.hotelStaying === true;
  const dateError = staying ? validateStayDates(local.arrivalDate, local.departureDate) : null;
  const showHint = staying && local.arrivalDate !== null && local.departureDate !== null && dateError !== null;

  function chooseYes() {
    setLocal({
      ...local,
      hotelStaying: true,
      arrivalDate: local.arrivalDate ?? TRIP_START,
      departureDate: local.departureDate ?? TRIP_END,
    });
  }

  function chooseNo() {
    setLocal({ ...local, hotelStaying: false, arrivalDate: null, departureDate: null });
  }

  const pill = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
      selected ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
    }`;
  const dateInput =
    'mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none [color-scheme:dark]';

  return (
    <ModulePanel>
      <ModuleWaveHeader title="ThE fAmily HoTel" subtitle="Nicely Upgraded Since 2007" titleClassName="text-[24px]" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">
        Staying at the <HotelLink>Adamastos Hotel</HotelLink>? *
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={chooseYes} className={pill(local.hotelStaying === true)}>
          Yes
        </button>
        <button type="button" onClick={chooseNo} className={pill(local.hotelStaying === false)}>
          No
        </button>
      </div>
      <ExpandableSection open={staying}>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="arrive" className="block text-sm font-semibold uppercase tracking-wide text-sage">
              Arrive *
            </label>
            <input
              id="arrive"
              type="date"
              min={STAY_MIN}
              max={STAY_MAX}
              className={dateInput}
              value={local.arrivalDate ?? ''}
              onChange={(event) => setLocal({ ...local, arrivalDate: event.target.value || null })}
            />
          </div>
          <div>
            <label htmlFor="depart" className="block text-sm font-semibold uppercase tracking-wide text-sage">
              Depart *
            </label>
            <input
              id="depart"
              type="date"
              min={STAY_MIN}
              max={STAY_MAX}
              className={dateInput}
              value={local.departureDate ?? ''}
              onChange={(event) => setLocal({ ...local, departureDate: event.target.value || null })}
            />
          </div>
        </div>
        {showHint && <p className="mt-2 text-xs text-sage">{dateError}</p>}
        <p className="mt-4 text-xs leading-relaxed text-cream/80">
          {bookingNote} <HotelLink>adamastoshotel.com</HotelLink>
        </p>
      </ExpandableSection>
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm font-semibold uppercase tracking-wide text-sage">
          <span className="animate-arrow-bob">←</span> Back
        </button>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromHotel(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
