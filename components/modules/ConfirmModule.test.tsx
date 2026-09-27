import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModule from './ConfirmModule';
import { EMPTY_DRAFT } from '@/lib/types';

const NOTE = "Book directly and mention Steve & Andi's group.";
const CONFIRMED = 'See you in Santorini';

function renderConfirm(overrides = {}) {
  render(
    <ConfirmModule
      draft={{ ...EMPTY_DRAFT, attending: true, ...overrides }}
      bookingNote={NOTE}
      confirmationAttending={CONFIRMED}
    />
  );
}

describe('ConfirmModule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('tells guests we are asking again and shows every field on one screen', () => {
    renderConfirm();
    expect(screen.getByText(/you already told us once/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Adamastos Hotel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/anything else/i)).not.toBeInTheDocument();
  });

  it('keeps Send disabled until name, email, crew and a hotel answer are valid', async () => {
    const user = userEvent.setup();
    renderConfirm();
    const send = screen.getByRole('button', { name: /^send$/i });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    expect(send).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /^no$/i }));
    expect(send).toBeEnabled();
  });

  it('submits the draft with hotel dates and shows the attending confirmation', async () => {
    const user = userEvent.setup();
    renderConfirm();
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.change(screen.getByLabelText(/^depart/i), { target: { value: '2027-07-04' } });
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) => c[0] === '/api/submit');
    expect(JSON.parse(call![1].body)).toMatchObject({
      name: 'Steve',
      email: 'steve@example.com',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-04',
    });
    expect(await screen.findByText(CONFIRMED)).toBeInTheDocument();
  });

  it('shows the error state and re-enables Send when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderConfirm({ name: 'Steve', email: 'steve@example.com', partySize: 1, hotelStaying: false });
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).toBeEnabled();
  });
});
