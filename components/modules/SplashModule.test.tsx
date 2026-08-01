import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SplashModule from './SplashModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('SplashModule', () => {
  it('renders the title and subhead, and advances the unchanged draft on Tell Me More', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<SplashModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    expect(screen.getByText('SAntOrIni! PaRT DeUx')).toBeInTheDocument();
    expect(screen.getByText('twenty years in the making')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /tell me more/i }));
    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });
});
