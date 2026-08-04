'use client';
import { useState } from 'react';
import ExpandableSection from '@/components/ExpandableSection';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromNameCrew } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];

interface NameCrewModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

export default function NameCrewModule({ draft, onAdvance, onBack }: NameCrewModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader title="a Bit aBouT You" subtitle="Who's coming along" titleClassName="text-[24px]" />
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        NAME/FAMILY NAME *
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={local.name}
        onChange={(event) => setLocal({ ...local, name: event.target.value })}
      />
      <ExpandableSection open={local.attending === true}>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">How many in your crew? *</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {PARTY_SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocal({ ...local, partySize: value })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                local.partySize === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
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
          disabled={!canAdvanceFromNameCrew(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
