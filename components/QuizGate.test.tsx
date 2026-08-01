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
});
