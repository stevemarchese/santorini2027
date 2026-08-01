'use client';

interface ExpandableSectionProps {
  open: boolean;
  children: React.ReactNode;
}

export default function ExpandableSection({ open, children }: ExpandableSectionProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
