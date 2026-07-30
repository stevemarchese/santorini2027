import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentEditor from './ContentEditor';

const content = {
  letter: 'Hello friend.',
  confirmationAttending: 'See you in Santorini',
  confirmationNotAttending: 'Thanks for letting us know',
};

describe('ContentEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('seeds the fields from the passed content', () => {
    render(<ContentEditor content={content} />);
    expect(screen.getByLabelText(/^letter$/i)).toHaveValue('Hello friend.');
    expect(screen.getByLabelText(/confirmation — attending/i)).toHaveValue('See you in Santorini');
    expect(screen.getByLabelText(/confirmation — not attending/i)).toHaveValue('Thanks for letting us know');
  });

  it('posts edited content to the API and shows a saved state', async () => {
    const user = userEvent.setup();
    render(<ContentEditor content={content} />);
    const letter = screen.getByLabelText(/^letter$/i);
    await user.clear(letter);
    await user.type(letter, 'New letter body');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/content',
      expect.objectContaining({ method: 'POST' })
    );
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(JSON.parse(call.body).letter).toBe('New letter body');
    expect(await screen.findByText(/saved\./i)).toBeInTheDocument();
  });
});
