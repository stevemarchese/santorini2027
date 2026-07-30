'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
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
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">A couple more things</h2>
      <label className="mt-4 flex items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={local.dinnerInterested}
          onChange={(event) => setLocal({ ...local, dinnerInterested: event.target.checked })}
        />
        Would you be interested in a group dinner?
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={local.cruiseInterested}
          onChange={(event) => setLocal({ ...local, cruiseInterested: event.target.checked })}
        />
        Would you join us for a sunset cruise and swim?
      </label>
      <div className="mt-6 flex items-center justify-between">
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
          className="text-sm font-semibold uppercase tracking-wide text-sage"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
