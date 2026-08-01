import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelModule from './HotelModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('HotelModule', () => {
  it('requires nights when staying, then advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={onAdvance} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: true, hotelNights: 4 })
    );
  });

  it('offers seven nights pills, the last one labeled 7+', async () => {
    const user = userEvent.setup();
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^yes$/i }));

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7+' })).toBeInTheDocument();
  });

  it('shows an asterisk on the staying question, with the hotel name linked', () => {
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={vi.fn()} />);
    const link = screen.getByRole('link', { name: 'Adamastos Hotel' });
    expect(link).toHaveAttribute('href', 'https://adamastoshotel.com/en/');
    expect(link.parentElement?.textContent).toBe('Do you plan on staying at the Adamastos Hotel *');
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<HotelModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
