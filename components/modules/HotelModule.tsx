'use client';
import { useState } from 'react';
import ExpandableSection from '@/components/ExpandableSection';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromHotel } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

const NIGHTS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7+' },
];

interface HotelModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

export default function HotelModule({ draft, onAdvance, onBack }: HotelModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <ModuleWaveHeader title="ThE HoTel" subtitle="Where you'll rest your head" titleClassName="text-[24px]" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">
        Do you plan on staying at the Adamastos Hotel? *
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: true })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, hotelStaying: false, hotelNights: null })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.hotelStaying === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          No
        </button>
      </div>
      <ExpandableSection open={local.hotelStaying === true}>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">For how many nights? *</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {NIGHTS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocal({ ...local, hotelNights: value })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                local.hotelNights === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </ExpandableSection>
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold uppercase tracking-wide text-sage"
        >
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
