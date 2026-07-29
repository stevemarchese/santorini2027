'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import type { DraftResponse } from '@/lib/types';

interface ClosingModuleProps {
  draft: DraftResponse;
}

export default function ClosingModule({ draft }: ClosingModuleProps) {
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
          {draft.attending ? 'See you in Santorini' : 'Thanks for letting us know'}
        </h2>
      </ModulePanel>
    );
  }

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">
        {draft.attending ? 'One last thing' : 'Sorry to miss you'}
      </h2>
      <label htmlFor="note" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Anything you want to share?
      </label>
      <textarea
        id="note"
        className="mt-1 w-full border-b border-cream/35 bg-transparent text-cream"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'sending'}
        className="mt-4 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        {status === 'sending' ? 'Sending...' : 'Send'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-xs text-terracotta">Something went wrong — please try again.</p>
      )}
    </ModulePanel>
  );
}
