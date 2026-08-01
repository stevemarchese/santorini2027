import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizGate from './QuizGate';

describe('QuizGate', () => {
  it('renders the photo, question, and four answer options in order', () => {
    render(<QuizGate onPass={vi.fn()} />);
    expect(screen.getByAltText(/dog/i)).toBeInTheDocument();
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Cookie', 'Marshmallow', 'Kiku', 'Cloud Puff']);
  });

  it('calls onPass when the correct answer is clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onPass).toHaveBeenCalled();
  });

  it('shows a retry message and does not call onPass when a wrong answer is clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Cookie' }));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByText(/guess again/i)).toBeInTheDocument();
  });

  it('still accepts the correct answer after a prior wrong attempt', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    await user.click(screen.getByRole('button', { name: 'Marshmallow' }));
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(onPass).toHaveBeenCalled();
  });

  it('does not lock out the same wrong option after clicking it once', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    render(<QuizGate onPass={onPass} />);
    const cookie = screen.getByRole('button', { name: 'Cookie' });
    await user.click(cookie);
    expect(cookie).not.toBeDisabled();
    await user.click(cookie);
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByText(/guess again/i)).toBeInTheDocument();
  });

  it('shows a different retry message for each distinct wrong option, in light blue', async () => {
    const user = userEvent.setup();
    render(<QuizGate onPass={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cookie' }));
    const first = screen.getByText(/guess again/i);
    expect(first.className).toContain('text-sky-300');

    await user.click(screen.getByRole('button', { name: 'Marshmallow' }));
    const second = screen.getByText(/still not it/i);
    expect(second).toBeInTheDocument();
    expect(second.className).toContain('text-sky-300');

    await user.click(screen.getByRole('button', { name: 'Cloud Puff' }));
    expect(screen.getByText(/third time/i)).toBeInTheDocument();
  });

  it('does not advance the retry message on a repeated click of the same wrong option', async () => {
    const user = userEvent.setup();
    render(<QuizGate onPass={vi.fn()} />);

    const cookie = screen.getByRole('button', { name: 'Cookie' });
    await user.click(cookie);
    await user.click(cookie);
    await user.click(cookie);

    expect(screen.getByText(/guess again/i)).toBeInTheDocument();
  });

  it('darkens each wrong option once picked, leaving untried options cream', async () => {
    const user = userEvent.setup();
    render(<QuizGate onPass={vi.fn()} />);

    const cookie = screen.getByRole('button', { name: 'Cookie' });
    const marshmallow = screen.getByRole('button', { name: 'Marshmallow' });
    const kiku = screen.getByRole('button', { name: 'Kiku' });

    expect(cookie.className).toContain('bg-cream');
    await user.click(cookie);
    expect(cookie.className).not.toContain('bg-cream');
    expect(cookie.className).toContain('bg-navy/40');

    expect(marshmallow.className).toContain('bg-cream');
    expect(kiku.className).toContain('bg-cream');
  });
});
