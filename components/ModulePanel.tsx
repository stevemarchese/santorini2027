'use client';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface ModulePanelProps {
  children: React.ReactNode;
  draggable?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const INTERACTIVE_SELECTOR = 'input, button, textarea, select, a, label';

export default function ModulePanel({ children, draggable = false }: ModulePanelProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable || !dragState.current) return;
    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    const maxX = window.innerWidth / 2 - 80;
    const maxY = window.innerHeight / 2 - 80;
    setOffset({
      x: clamp(dragState.current.originX + deltaX, -maxX, maxX),
      y: clamp(dragState.current.originY + deltaY, -maxY, maxY),
    });
  }

  function handlePointerUp() {
    dragState.current = null;
    setIsDragging(false);
  }

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={
          draggable
            ? {
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: isDragging ? 'none' : undefined,
              }
            : undefined
        }
        className="animate-module-in blob-panel min-h-0 max-h-dvh w-full max-w-md overflow-y-auto border border-terracotta/40 bg-navy/[0.82] p-10 backdrop-blur-md md:ml-[100px]"
      >
        {children}
      </div>
    </div>
  );
}
