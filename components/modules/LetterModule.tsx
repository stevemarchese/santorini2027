'use client';
import ModulePanel from '@/components/ModulePanel';
import PillButton from '@/components/PillButton';
import SignatureLine, { isSignatureParagraph } from '@/components/SignatureLine';
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
      <h1 className={`${dirtyline.className} text-[clamp(17px,4vw,22px)] text-cream`}>
        Time flies. let&apos;s have fun.
      </h1>
      {paragraphs.map((paragraph, index) =>
        isSignatureParagraph(paragraph) ? (
          <SignatureLine key={index} paragraph={paragraph} />
        ) : (
          <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
            {paragraph}
          </p>
        )
      )}
      <div className="mt-6 flex justify-center">
        <PillButton onClick={() => onAdvance(draft)}>Give Us Some Info</PillButton>
      </div>
    </ModulePanel>
  );
}
