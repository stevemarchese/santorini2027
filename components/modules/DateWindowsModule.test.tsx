import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateWindowsModule from './DateWindowsModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('DateWindowsModule', () => {
  it('selects a window, auto-marks it as top pick, and advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<DateWindowsModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByLabelText(/7\/7 – 7\/13/));
    expect(screen.getByText(/top pick/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ window2Selected: true, windowPriority: 'window_2' })
    );
  });

  it('shows a required-field legend and asterisk on the heading', () => {
    render(<DateWindowsModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Which weeks could work? *')).toBeInTheDocument();
  });
});
