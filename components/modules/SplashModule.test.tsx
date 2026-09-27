import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SplashModule from './SplashModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('SplashModule', () => {
  it('renders the title and subhead, and advances the unchanged draft on Dates are set', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<SplashModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SAntOrIni! PaRT DeUx');
    expect(screen.getByText('twenty years in the making')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dates are set/i }));
    expect(onAdvance).toHaveBeenCalledWith(EMPTY_DRAFT);
  });

  it('renders the trip dates between the title and the tagline', () => {
    render(<SplashModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    const title = screen.getByRole('heading', { level: 1 });
    const dates = screen.getByText('June 30 – July 6, 2027');
    const tagline = screen.getByText('twenty years in the making');
    expect(title.compareDocumentPosition(dates) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dates.compareDocumentPosition(tagline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dates.className).toContain('50px');
  });
});
