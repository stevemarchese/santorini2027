import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wizard from './Wizard';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content';

describe('Wizard', () => {
  it('does not re-show the quiz gate after passing it once and navigating back to Opening', async () => {
    const user = userEvent.setup();
    render(<Wizard content={DEFAULT_SITE_CONTENT} />);

    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.type(screen.getByLabelText(/^name/i), 'S');
    expect(screen.getByText(/who is this/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kiku' }));
    expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: 'Just me' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    await user.click(screen.getByRole('button', { name: /back/i }));

    await user.type(screen.getByLabelText(/^name/i), 'teve');
    expect(screen.queryByText(/who is this/i)).not.toBeInTheDocument();
  });
});
