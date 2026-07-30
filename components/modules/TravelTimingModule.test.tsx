import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TravelTimingModule from './TravelTimingModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('TravelTimingModule', () => {
  it('selects a timing option and advances with the note', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<TravelTimingModule draft={EMPTY_DRAFT} onAdvance={onAdvance} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^both$/i }));
    await user.type(screen.getByLabelText(/anything else about your plans/i), 'Flying in early');
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ travelTiming: 'both', travelNote: 'Flying in early' })
    );
  });

  it('shows an asterisk on the heading', () => {
    render(<TravelTimingModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Traveling before or after Santorini? *')).toBeInTheDocument();
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<TravelTimingModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
