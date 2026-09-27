'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import QuizGate from '@/components/QuizGate';
import { canAdvanceFromInOut } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface InOutModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function InOutModule({ draft, onAdvance, quizPassed, onQuizPassed }: InOutModuleProps) {
  const [local, setLocal] = useState(draft);
  const [showQuiz, setShowQuiz] = useState(false);

  function maybeTriggerQuiz() {
    if (!quizPassed && !showQuiz) setShowQuiz(true);
  }

  if (showQuiz && !quizPassed) {
    return (
      <QuizGate
        onPass={() => {
          setShowQuiz(false);
          onQuizPassed();
        }}
      />
    );
  }

  const pill = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
      selected ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
    }`;

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader title="ThE bIg QueStion" subtitle="June 30 – July 6, 2027" titleClassName="text-[24px]" />
      <p className="mt-[6px] text-sm text-cream">
        We&apos;ll be on Santorini from Tuesday June 30 through Monday July 6, 2027. Group things will happen
        inside that window.
      </p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-sage">Are you in? *</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: true });
          }}
          className={pill(local.attending === true)}
        >
          I&apos;m in
        </button>
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: false, partySize: null });
          }}
          className={pill(local.attending === false)}
        >
          Can&apos;t make it
        </button>
      </div>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromInOut(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
