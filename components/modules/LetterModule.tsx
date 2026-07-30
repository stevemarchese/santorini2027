'use client';
import ModulePanel from '@/components/ModulePanel';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel>
      {LETTER_PARAGRAPHS.map((paragraph, index) => (
        <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
          {paragraph}
        </p>
      ))}
      <button
        type="button"
        onClick={() => onAdvance(draft)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
      >
        Next
      </button>
    </ModulePanel>
  );
}
