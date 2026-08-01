'use client';

interface PillButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function PillButton({ onClick, children, className = '' }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-11 items-center gap-0 rounded-full bg-terracotta pl-8 pr-8 text-xs font-bold uppercase tracking-widest text-cream transition-all duration-500 ease-out hover:gap-2 ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="flex h-5 w-0 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream opacity-0 transition-all duration-500 ease-out group-hover:w-5 group-hover:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3 text-terracotta"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}
