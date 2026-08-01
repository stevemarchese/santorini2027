'use client';
import { useState } from 'react';
import ExpandableSection from '@/components/ExpandableSection';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import QuizGate from '@/components/QuizGate';
import { canAdvanceFromOpening } from '@/lib/flow';
import type { DraftResponse } from '@/lib/types';

const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];

interface OpeningModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  quizPassed: boolean;
  onQuizPassed: () => void;
}

export default function OpeningModule({ draft, onAdvance, quizPassed, onQuizPassed }: OpeningModuleProps) {
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
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        NAME/FAMILY NAME *
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={local.name}
        onChange={(event) => {
          if (!quizPassed && !showQuiz) event.currentTarget.blur();
          maybeTriggerQuiz();
          setLocal({ ...local, name: event.target.value });
        }}
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Are you planning on coming? *</p>
      <div className="mt-2 flex gap-3">
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
          I&apos;m in
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
          Can&apos;t make it
        </button>
      </div>
      <ExpandableSection open={local.attending === true}>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">How many in your crew? *</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {PARTY_SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocal({ ...local, partySize: value })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                local.partySize === value ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </ExpandableSection>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-sage/70">*required</p>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromOpening(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
