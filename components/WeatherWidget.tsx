'use client';
import { useEffect, useState } from 'react';

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" className={className} fill="currentColor" aria-hidden="true">
      <path d="m1126.8 600c0-48-175.2-67.199-188.4-109.2-14.398-44.398 115.2-163.2 88.801-200.4-27.602-37.199-180 49.199-217.2 22.801-37.199-26.398-1.1992-199.2-45.602-213.6-44.402-14.402-116.4 145.2-164.4 145.2s-120-159.6-163.2-146.4c-44.398 14.398-8.3984 187.2-45.602 213.6-37.199 27.602-190.8-60-217.2-22.801s103.2 154.8 88.801 200.4c-14.402 43.199-189.6 62.398-189.6 110.4s175.2 67.199 188.4 109.2c14.398 44.398-115.2 163.2-88.801 200.4 27.602 37.199 180-49.199 217.2-22.801 37.199 26.398 1.1992 199.2 45.602 213.6 44.402 14.402 116.4-145.2 164.4-145.2s120 159.6 163.2 146.4c44.398-14.398 8.3984-187.2 45.602-213.6 37.199-27.602 190.8 60 217.2 22.801s-103.2-154.8-88.801-200.4c14.402-43.199 189.6-62.398 189.6-110.4zm-526.8 296.4c-163.2 0-296.4-132-296.4-296.4s132-296.4 296.4-296.4 296.4 132 296.4 296.4-133.2 296.4-296.4 296.4z" />
      <path d="m825.6 598.8c0 124.59-101.01 225.6-225.6 225.6s-225.6-101-225.6-225.6c0-124.6 101.01-225.6 225.6-225.6s225.6 101 225.6 225.6z" />
    </svg>
  );
}

const SANTORINI_LATITUDE = 36.3932;
const SANTORINI_LONGITUDE = 25.4615;

export async function fetchSantoriniTemperature(): Promise<number> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${SANTORINI_LATITUDE}&longitude=${SANTORINI_LONGITUDE}&current=temperature_2m&temperature_unit=fahrenheit`
  );
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.current.temperature_2m;
}

export default function WeatherWidget() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchSantoriniTemperature()
      .then(setTemperature)
      .catch(() => setFailed(true));
  }, []);

  if (failed || temperature === null) return null;

  return (
    <div className="fixed right-4 top-4 z-20 flex flex-col items-center text-cream">
      <SunGlyph className="h-7 w-7" />
      <span className="mt-1 text-sm font-bold">{Math.round(temperature)}°F</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-sage">Santorini</span>
    </div>
  );
}
