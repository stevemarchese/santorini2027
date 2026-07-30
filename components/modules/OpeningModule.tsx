'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromOpening } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];

interface OpeningModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function OpeningModule({ draft, onAdvance }: OpeningModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel draggable>
      <p className="text-xs font-bold uppercase tracking-widest text-cream/70">
        20 years — July 4, 2007
      </p>
      <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-cream">
        Join us in Santorini
      </h1>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-sage/70">*required</p>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Your name *
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={local.name}
        onChange={(event) => setLocal({ ...local, name: event.target.value })}
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you coming? *</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: true })}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...local, attending: false, partySize: null })}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide ${
            local.attending === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Can&apos;t make it
        </button>
      </div>
      {local.attending === true && (
        <>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Party size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PARTY_SIZE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocal({ ...local, partySize: value })}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  local.partySize === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
