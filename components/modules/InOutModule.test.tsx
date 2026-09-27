import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InOutModule from './InOutModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('InOutModule', () => {
  it('shows the locked dates and the two pills', () => {
    render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByText('June 30 – July 6, 2027')).toBeInTheDocument();
    expect(screen.getByText(/from tuesday june 30 through monday july 6, 2027/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /i'm in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /can't make it/i })).toBeInTheDocument();
  });

  it('disables Next until a pill is picked, then advances with attending set', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<InOutModule draft={EMPTY_DRAFT} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: true }));
  });

  it("clears party size when switching to Can't make it", async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(
      <InOutModule draft={{ ...EMPTY_DRAFT, partySize: 3 }} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: false, partySize: null }));
  });

  describe('quiz gate', () => {
    it('shows the quiz when a pill is clicked before passing', async () => {
      const user = userEvent.setup();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('hides the quiz and calls onQuizPassed on the right answer', async () => {
      const user = userEvent.setup();
      const onQuizPassed = vi.fn();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={onQuizPassed} />);
      await user.click(screen.getByRole('button', { name: /can't make it/i }));
      await user.click(screen.getByRole('button', { name: 'Kiku' }));
      expect(onQuizPassed).toHaveBeenCalled();
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });

    it('never shows the quiz once passed', async () => {
      const user = userEvent.setup();
      render(<InOutModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });
  });
});
