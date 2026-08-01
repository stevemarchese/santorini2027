'use client';
import ModulePanel from '@/components/ModulePanel';
import { dirtyline } from '@/lib/fonts';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel draggable wide>
      <h1 className={`${dirtyline.className} text-xl text-cream`}>Time flies. Let&apos;s have fun.</h1>
      {paragraphs.map((paragraph, index) => (
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
