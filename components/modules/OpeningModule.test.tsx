import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpeningModule from './OpeningModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('OpeningModule', () => {
  it('advances with name, attending, and party size filled in', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.type(screen.getByLabelText(/your name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });

  it('disables Next until required fields are filled', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });

  it('renders the unselected attending buttons as legible cream pills', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    const imInButton = screen.getByRole('button', { name: /i'm in/i });
    expect(imInButton.className).toContain('rounded-full');
    expect(imInButton.className).toContain('bg-cream');
    expect(imInButton.className).toContain('text-navy');
  });

  it('offers six party-size pills mapping to 1 through 6', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /i'm in/i }));

    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });

  it('shows a required-field legend and asterisks on Name and Are you coming?', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByText('*required')).toBeInTheDocument();
    expect(screen.getByText('Your name *')).toBeInTheDocument();
    expect(screen.getByText('Are you coming? *')).toBeInTheDocument();
  });

  it('shows an asterisk on Party size once attending is true', async () => {
    const user = userEvent.setup();
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /i'm in/i }));
    expect(screen.getByText('Party size *')).toBeInTheDocument();
  });
});
