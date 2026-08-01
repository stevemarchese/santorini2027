'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { dirtyline } from '@/lib/dirtyline-font';

const OPTIONS = ['Cookie', 'Marshmallow', 'Kiku', 'Cloud Puff'];
const CORRECT_ANSWER = 'Kiku';

const RETRY_MESSAGES = [
  'Nice try — guess again!',
  "Still not it — you know them better than that!",
  "Third time's the charm... or is it?",
];

interface QuizGateProps {
  onPass: () => void;
}

export default function QuizGate({ onPass }: QuizGateProps) {
  const [wrongOptions, setWrongOptions] = useState<string[]>([]);

  function handleAnswer(option: string) {
    if (option === CORRECT_ANSWER) {
      onPass();
    } else {
      setWrongOptions((options) => (options.includes(option) ? options : [...options, option]));
    }
  }

  return (
    <ModulePanel>
      <p className="text-sm font-semibold uppercase tracking-wide text-sage">Prove you&apos;re a human (who knows us)</p>
      <h2 className={`${dirtyline.className} mt-1 text-2xl text-cream`}>Who iS thIs piLlow PrinceSs?</h2>
      <img
        src="/kiku.jpg"
        alt="A fluffy white dog"
        width={525}
        height={700}
        className="mt-4 max-h-[40dvh] w-full rounded object-cover"
      />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const isWrong = wrongOptions.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              className={`quiz-option rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                isWrong ? 'bg-navy/40 text-cream/40' : 'bg-cream text-navy'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {wrongOptions.length > 0 && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-300">
          {RETRY_MESSAGES[Math.min(wrongOptions.length - 1, RETRY_MESSAGES.length - 1)]}
        </p>
      )}
    </ModulePanel>
  );
}
