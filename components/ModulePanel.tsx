export default function ModulePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div className="animate-module-in max-h-dvh w-full max-w-md overflow-y-auto border-l-4 border-terracotta bg-navy/[0.82] p-8 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
