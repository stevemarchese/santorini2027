import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LetterModule from './LetterModule';
import { EMPTY_DRAFT } from '@/lib/types';

function renderLetter(props: Partial<React.ComponentProps<typeof LetterModule>> = {}) {
  const onAdvance = vi.fn();
  const onQuizPassed = vi.fn();
  render(
    <LetterModule
      draft={EMPTY_DRAFT}
      paragraphs={['First paragraph.', 'Last paragraph.']}
      onAdvance={onAdvance}
      quizPassed={true}
      onQuizPassed={onQuizPassed}
      {...props}
    />
  );
  return { onAdvance, onQuizPassed };
}

describe('LetterModule', () => {
  it('renders the provided paragraphs and both answer pills', () => {
    renderLetter();
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Last paragraph.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /count me in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /can't make it/i })).toBeInTheDocument();
  });

  it('advances with attending true on Count Me In once the quiz is passed', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderLetter({ draft: { ...EMPTY_DRAFT, partySize: 3 } });
    await user.click(screen.getByRole('button', { name: /count me in/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: true, partySize: 3 }));
  });

  it("advances with attending false and clears party size on Can't Make It", async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderLetter({ draft: { ...EMPTY_DRAFT, partySize: 3 } });
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: false, partySize: null }));
  });

  it('shows the quiz on Count Me In before passing and advances after the right answer', async () => {
    const user = userEvent.setup();
    const { onAdvance, onQuizPassed } = renderLetter({ quizPassed: false });
    await user.click(screen.getByRole('button', { name: /count me in/i }));
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    expect(onAdvance).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onQuizPassed).toHaveBeenCalled();
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: true }));
  });

  it("shows the quiz for Can't Make It too and advances with attending false after passing", async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderLetter({ quizPassed: false });
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    expect(onAdvance).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ attending: false }));
  });

  it('renders the Dirtyline title above the letter paragraphs', () => {
    renderLetter();
    expect(screen.getByText("Time flieS. let's hAve fun!")).toBeInTheDocument();
  });

  it('renders inside a wide ModulePanel', () => {
    renderLetter();
    const panel = document.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-2xl');
  });
});
