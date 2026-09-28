import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClosingModule from './ClosingModule';
import { EMPTY_DRAFT } from '@/lib/types';

const NOT_ATTENDING = 'Thanks for letting us know';

function renderClosing(overrides = {}) {
  render(<ClosingModule draft={{ ...EMPTY_DRAFT, attending: false, ...overrides }} confirmationNotAttending={NOT_ATTENDING} />);
}

describe('ClosingModule (decline)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('asks for name and email with the no-bother message, and no crew or hotel fields', () => {
    renderClosing();
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
    expect(screen.getByText(/so we don't bother you with future correspondence/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).not.toBeRequired();
    expect(screen.queryByRole('button', { name: 'Just me' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Adamastos Hotel' })).not.toBeInTheDocument();
  });

  it('keeps Send disabled until a name is entered, and rejects a malformed email', async () => {
    const user = userEvent.setup();
    renderClosing();
    const send = screen.getByRole('button', { name: /^send$/i });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText(/^name/i), 'Laura');
    expect(send).toBeEnabled();
    await user.type(screen.getByLabelText(/^email/i), 'laura@nowhere');
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText(/^email/i), '.com');
    expect(send).toBeEnabled();
  });

  it('submits the decline and shows the not-attending confirmation', async () => {
    const user = userEvent.setup();
    renderClosing();
    await user.type(screen.getByLabelText(/^name/i), 'Laura');
    await user.type(screen.getByLabelText(/^email/i), 'laura@example.com');
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) => c[0] === '/api/submit');
    expect(JSON.parse(call![1].body)).toMatchObject({ name: 'Laura', email: 'laura@example.com', attending: false });
    expect(await screen.findByText(/we heard you/i)).toBeInTheDocument();
    expect(screen.getByText(NOT_ATTENDING)).toBeInTheDocument();
  });

  it('shows the error state and re-enables Send when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const user = userEvent.setup();
    renderClosing({ name: 'Laura' });
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).toBeEnabled();
  });
});
