import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClosingModule from './ClosingModule';
import { EMPTY_DRAFT } from '@/lib/types';

const CONFIRMATIONS = {
  confirmationAttending: 'See you in Santorini',
  confirmationNotAttending: 'Thanks for letting us know',
};

describe('ClosingModule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('posts the draft with the note to /api/submit and shows the attending confirmation', async () => {
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );

    await user.type(screen.getByLabelText(/anything else you'd like to share/i), 'Can\'t wait');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/submit',
      expect.objectContaining({ method: 'POST' })
    );
    expect(await screen.findByText(/see you in santorini/i)).toBeInTheDocument();
  });

  it('shows the not-attending pre-submit headline when attending is false', () => {
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
  });

  it('shows the not-attending confirmation after sending', async () => {
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );
    await user.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText(/thanks for letting us know/i)).toBeInTheDocument();
  });

  it('shows the error state and re-enables Send when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const user = userEvent.setup();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={vi.fn()}
        {...CONFIRMATIONS}
      />
    );

    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^send$/i })).not.toBeDisabled();
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ClosingModule
        draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }}
        onBack={onBack}
        {...CONFIRMATIONS}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
