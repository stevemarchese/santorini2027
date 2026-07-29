import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClosingModule from './ClosingModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('ClosingModule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('posts the draft with the note to /api/submit and shows a thank-you', async () => {
    const user = userEvent.setup();
    render(<ClosingModule draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: true, partySize: 2 }} />);

    await user.type(screen.getByLabelText(/anything you want to share/i), 'Can\'t wait');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/submit',
      expect.objectContaining({ method: 'POST' })
    );
    expect(await screen.findByText(/see you in santorini/i)).toBeInTheDocument();
  });

  it('shows the not-attending headline when attending is false', () => {
    render(<ClosingModule draft={{ ...EMPTY_DRAFT, name: 'Steve', attending: false }} />);
    expect(screen.getByText(/sorry to miss you/i)).toBeInTheDocument();
  });
});
