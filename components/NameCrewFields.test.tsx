import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NameCrewFields from './NameCrewFields';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse } from '@/lib/types';

function Harness({ initial }: { initial: DraftResponse }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NameCrewFields value={value} onChange={setValue} />
      <output data-testid="state">{JSON.stringify(value)}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}');

describe('NameCrewFields', () => {
  it('captures name, email and crew size when attending', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...EMPTY_DRAFT, attending: true }} />);
    await user.type(screen.getByLabelText(/^name/i), 'Steve');
    await user.type(screen.getByLabelText(/^email/i), 'steve@example.com');
    await user.click(screen.getByRole('button', { name: '+1' }));
    expect(state()).toMatchObject({ name: 'Steve', email: 'steve@example.com', partySize: 2 });
  });

  it('offers six party-size pills', () => {
    render(<Harness initial={{ ...EMPTY_DRAFT, attending: true }} />);
    expect(screen.getByRole('button', { name: 'Just me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
  });

  it('shows a hint under a malformed email and hides it once fixed or emptied', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...EMPTY_DRAFT, attending: true }} />);
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email/i), 'steve@nowhere');
    expect(screen.getByText("That email doesn't look right")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email/i), '.com');
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^email/i));
    expect(screen.queryByText("That email doesn't look right")).not.toBeInTheDocument();
  });

  it('shows the email helper text and marks email required when attending', () => {
    render(<Harness initial={{ ...EMPTY_DRAFT, attending: true }} />);
    expect(screen.getByText('So we can send you the details.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeRequired();
  });
});
