'use client';
import { EMAIL_HINT, hasMalformedEmail } from '@/lib/payload';
import type { DraftResponse } from '@/lib/types';

const PARTY_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Just me' },
  { value: 2, label: '+1' },
  { value: 3, label: '+2' },
  { value: 4, label: '+3' },
  { value: 5, label: '+4' },
  { value: 6, label: '+5' },
];

interface NameCrewFieldsProps {
  value: DraftResponse;
  onChange: (updated: DraftResponse) => void;
}

export default function NameCrewFields({ value, onChange }: NameCrewFieldsProps) {
  return (
    <>
      <label htmlFor="name" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        NAME/FAMILY NAME *
      </label>
      <input
        id="name"
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
      />
      <label htmlFor="email" className="mt-4 block text-sm font-semibold uppercase tracking-wide text-sage">
        Email {value.attending === true ? '*' : ''}
      </label>
      <p className="text-xs text-sage">So we can send you the details.</p>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required={value.attending === true}
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={value.email}
        onChange={(event) => onChange({ ...value, email: event.target.value })}
      />
      {hasMalformedEmail(value.email) && <p className="mt-2 text-xs text-sage">{EMAIL_HINT}</p>}
      {value.attending === true && (
        <>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-sage">How many in your crew? *</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {PARTY_SIZE_OPTIONS.map(({ value: size, label }) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ ...value, partySize: size })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                value.partySize === size ? 'bg-terracotta text-cream' : 'bg-cream text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        </>
      )}
    </>
  );
}
