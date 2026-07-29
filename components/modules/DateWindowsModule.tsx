'use client';
import { useState } from 'react';
import ModulePanel from '@/components/ModulePanel';
import { canAdvanceFromDateWindows, toggleWindow, setWindowPriority } from '@/lib/flow';
import type { DraftResponse, WindowKey } from '@/lib/types';

interface DateWindowsModuleProps {
  draft: DraftResponse;
  onAdvance: (updated: DraftResponse) => void;
}

const WINDOWS: { key: WindowKey; label: string; field: 'window1Selected' | 'window2Selected' | 'window3Selected' }[] = [
  { key: 'window_1', label: '6/30 – 7/6', field: 'window1Selected' },
  { key: 'window_2', label: '7/7 – 7/13', field: 'window2Selected' },
  { key: 'window_3', label: '7/14 – 7/18', field: 'window3Selected' },
];

export default function DateWindowsModule({ draft, onAdvance }: DateWindowsModuleProps) {
  const [local, setLocal] = useState(draft);

  return (
    <ModulePanel>
      <h2 className="text-xl font-bold uppercase tracking-wide text-cream">Which weeks could work?</h2>
      <p className="mt-1 text-xs text-sage">Select all that apply — if more than one works, you can flag your favorite below.</p>
      <div className="mt-4 flex flex-col gap-3">
        {WINDOWS.map(({ key, label, field }) => (
          <div key={key} className="flex items-center gap-3">
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
                className={`text-xs font-bold uppercase tracking-wide ${
                  local.windowPriority === key ? 'text-terracotta' : 'text-teal'
                }`}
              >
                {local.windowPriority === key ? 'Top pick' : 'Prefer this one'}
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAdvance(local)}
        disabled={!canAdvanceFromDateWindows(local)}
        className="mt-6 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-40"
      >
        Next
      </button>
    </ModulePanel>
  );
}
