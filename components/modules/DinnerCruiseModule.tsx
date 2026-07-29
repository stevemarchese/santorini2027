'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import type { DraftResponse } from '@/lib/types';

interface DinnerCruiseModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function DinnerCruiseModule({ draft, onAdvance }: DinnerCruiseModuleProps) {
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
        Interested in the group dinner?
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-cream">
        <input
          type="checkbox"
          checked={local.cruiseInterested}
          onChange={(event) => setLocal({ ...local, cruiseInterested: event.target.checked })}
        />
        Interested in the sunset cruise?
      </label>
      <button
        type="button"
        onClick={() => onAdvance(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        Next
      </button>
    </ModulePanel>
  );
}
