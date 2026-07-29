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
    await user.type(screen.getByLabelText(/party size/i), '2');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', attending: true, partySize: 2 })
    );
  });

  it('disables Next until required fields are filled', () => {
    render(<OpeningModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });
});
