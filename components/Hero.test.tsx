import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Hero from './Hero';

describe('Hero', () => {
  it('renders a video that autoplays, is muted, and does not loop', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('muted');
    expect(video).not.toHaveAttribute('loop');
  });
});
