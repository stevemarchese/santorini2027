'use client';
import { useRef, useEffect } from 'react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('muted', 'muted');
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 z-0 h-full w-full object-cover"
      src="/santorini_2027.mp4"
      autoPlay
      muted
      playsInline
    />
  );
}
