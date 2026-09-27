'use client';
import ExpandableSection from '@/components/ExpandableSection';
import { validateStayDates } from '@/lib/payload';
import { STAY_MAX, STAY_MIN, TRIP_END, TRIP_START } from '@/lib/trip-dates';
import type { DraftResponse } from '@/lib/types';

const HOTEL_URL = 'https://adamastoshotel.com/en/';

interface HotelFieldsProps {
  value: DraftResponse;
  bookingNote: string;
  onChange: (updated: DraftResponse) => void;
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

export default function HotelFields({ value: local, bookingNote, onChange: setLocal }: HotelFieldsProps) {
  const staying = local.hotelStaying === true;
  const dateError = staying ? validateStayDates(local.arrivalDate, local.departureDate) : null;
  const showHint = staying && dateError !== null;

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
    <>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-sage">
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
    </>
  );
}
