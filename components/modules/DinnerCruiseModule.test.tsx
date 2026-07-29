import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DinnerCruiseModule from './DinnerCruiseModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('DinnerCruiseModule', () => {
  it('toggles dinner and cruise interest independently and advances', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<DinnerCruiseModule draft={EMPTY_DRAFT} onAdvance={onAdvance} />);

    await user.click(screen.getByLabelText(/group dinner/i));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ dinnerInterested: true, cruiseInterested: false })
    );
  });
});
