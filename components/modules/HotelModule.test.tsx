import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelModule from './HotelModule';
import { EMPTY_DRAFT } from '@/lib/types';

const NOTE = "Book directly and mention Steve & Andi's group.";

function renderHotel(overrides = {}, onAdvance = vi.fn(), onBack = vi.fn()) {
  render(<HotelModule draft={{ ...EMPTY_DRAFT, ...overrides }} bookingNote={NOTE} onAdvance={onAdvance} onBack={onBack} />);
  return { onAdvance, onBack };
}

describe('HotelModule', () => {
  it('links the hotel name and asks the staying question', () => {
    renderHotel();
    const link = screen.getByRole('link', { name: 'Adamastos Hotel' });
    expect(link).toHaveAttribute('href', 'https://adamastoshotel.com/en/');
    expect(link.parentElement?.textContent).toBe('Staying at the Adamastos Hotel? *');
  });

  it('pre-fills the trip dates on Yes and advances with them', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-06-30');
    expect(screen.getByLabelText(/^depart/i)).toHaveValue('2027-07-06');
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' })
    );
  });

  it('bounds the date inputs to the allowed stay range', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveAttribute('min', '2027-06-26');
    expect(screen.getByLabelText(/^arrive/i)).toHaveAttribute('max', '2027-07-12');
    expect(screen.getByLabelText(/^depart/i)).toHaveAttribute('min', '2027-06-26');
    expect(screen.getByLabelText(/^depart/i)).toHaveAttribute('max', '2027-07-12');
  });

  it('disables Next and shows the hint when depart is not after arrive', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-06-30' } });
    expect(screen.getByText('Depart needs to be after arrive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-07-02' } });
    expect(screen.queryByText('Depart needs to be after arrive')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeEnabled();
  });

  it('shows the booking note with the hotel link when staying', async () => {
    const user = userEvent.setup();
    renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /adamastos/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('clears the dates when the guest switches to No', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderHotel();
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    await user.click(screen.getByRole('button', { name: /^no$/i }));
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ hotelStaying: false, arrivalDate: null, departureDate: null })
    );
  });

  it('keeps dates the guest already chose when returning to the step', async () => {
    const user = userEvent.setup();
    renderHotel({ hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-04' });
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-07-01');
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-07-01');
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderHotel();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
