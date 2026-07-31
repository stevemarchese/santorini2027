'use client';
import { useEffect, useRef, useState } from 'react';
import HeroBoats from '@/components/HeroBoats';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('muted', 'muted');
    }
    setReducedMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  }, []);

  const showMotion = ended && !reducedMotion;

  return (
    <div className="hero-stage">
      <div className={`hero-stage-surface${showMotion ? ' animate-hero-breathe' : ''}`}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src="/santorini_2027.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setEnded(true)}
        />
        {showMotion && <HeroBoats />}
      </div>
    </div>
  );
}
