import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wizard from './Wizard';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content';

async function reachLetter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /let's make this real/i }));
}

describe('Wizard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it("starts on the splash screen and reveals the Letter after Let's Make This Real", async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SAntOrIni! PaRT DeUx');
    await user.click(screen.getByRole('button', { name: /let's make this real/i }));
    expect(screen.getByRole('button', { name: /count me in/i })).toBeInTheDocument();
  });

  it('walks an attending guest through the single confirm screen to send', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    await reachLetter(user);
    await user.click(screen.getByRole('button', { name: /count me in/i }));
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));

    expect(screen.getByText(/you already told us once/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(screen.getByText(DEFAULT_SITE_CONTENT.hotelBookingNote)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    const submitCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((call) => call[0] === '/api/submit');
    expect(JSON.parse(submitCall![1].body)).toMatchObject({
      name: 'Steve',
      email: 'steve@example.com',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
    });
    expect(await screen.findByText(DEFAULT_SITE_CONTENT.confirmationAttending)).toBeInTheDocument();
  });

  it('goes straight to the sorry screen for a guest who cannot make it', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);
    await reachLetter(user);
    await user.click(screen.getByRole('button', { name: /can't make it/i }));
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument();
    expect(screen.getByText(DEFAULT_SITE_CONTENT.confirmationNotAttending)).toBeInTheDocument();
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.some((c) => c[0] === '/api/submit')).toBe(false);
  });
});
