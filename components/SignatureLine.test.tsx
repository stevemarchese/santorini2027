import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignatureLine, { isSignatureParagraph } from './SignatureLine';

describe('isSignatureParagraph', () => {
  it('matches the exact signature line', () => {
    expect(isSignatureParagraph('Steve, Andi & Nicolas')).toBe(true);
  });

  it('matches when merged with a preceding line via a single newline', () => {
    expect(isSignatureParagraph('With love,\nSteve, Andi & Nicolas')).toBe(true);
  });

  it('does not match unrelated paragraphs', () => {
    expect(isSignatureParagraph('Hi friend.')).toBe(false);
  });
});

describe('SignatureLine', () => {
  it('renders the preceding text on its own line above the signature', () => {
    const { container } = render(<SignatureLine paragraph={'With love,\nSteve, Andi & Nicolas'} />);
    expect(container.textContent).toContain('With love,');
    expect(container.querySelector('br')).not.toBeNull();
  });

  it('renders only the first letter of each name in the Dirtyline font', () => {
    render(<SignatureLine paragraph="Steve, Andi & Nicolas" />);
    const paragraph = screen.getByText((_, element) => element?.tagName === 'P');
    const stylized = paragraph.querySelectorAll('span');
    expect(Array.from(stylized).map((span) => span.textContent)).toEqual(['S', 'A', 'N']);
    expect(paragraph.textContent).toBe('Steve, Andi & Nicolas');
  });
});
