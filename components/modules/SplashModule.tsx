'use client';
import { dirtyline } from '@/lib/dirtyline-font';
import type { DraftResponse } from '@/lib/types';

interface SplashModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function SplashModule({ draft, onAdvance }: SplashModuleProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="overflow-hidden">
        <h1
          className={`${dirtyline.className} animate-splash-title-in text-[clamp(26px,5.5vw,58px)] leading-[1.15] text-cream`}
        >
          SAntOrIni! PaRT DeUx
        </h1>
      </div>
      <p
        className={`${dirtyline.className} animate-splash-subtitle-in mt-3 text-[clamp(14px,2.6vw,20px)] tracking-wide text-cream`}
      >
        twenty years in the making
      </p>
      <button
        type="button"
        onClick={() => onAdvance(draft)}
        className="animate-splash-cta-in mt-7 rounded-full bg-terracotta px-8 py-3 text-xs font-bold uppercase tracking-widest text-cream"
      >
        Tell Me More
      </button>
    </div>
  );
}
