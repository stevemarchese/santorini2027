'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromOpening } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface OpeningModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function OpeningModule({ draft, onAdvance }: OpeningModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <p className="text-xs font-bold uppercase tracking-widest text-cream/70">
        20 years — July 4, 2007
      </p>
      <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-cream">
        Join us in Santorini
      </h1>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Your name
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={local.name}
        onChange={(event) => setLocal({ ...local, name: event.target.value })}
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you coming?</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: true })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === true ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: false, partySize: null })}
          className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === false ? 'bg-terracotta text-cream' : 'border border-teal text-teal'
          }`}
        >
          Can&apos;t make it
        </button>
      </div>
      {local.attending === true && (
        <>
          <label htmlFor="partySize" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
            Party size
          </label>
          <input
            id="partySize"
            type="number"
            min={1}
            className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
            value={local.partySize ?? ''}
            onChange={(event) =>
              setLocal({ ...local, partySize: event.target.value ? Number(event.target.value) : null })
            }
          />
        </>
      )}
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromOpening(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
