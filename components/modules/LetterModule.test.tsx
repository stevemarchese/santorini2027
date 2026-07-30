import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LetterModule from './LetterModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('LetterModule', () => {
  it('renders the provided paragraphs and advances the unchanged draft on Next', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    const paragraphs = ['First paragraph.', 'Last paragraph.'];
    render(<LetterModule draft={EMPTY_DRAFT} paragraphs={paragraphs} onAdvance={onAdvance} />);

    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Last paragraph.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
