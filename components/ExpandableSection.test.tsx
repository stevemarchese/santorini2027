import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpandableSection from './ExpandableSection';

describe('ExpandableSection', () => {
  it('keeps children in the document when closed, collapsed via grid-rows-[0fr]', () => {
    const { container } = render(
      <ExpandableSection open={false}>
        <p>Hidden content</p>
      </ExpandableSection>
    );
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('grid-rows-[0fr]');
  });

  it('expands to grid-rows-[1fr] when open', () => {
    const { container } = render(
      <ExpandableSection open={true}>
        <p>Visible content</p>
      </ExpandableSection>
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('grid-rows-[1fr]');
  });
});
