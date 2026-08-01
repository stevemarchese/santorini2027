'use client';
import { useState } from 'react';

const OPTIONS = ['Cookie', 'Marshmallow', 'Kiku', 'Cloud Puff'];
const CORRECT_ANSWER = 'Kiku';

interface QuizGateProps {
  onPass: () => void;
}

export default function QuizGate({ onPass }: QuizGateProps) {
  const [wrongAttempt, setWrongAttempt] = useState(false);

  function handleAnswer(option: string) {
    if (option === CORRECT_ANSWER) {
      onPass();
    } else {
      setWrongAttempt(true);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="animate-module-in blob-panel relative max-h-dvh w-full max-w-md overflow-y-auto border border-terracotta/40 bg-navy/[0.94] p-10 backdrop-blur-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-sage">Prove you know us</p>
        <h2 className="mt-1 text-xl font-bold uppercase tracking-wide text-cream">Who is this?</h2>
        <img
          src="/kiku.jpg"
          alt="A fluffy white dog"
          width={525}
          height={700}
          className="mt-4 max-h-[40dvh] w-full rounded object-cover"
        />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy"
            >
              {option}
            </button>
          ))}
        </div>
        {wrongAttempt && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-terracotta">
            Nice try — guess again!
          </p>
        )}
      </div>
    </div>
  );
}
