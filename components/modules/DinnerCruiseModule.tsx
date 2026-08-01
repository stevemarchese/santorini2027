'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromDinnerCruise } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface DinnerCruiseModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

export default function DinnerCruiseModule({ draft, onAdvance, onBack }: DinnerCruiseModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <ModuleWaveHeader
        title="nOw foR The Good StuFf"
        subtitle="Help Us plan a few fun group activities"
        titleClassName="text-[24px]"
      />
      <p className="text-sm font-semibold uppercase tracking-wide text-sage">
        Interested in group dinner/drinks? *
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, dinnerInterested: true })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.dinnerInterested === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, dinnerInterested: false })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.dinnerInterested === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          No
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">
        How about a sunset cruise & swim? *
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, cruiseInterested: true })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.cruiseInterested === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, cruiseInterested: false })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.cruiseInterested === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          No
        </button>
      </div>
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
          disabled={!canAdvanceFromDinnerCruise(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
