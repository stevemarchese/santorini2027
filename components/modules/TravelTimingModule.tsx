'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromTravelTiming } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface TravelTimingModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

const OPTIONS: { value: NonNullable<DraftResponse['travelTiming']>; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'both', label: 'Both' },
  { value: 'neither', label: 'Neither' },
];

export default function TravelTimingModule({ draft, onAdvance }: TravelTimingModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        Traveling before or after Santorini?
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setLocal({ ...local, travelTiming: value })}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
              local.travelTiming === value ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label htmlFor="travelNote" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Anything else about your plans?
      </label>
      <textarea
        id="travelNote"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={local.travelNote}
        onChange={(event) => setLocal({ ...local, travelNote: event.target.value })}
      />
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromTravelTiming(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
