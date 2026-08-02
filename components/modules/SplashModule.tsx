'use client';
import PillButton from '@/components/PillButton';
import { dirtyline } from '@/lib/dirtyline-font';
import type { DraftResponse } from '@/lib/types';

interface SplashModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

export default function SplashModule({ draft, onAdvance }: SplashModuleProps) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 z-0 bg-navy/60" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="overflow-hidden">
          <h1
            className={`${dirtyline.className} animate-splash-title-in text-[clamp(50px,9vw,100px)] sm:text-[clamp(32px,9vw,100px)] leading-[1.15] text-cream`}
          >
            SAntOrIni!<br className="sm:hidden" /><span className="hidden sm:inline"> </span>PaRT DeUx
          </h1>
        </div>
        <p
          className={`${dirtyline.className} animate-splash-subtitle-in mt-3 text-[clamp(22px,2.6vw,20px)] sm:text-[clamp(14px,2.6vw,20px)] tracking-wide text-cream`}
        >
          twenty years in the making
        </p>
        <PillButton onClick={() => onAdvance(draft)} className="animate-splash-cta-in mt-7">
          Tell Me More
        </PillButton>
      </div>
    </div>
  );
}
