'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import ModuleWaveHeader from '@/components/ModuleWaveHeader';
import { canAdvanceFromDateWindows, toggleWindow, setWindowPriority } from '@/lib/flow';
import type { DraftResponse, WindowKey } from '@/lib/types';

interface DateWindowsModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
  onBack: () => void;
}

const WINDOWS: { key: WindowKey; label: string; field: 'window1Selected' | 'window2Selected' | 'window3Selected' }[] = [
  { key: 'window_1', label: '6/30 – 7/6', field: 'window1Selected' },
  { key: 'window_2', label: '7/7 – 7/13', field: 'window2Selected' },
  { key: 'window_3', label: '7/14 – 7/18', field: 'window3Selected' },
];

export default function DateWindowsModule({ draft, onAdvance, onBack }: DateWindowsModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <ModuleWaveHeader title="PicK YouR Week" subtitle="It'll Help us organize some events" titleClassName="text-[24px]" />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">Which week works best for you? *</p>
      <p className="mt-1 text-xs text-sage">Select all that apply — if more than one works, you can flag your favorite below.</p>
      <div className="mt-4 flex flex-col gap-3">
        {WINDOWS.map(({ key, label, field }) => (
          <div key={key} className="grid grid-cols-[6rem_auto] items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-cream">
              <input
                type="checkbox"
                checked={local[field]}
                onChange={() => setLocal(toggleWindow(local, key))}
              />
              {label}
            </label>
            {local[field] && (
              <button
                type="button"
                onClick={() => setLocal(setWindowPriority(local, key))}
                className={`origin-left justify-self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                  local.windowPriority === key
                    ? 'bg-terracotta text-cream'
                    : 'scale-[0.7] bg-cream text-navy hover:bg-cream/80'
                }`}
              >
                {local.windowPriority === key ? 'Top pick' : 'Prefer this'}
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold uppercase tracking-wide text-sage"
        >
          <span className="animate-arrow-bob">←</span> Back
        </button>
        <button
          type="button"
          onClick={() => onAdvance(local)}
          disabled={!canAdvanceFromDateWindows(local)}
          className="text-sm font-semibold uppercase tracking-wide text-sage disabled:opacity-40"
        >
          Next <span className="animate-arrow-bob">→</span>
        </button>
      </div>
    </ModulePanel>
  );
}
