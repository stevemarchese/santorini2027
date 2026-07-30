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
      row({ name: 'A', attending: true, party_size: 4, dinner_interested: true, cruise_interested: true }),
      row({ name: 'B', attending: false, party_size: 2 }),
      row({ name: 'C', attending: true, party_size: 2, dinner_interested: true, cruise_interested: false }),
    ];
    render(<ResponsesTable responses={statsData} />);
    expect(screen.getByText(/attending: 6 guests \(2\/3 responses\)/i)).toBeInTheDocument();
    expect(screen.getByText(/dinner: 6 guests interested/i)).toBeInTheDocument();
    expect(screen.getByText(/cruise: 4 guests interested/i)).toBeInTheDocument();
  });

  it('renders the window priority breakdown with per-window counts and bolds the top window', () => {
    const windowData = [
      row({ name: 'A', window_priority: 'window_2' }),
      row({ name: 'B', window_priority: 'window_1' }),
      row({ name: 'C', window_priority: 'window_2' }),
    ];
    render(<ResponsesTable responses={windowData} />);
    const priorityLine = screen.getByText(/window priority:/i).closest('span') as HTMLElement;
    expect(within(priorityLine).getByText(/6\/30-7\/6 1/)).toBeInTheDocument();
    expect(within(priorityLine).getByText(/7\/7-7\/13 2/)).toBeInTheDocument();
    expect(within(priorityLine).getByText(/7\/14-7\/18 0/)).toBeInTheDocument();
    const topWindow = within(priorityLine).getByText(/7\/7-7\/13 2/);
    expect(topWindow.className).toContain('font-bold');
    const nonTopWindow = within(priorityLine).getByText(/6\/30-7\/6 1/);
    expect(nonTopWindow.className).not.toContain('font-bold');
  });

  it('shows a dash for the average hotel stay when nobody is staying at the hotel', () => {
    const noHotelData = [row({ name: 'A', hotel_staying: false }), row({ name: 'B', hotel_staying: null })];
    render(<ResponsesTable responses={noHotelData} />);
    expect(screen.getByText(/avg hotel stay: —/i)).toBeInTheDocument();
  });

  describe('delete', () => {
    it('removes the row and updates the stats bar after confirming', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/responses/${data[0].id}`, { method: 'DELETE' });
      expect(await screen.findByText(/^2 responses$/i)).toBeInTheDocument();
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

    it('shows an inline error and keeps the row when the fetch promise rejects', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
      expect(await screen.findByText(/couldn.t delete/i)).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });
});
