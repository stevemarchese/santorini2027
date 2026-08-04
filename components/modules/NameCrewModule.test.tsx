import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NameCrewModule from './NameCrewModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('NameCrewModule', () => {
  it('advances with name and party size filled in when attending', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(
      <NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={onAdvance} onBack={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ name: 'Steve', partySize: 2 }));
  });

  it('advances with just a name when not attending', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(
      <NameCrewModule draft={{ ...EMPTY_DRAFT, attending: false }} onAdvance={onAdvance} onBack={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(expect.objectContaining({ name: 'Steve' }));
  });

  it('disables Next until name is filled in', () => {
    render(
      <NameCrewModule draft={{ ...EMPTY_DRAFT, attending: false }} onAdvance={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
  });

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<NameCrewModule draft={EMPTY_DRAFT} onAdvance={vi.fn()} onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('offers six party-size pills mapping to 1 through 6 when attending', () => {
    render(
      <NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });
});
