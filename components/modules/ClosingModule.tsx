'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import NameCrewFields from '@/components/NameCrewFields';
import { canAdvanceFromNameCrew } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface ClosingModuleProps {
  draft: DraftResponse;
  confirmationNotAttending: string;
}

/** The decline path: name + email so we can stop bothering them, then the sorry screen. */
export default function ClosingModule({ draft, confirmationNotAttending }: ClosingModuleProps) {
  const [local, setLocal] = useState<DraftResponse>({ ...draft, attending: false, partySize: null });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    setStatus('sending');
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local),
      });
      setStatus(response.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <ModulePanel>
        <ModuleWaveHeader title="We Heard You" subtitle="Maybe Next Time?" titleClassName="text-[24px]" />
        <p className="text-sm leading-relaxed text-cream">{confirmationNotAttending}</p>
      </ModulePanel>
    );
  }

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader title="SorRy To MiSs You" subtitle="We'll miss you" titleClassName="text-[24px]" />
      <p className="mt-[6px] text-sm text-cream">
        Leave your name and email so we don&apos;t bother you with future correspondence.
      </p>
      <NameCrewFields value={local} onChange={setLocal} />
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'sending' || !canAdvanceFromNameCrew(local)}
          className="bg-terracotta px-5 py-2 text-sm font-bold uppercase tracking-wide text-cream disabled:opacity-40"
        >
          {status === 'sending' ? 'Sending...' : 'Send'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-xs text-terracotta">Something went wrong — please try again.</p>
      )}
    </ModulePanel>
  );
}
