'use client';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import PillButton from '@/components/PillButton';
import SignatureLine, { isSignatureParagraph } from '@/components/SignatureLine';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance }: LetterModuleProps) {
  return (
    <ModulePanel draggable wide>
      <ModuleWaveHeader title="Time flieS. let's hAve fun!" centered titleClassName="text-[28px] -translate-y-[10px]" />
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
