'use client';
import ModulePanel from '@/components/ModulePanel';
import PillButton from '@/components/PillButton';
import { dirtyline } from '@/lib/dirtyline-font';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel draggable wide>
      <h1 className={`${dirtyline.className} text-[clamp(16px,4vw,22px)] text-cream`}>
        Time flies. let&apos;s have fun.
      </h1>
      {paragraphs.map((paragraph, index) =>
        paragraph === 'Steve, Andi & Nicolas' ? (
          <p key={index} className="mt-4 text-[clamp(15px,3.5vw,20px)] text-cream first:mt-0">
            <span className={dirtyline.className}>S</span>teve,{' '}
            <span className={dirtyline.className}>A</span>ndi &{' '}
            <span className={dirtyline.className}>N</span>icolas
          </p>
        ) : (
          <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
            {paragraph}
          </p>
        )
      )}
      <div className="mt-6 flex justify-end">
        <PillButton onClick={() => onAdvance(draft)}>Next</PillButton>
      </div>
    </ModulePanel>
  );
}
