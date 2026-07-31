import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HeroBoats from './HeroBoats';

describe('HeroBoats', () => {
  it('renders all four boats with their positioning classes', () => {
    const { container } = render(<HeroBoats />);
    expect(container.querySelectorAll('svg')).toHaveLength(4);
    expect(container.querySelector('.hero-boat-1')).not.toBeNull();
    expect(container.querySelector('.hero-boat-2')).not.toBeNull();
    expect(container.querySelector('.hero-boat-3')).not.toBeNull();
    expect(container.querySelector('.hero-boat-4')).not.toBeNull();
  });

  it('is purely decorative and does not intercept clicks', () => {
    const { container } = render(<HeroBoats />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper.className).toContain('pointer-events-none');
  });
});
