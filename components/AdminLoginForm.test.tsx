import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginForm from './AdminLoginForm';

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  it('shows an error on an incorrect password', async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm />);
    await user.type(screen.getByLabelText(/admin password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /enter/i }));
    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
  });
});
