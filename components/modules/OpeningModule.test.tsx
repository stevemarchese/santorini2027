import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpeningModule from './OpeningModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('OpeningModule', () => {
  it('advances with name, attending, and party size filled in', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={onAdvance} quizPassed={true} onQuizPassed={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });

  it('disables Next until required fields are filled', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
  });

  it('renders the unselected attending buttons as legible cream pills', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    const imInButton = screen.getByRole('button', { name: /i'm in/i });
    expect(imInButton.className).toContain('rounded-full');
    expect(imInButton.className).toContain('bg-cream');
    expect(imInButton.className).toContain('text-navy');
  });

  it('offers six party-size pills mapping to 1 through 6', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /i'm in/i }));

    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });

  it('shows a required-field legend and asterisks on Name and Are you planning on coming?', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('NAME/FAMILY NAME *')).toBeInTheDocument();
    expect(screen.getByText('Are you planning on coming? *')).toBeInTheDocument();
  });

  it('shows an asterisk on the crew-size question once attending is true', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    expect(screen.getByText('How many in your crew? *')).toBeInTheDocument();
  });

  describe('quiz gate', () => {
    it('shows the quiz overlay after the first character typed in the name field', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      await user.type(screen.getByLabelText(/^name/i), 'S');
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('shows the quiz overlay when either attending pill is clicked', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /can't make it/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it('hides the overlay and calls onQuizPassed once the correct answer is picked, without losing the in-progress name', async () => {
      const user = userEvent.setup();
      const onQuizPassed = vi.fn();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={onQuizPassed} />);
      const name = screen.getByLabelText(/^name/i);
      await user.type(name, 'S');
      await user.click(screen.getByRole('button', { name: 'Kiku' }));
      expect(onQuizPassed).toHaveBeenCalled();
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
      expect(name).toHaveValue('S');
    });

    it('never shows the overlay when quizPassed is already true', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={true} onQuizPassed={vi.fn()} />);
      await user.type(screen.getByLabelText(/^name/i), 'Steve');
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
    });

    it('replaces the draggable panel with the quiz overlay while the quiz is open', async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      expect(document.querySelector('[style*="translate"]')).not.toBeNull();
      await user.type(screen.getByLabelText(/^name/i), 'S');
      expect(document.querySelector('[style*="translate"]')).toBeNull();
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });

    it("shows the quiz overlay when the I'm in pill is clicked from a fresh state", async () => {
      const user = userEvent.setup();
      render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} quizPassed={false} onQuizPassed={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /i'm in/i }));
      expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    });
  });
});
