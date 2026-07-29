'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromHotel } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface HotelModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function HotelModule({ draft, onAdvance }: HotelModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Staying at the Adamastos Hotel?
      </h2>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: true })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === true ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: false, hotelNights: null })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === false ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          No
        </button>
      </div>
      {local.hotelStaying === true && (
        <>
          <label htmlFor="hotelNights" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            How many nights?
          </label>
          <input
            id="hotelNights"
            type="number"
            min={1}
            className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
            value={local.hotelNights ?? ''}
            onChange={(event) =>
              setLocal({ ...local, hotelNights: event.target.value ? Number(event.target.value) : null })
            }
          />
        </>
      )}
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromHotel(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
