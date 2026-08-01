'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromTravelTiming } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface TravelTimingModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

const OPTIONS: { value: NonNullable<DraftResponse['travelTiming']>; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'both', label: 'Both' },
  { value: 'neither', label: 'Neither' },
];

export default function TravelTimingModule({ draft, onAdvance, onBack }: TravelTimingModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <ModuleWaveHeader
        title="TraVel PlaNs"
        subtitle="Before, after, or both?"
        titleClassName="text-[24px]"
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">
        Traveling before or after Santorini? *
      </p>
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
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={local.travelNote}
        onChange={(event) => setLocal({ ...local, travelNote: event.target.value })}
      />
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
          disabled={!canAdvanceFromTravelTiming(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
