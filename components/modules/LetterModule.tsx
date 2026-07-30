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
    <ModulePanel draggable>
      {LETTER_PARAGRAPHS.map((paragraph, index) => (
        <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
          {paragraph}
        </p>
      ))}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onAdvance(draft)}
          className="text-sm font-semibold uppercase tracking-wide text-sage"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
