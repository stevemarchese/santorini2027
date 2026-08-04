'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import QuizGate from '@/components/QuizGate';
import { canAdvanceFromWindow } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

interface WindowModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function WindowModule({ draft, onAdvance, quizPassed, onQuizPassed }: WindowModuleProps) {
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

  return (
    <ModulePanel draggable>
      <ModuleWaveHeader
        title="Start wiTh The baSics"
        subtitle="The simple questions"
        titleClassName="text-[24px]"
      />
      <p className="mt-[6px] text-sm text-cream">
        We are planning to be in Greece in late June or early to mid July, 2027. Plan is to have a few
        group events over that time.
      </p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-sage">
        Does that window work for you? *
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: true });
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.attending === true ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Tell me More
        </button>
        <button
          type="button"
          onClick={() => {
            maybeTriggerQuiz();
            setLocal({ ...local, attending: false, partySize: null });
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
            local.attending === false ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
          }`}
        >
          Can&apos;t make it work
        </button>
      </div>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromWindow(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
