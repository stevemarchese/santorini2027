import { dirtyline } from '@/lib/dirtyline-font';

interface ModuleWaveHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
  titleClassName?: string;
}

export default function ModuleWaveHeader({
  title,
  subtitle,
  centered = false,
  titleClassName = 'text-[20px]',
}: ModuleWaveHeaderProps) {
  return (
    <div className="relative -mx-10 -mt-10 mb-6">
      <svg viewBox="0 0 420 116" preserveAspectRatio="none" className="block h-[116px] w-full">
        <path
          d="M0,0 L420,0 L420,96 C385,108 350,84 315,96 C280,108 245,84 210,96 C175,108 140,84 105,96 C70,108 35,84 0,96 Z"
          className="fill-cream"
        />
      </svg>
      <div
        className={`absolute inset-0 px-10 text-navy ${centered ? 'flex flex-col justify-center' : 'pt-6'}`}
      >
        <h1 className={`${dirtyline.className} ${titleClassName} leading-tight`}>{title}</h1>
        {subtitle && (
          <p className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-widest opacity-65">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
