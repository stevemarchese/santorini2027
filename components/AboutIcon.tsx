'use client';
import { useState } from 'react';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

function AboutGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" className={className} fill="currentColor" aria-hidden="true">
      <path d="m600 285.12c-173.53 0-314.88 141.35-314.88 314.88s141.35 314.88 314.88 314.88 314.88-141.35 314.88-314.88-141.35-314.88-314.88-314.88zm0 125.95c8.3516 0 16.363 3.3164 22.266 9.2227 5.9062 5.9023 9.2227 13.914 9.2227 22.262 0 8.3516-3.3164 16.363-9.2227 22.266-5.9023 5.9062-13.914 9.2227-22.266 9.2227-8.3477 0-16.359-3.3164-22.266-9.2227-5.9023-5.9023-9.2227-13.914-9.2227-22.266 0-8.3477 3.3203-16.359 9.2227-22.262 5.9062-5.9062 13.918-9.2227 22.266-9.2227zm0 94.465v-0.003906c8.3516 0 16.363 3.3203 22.266 9.2227 5.9062 5.9062 9.2227 13.914 9.2227 22.266v220.42c0 8.3516-3.3164 16.359-9.2227 22.266-5.9023 5.9062-13.914 9.2227-22.266 9.2227-8.3477 0-16.359-3.3164-22.266-9.2227-5.9023-5.9062-9.2227-13.914-9.2227-22.266v-220.42c0-8.3516 3.3203-16.359 9.2227-22.266 5.9062-5.9023 13.918-9.2227 22.266-9.2227z" />
    </svg>
  );
}

interface AboutIconProps {
  visible: boolean;
}

export default function AboutIcon({ visible }: AboutIconProps) {
  const [open, setOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About this trip"
        className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center text-terracotta"
      >
        <AboutGlyph className="h-7 w-7" />
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="max-h-dvh w-full max-w-md overflow-y-auto border-l-4 border-terracotta bg-navy/[0.94] p-8 backdrop-blur-md">
            {LETTER_PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
                {paragraph}
              </p>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
