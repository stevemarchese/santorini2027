import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LetterModule from './LetterModule';
import { EMPTY_DRAFT } from '@/lib/types';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

describe('LetterModule', () => {
  it('renders the letter text and advances the unchanged draft on Next', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<LetterModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    expect(screen.getByText(LETTER_PARAGRAPHS[0])).toBeInTheDocument();
    expect(screen.getByText(LETTER_PARAGRAPHS[LETTER_PARAGRAPHS.length - 1])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
