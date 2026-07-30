import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsesTable from './ResponsesTable';
import type { AdminResponse } from '@/lib/payload';

function row(overrides: Partial<AdminResponse>): AdminResponse {
  return {
    id: overrides.name ?? 'id',
    created_at: '2026-07-01T00:00:00.000Z',
    name: 'Person',
    attending: true,
    party_size: null,
    hotel_staying: null,
    hotel_nights: null,
    window_1_selected: false,
    window_2_selected: false,
    window_3_selected: false,
    window_priority: null,
    travel_timing: null,
    travel_note: null,
    dinner_interested: null,
    cruise_interested: null,
    note: null,
    ...overrides,
  };
}

function bodyNames(): (string | null)[] {
  const rows = within(screen.getByRole('table').querySelector('tbody') as HTMLElement).getAllByRole('row');
  return rows.map((r) => within(r).getAllByRole('cell')[1].textContent);
}

describe('ResponsesTable', () => {
  const data = [row({ name: 'Charlie' }), row({ name: 'Alice' }), row({ name: 'Bob' })];

  it('reorders rows when the Name header is clicked', async () => {
    const user = userEvent.setup();
    render(<ResponsesTable responses={data} />);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(bodyNames()).toEqual(['Alice', 'Bob', 'Charlie']);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(bodyNames()).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('renders a Download CSV button', () => {
    render(<ResponsesTable responses={data} />);
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
  });

  it('renders the summary stats bar', () => {
    const statsData = [
      row({ name: 'A', attending: true, dinner_interested: true, cruise_interested: true }),
      row({ name: 'B', attending: false }),
    ];
    render(<ResponsesTable responses={statsData} />);
    expect(screen.getByText(/attending: 1 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/dinner: 1 yes/i)).toBeInTheDocument();
    expect(screen.getByText(/cruise: 1 yes/i)).toBeInTheDocument();
  });

  describe('delete', () => {
    it('removes the row and updates the stats bar after confirming', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/responses/${data[0].id}`, { method: 'DELETE' });
      expect(await screen.findByText(/2 responses/i)).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });

    it('keeps the row when the confirm is declined', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows an inline error and keeps the row when the delete fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(await screen.findByText(/couldn.t delete/i)).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });
});
