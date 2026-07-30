import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelModule from './HotelModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('HotelModule', () => {
  it('requires nights when staying, then advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/how many nights/i), '4');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: true, hotelNights: 4 })
    );
  });

  it('shows a required-field legend and asterisk on the staying question', () => {
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Staying at the Adamastos Hotel? *')).toBeInTheDocument();
  });
});
