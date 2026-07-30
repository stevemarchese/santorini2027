'use client';
import { useState } from 'react';

function LetterGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" className={className} fill="currentColor" aria-hidden="true">
      <path d="m739.5 107.67v170.86h170.9zm-291.56 517.64c-13.266 0-24-10.734-24-24s10.734-24 24-24h304.13c13.266 0 24 10.734 24 24s-10.734 24-24 24zm-77.859-118.73c-13.266 0-24-10.734-24-24s10.734-24 24-24h459.79c13.266 0 24 10.734 24 24s-10.734 24-24 24zm321.42-432.84h-435.89v500.58l249.24 213.14 79.547-68.016c9.1406-7.8281 22.5-7.5469 31.266 0.14062l79.406 67.875 249.24-213.14v-247.78h-228.84c-13.266 0-24-10.734-24-24v-228.79zm-483.89 368.34-53.297 45.609 53.297 45.609zm784.78 91.219 53.344-45.609-53.344-45.609v91.266zm-6.7969 68.766c-1.0312 1.0312-2.1094 2.0156-3.3281 2.8594l-250.31 214.08 326.58 279.28v-558.56zm-767.76 2.9062c-1.2656-0.89062-2.4375-1.875-3.5156-3l-72.844-62.297v558.56l326.58-279.28-250.26-213.98zm-35.438 521.26h835.26l-417.61-357.1-417.61 357.1z" />
    </svg>
  );
}

interface AboutIconProps {
  visible: boolean;
  paragraphs: string[];
}

export default function AboutIcon({ visible, paragraphs }: AboutIconProps) {
  const [open, setOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About this trip"
        className="fixed left-4 top-4 z-20 flex flex-col items-center text-terracotta"
      >
        <LetterGlyph className="h-7 w-7" />
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-terracotta">About</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="animate-module-in blob-panel relative max-h-dvh w-full max-w-md overflow-y-auto border border-terracotta/40 bg-navy/[0.94] p-10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-xl leading-none text-cream/70 hover:text-cream"
            >
              ×
            </button>
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-4 text-sm leading-relaxed text-cream first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
