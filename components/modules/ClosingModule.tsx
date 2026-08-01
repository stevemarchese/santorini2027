'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import type { DraftResponse } from '@/lib/types';

interface ClosingModuleProps {
  draft: DraftResponse;
  onBack: () => void;
  confirmationAttending: string;
  confirmationNotAttending: string;
}

export default function ClosingModule({
  draft,
  onBack,
  confirmationAttending,
  confirmationNotAttending,
}: ClosingModuleProps) {
  const [note, setNote] = useState(draft.note);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    setStatus('sending');
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, note }),
      });
      setStatus(response.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <ModulePanel>
        <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
          {draft.attending ? confirmationAttending : confirmationNotAttending}
        </h2>
      </ModulePanel>
    );
  }

  return (
    <ModulePanel>
      <ModuleWaveHeader
        title={draft.attending ? 'One LaSt ThIng' : 'SorRy To MiSs You'}
        subtitle={draft.attending ? 'The Floor is Yours' : "We'll miss you"}
        titleClassName="text-[24px]"
      />
      <label htmlFor="note" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Anything else you'd like to share with us as we get things set up?
      </label>
      <textarea
        id="note"
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={note}
        onChange={(event) => setNote(event.target.value)}
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
          onClick={handleSubmit}
          disabled={status === 'sending'}
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
