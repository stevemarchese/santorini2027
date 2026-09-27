'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import PillButton from '@/components/PillButton';
import QuizGate from '@/components/QuizGate';
import SignatureLine, { isSignatureParagraph } from '@/components/SignatureLine';
import type { DraftResponse } from '@/lib/types';

interface LetterModuleProps {
  draft: DraftResponse;
  paragraphs: string[];
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function LetterModule({ draft, paragraphs, onAdvance, quizPassed, onQuizPassed }: LetterModuleProps) {
  const [pendingAttending, setPendingAttending] = useState<boolean | null>(null);

  function withAnswer(attending: boolean): DraftResponse {
    return { ...draft, attending, partySize: attending ? draft.partySize : null };
  }

  function choose(attending: boolean) {
    // A decline submits nothing, so there is nothing for the quiz gate to protect.
    if (quizPassed || !attending) {
      onAdvance(withAnswer(attending));
    } else {
      setPendingAttending(attending);
    }
  }

  if (pendingAttending !== null && !quizPassed) {
    return (
      <QuizGate
        onPass={() => {
          onQuizPassed();
          onAdvance(withAnswer(pendingAttending));
        }}
      />
    );
  }

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
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <PillButton onClick={() => choose(true)}>Count Me In</PillButton>
        <PillButton onClick={() => choose(false)}>Can&apos;t Make It</PillButton>
      </div>
    </ModulePanel>
  );
}
