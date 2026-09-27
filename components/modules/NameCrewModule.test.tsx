import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NameCrewModule from './NameCrewModule';
import { EMPTY_DRAFT } from '@/lib/types';

describe('NameCrewModule', () => {
  it('advances with name, email and party size when attending', async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={onAdvance} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: /^next/i }));

    expect(onAdvance).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Steve', email: 'steve@example.com', partySize: 2 })
    );
  });

  it('keeps Next disabled while the email is invalid when attending', async () => {
    const user = userEvent.setup();
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: true }} onAdvance={vi.fn()} onBack={vi.fn()} />);
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.type(screen.getByLabelText(/^email/i), 'steve@nowhere');
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/^email/i), '.com');
    expect(screen.getByRole('button', { name: /^next/i })).toBeEnabled();
  });

  it('shows a hint under a malformed email and hides it once fixed or emptied', async () => {
    const user = userEvent.setup();
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: false }} onAdvance={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email/i), 'steve@nowhere');
    expect(screen.getByText("That email doesn't look right")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/^email/i), '.com');
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^email/i));
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
  });

  it('shows the email helper text and marks email optional when not attending', () => {
    render(<NameCrewModule draft={{ ...EMPTY_DRAFT, attending: false }} onAdvance={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('So we can send you the details.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).not.toBeRequired();
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
