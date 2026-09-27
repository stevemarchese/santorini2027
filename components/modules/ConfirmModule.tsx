'use client';
import { useState } from 'react';
import HotelFields from '@/components/HotelFields';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import NameCrewFields from '@/components/NameCrewFields';
import { canSubmitConfirmation } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface ConfirmModuleProps {
  draft: DraftResponse;
  bookingNote: string;
  confirmationAttending: string;
}

export default function ConfirmModule({ draft, bookingNote, confirmationAttending }: ConfirmModuleProps) {
  const [local, setLocal] = useState(draft);
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
        <ModuleWaveHeader title="You'Re All Set!" subtitle="Thanks for helping out" titleClassName="text-[24px]" />
        <p className="text-sm leading-relaxed text-cream">{confirmationAttending}</p>
      </ModulePanel>
    );
  }

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader title="MakE iT ReaL" subtitle="One quick form and you're done" titleClassName="text-[24px]" />
      <p className="mt-[6px] text-sm text-cream">
        Yes, you already told us once. That was the poll. This is the RSVP, so same questions, real answers.
      </p>
      <NameCrewFields value={local} onChange={setLocal} />
      <HotelFields value={local} bookingNote={bookingNote} onChange={setLocal} />
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'sending' || !canSubmitConfirmation(local)}
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
