'use client';
import { useState } from 'react';
import type { SiteContent } from '@/lib/site-content';

interface ContentEditorProps {
  content: SiteContent;
}

export default function ContentEditor({ content }: ContentEditorProps) {
  const [letter, setLetter] = useState(content.letter);
  const [confirmationAttending, setConfirmationAttending] = useState(content.confirmationAttending);
  const [confirmationNotAttending, setConfirmationNotAttending] = useState(content.confirmationNotAttending);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function handleSave() {
    setStatus('saving');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter, confirmationAttending, confirmationNotAttending }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <details className="group mb-10">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-bold uppercase tracking-wide text-sage">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span>
        Site Content
      </summary>

      <div className="mt-4">
        <label htmlFor="letter" className="block text-sm font-semibold uppercase tracking-wide text-sage">
          Letter
        </label>
        <p className="mb-1 text-xs text-cream/60">Separate paragraphs with a blank line.</p>
        <textarea
          id="letter"
          className="mb-4 h-48 w-full border border-cream/35 bg-transparent p-2 text-sm text-cream outline-none"
          value={letter}
          onChange={(event) => setLetter(event.target.value)}
        />

        <label htmlFor="conf-attending" className="block text-sm font-semibold uppercase tracking-wide text-sage">
          Confirmation — attending
        </label>
        <input
          id="conf-attending"
          className="mb-4 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-sm text-cream outline-none"
          value={confirmationAttending}
          onChange={(event) => setConfirmationAttending(event.target.value)}
        />

        <label htmlFor="conf-not-attending" className="block text-sm font-semibold uppercase tracking-wide text-sage">
          Confirmation — not attending
        </label>
        <input
          id="conf-not-attending"
          className="mb-4 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-sm text-cream outline-none"
          value={confirmationNotAttending}
          onChange={(event) => setConfirmationNotAttending(event.target.value)}
        />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving'}
            className="bg-terracotta px-5 py-2 text-sm font-bold uppercase tracking-wide text-cream disabled:opacity-40"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
          {status === 'saved' && <span className="text-xs text-sage">Saved.</span>}
          {status === 'error' && (
            <span className="text-xs text-terracotta">Something went wrong — please try again.</span>
          )}
        </div>
      </div>
    </details>
  );
}
