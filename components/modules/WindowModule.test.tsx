import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WindowModule from './WindowModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('WindowModule', () => {
  it('advances once an answer is picked', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<WindowModule draft={EMPTY_DRAFT} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /tell me more/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: true }));
  });

  it('disables Next until an answer is picked', () => {
    render(<WindowModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
  });

  it('shows the Greece window copy and the question', () => {
    render(<WindowModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByText(/we are planning to be in greece/i)).toBeInTheDocument();
    expect(screen.getByText('Does that window work for you? *')).toBeInTheDocument();
  });

  describe('quiz gate', () => {
    it('shows the quiz overlay when either window button is clicked', async () => {
      const user = userEvent.setup();
      render(<WindowModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /can't make it work/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('hides the overlay and calls onQuizPassed once the correct answer is picked', async () => {
      const user = userEvent.setup();
      const onQuizPassed = vi.fn();
      render(<WindowModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={onQuizPassed} />);
      await user.click(screen.getByRole('button', { name: /tell me more/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Kiku' }));
      expect(onQuizPassed).toHaveBeenCalled();
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });

    it('never shows the overlay when quizPassed is already true', async () => {
      const user = userEvent.setup();
      render(<WindowModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /tell me more/i }));
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });
  });
});
