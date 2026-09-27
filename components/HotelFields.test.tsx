import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelFields from './HotelFields';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse } from '@/lib/types';

const NOTE = "Book directly and mention Steve & Andi's group.";

function Harness({ initial }: { initial: DraftResponse }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <HotelFields value={value} bookingNote={NOTE} onChange={setValue} />
      <output data-testid="state">{JSON.stringify(value)}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}');

describe('HotelFields', () => {
  it('links the hotel name and asks the staying question', () => {
    render(<Harness initial={EMPTY_DRAFT} />);
    const link = screen.getByRole('link', { name: 'Adamastos Hotel' });
    expect(link).toHaveAttribute('href', 'https://adamastoshotel.com/en/');
    expect(link.parentElement?.textContent).toBe('Staying at the Adamastos Hotel? *');
  });

  it('pre-fills the trip dates on Yes', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-06-30');
    expect(screen.getByLabelText(/^depart/i)).toHaveValue('2027-07-06');
    expect(state()).toMatchObject({ hotelStaying: true, arrivalDate: '2027-06-30', departureDate: '2027-07-06' });
  });

  it('bounds the date inputs to the allowed stay range', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveAttribute('min', '2027-06-26');
    expect(screen.getByLabelText(/^depart/i)).toHaveAttribute('max', '2027-07-12');
  });

  it('shows the ordering hint when depart is not after arrive', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-06-30' } });
    expect(screen.getByText('Depart needs to be after arrive')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-07-02' } });
    expect(screen.queryByText('Depart needs to be after arrive')).not.toBeInTheDocument();
  });

  it('shows the required hint when a date is cleared', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/^arrive/i), { target: { value: '' } });
    expect(screen.getByText('Arrival and departure dates are required')).toBeInTheDocument();
  });

  it('shows the booking note with the hotel link when staying', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /adamastos/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('clears the dates when the guest switches to No', async () => {
    const user = userEvent.setup();
    render(<Harness initial={EMPTY_DRAFT} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    await user.click(screen.getByRole('button', { name: /^no$/i }));
    expect(state()).toMatchObject({ hotelStaying: false, arrivalDate: null, departureDate: null });
  });

  it('keeps dates the guest already chose', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...EMPTY_DRAFT, hotelStaying: true, arrivalDate: '2027-07-01', departureDate: '2027-07-04' }} />);
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByLabelText(/^arrive/i)).toHaveValue('2027-07-01');
  });
});
