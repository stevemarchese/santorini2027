import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Hero from './Hero';

function stubMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('Hero', () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it('renders a video that autoplays, is muted, and does not loop', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('muted');
    expect(video).not.toHaveAttribute('loop');
  });

  it('adds the breathing-zoom class to the stage surface and renders the boats overlay once the video ends', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video') as HTMLVideoElement;
    const surface = container.querySelector('.hero-stage-surface') as HTMLElement;
    expect(surface.className).not.toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(0);

    fireEvent.ended(video);

    expect(surface.className).toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });

  it('does not add breathing zoom or boats when prefers-reduced-motion is set', () => {
    stubMatchMedia(true);
    const { container } = render(<Hero />);
    const video = container.querySelector('video') as HTMLVideoElement;
    const surface = container.querySelector('.hero-stage-surface') as HTMLElement;

    fireEvent.ended(video);

    expect(surface.className).not.toContain('animate-hero-breathe');
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});
