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

  it('renders the summary stats cards with headcount and hotel/dinner/cruise numbers', () => {
    const statsData = [
      row({ name: 'A', attending: true, party_size: 4, dinner_interested: true, cruise_interested: true }),
      row({ name: 'B', attending: false, party_size: 2 }),
      row({ name: 'C', attending: true, party_size: 2, dinner_interested: true, cruise_interested: false }),
    ];
    render(<ResponsesTable responses={statsData} />);
    const attendingCard = screen.getByTestId('stat-attending');
    expect(within(attendingCard).getByText(/6 guests/i)).toBeInTheDocument();
    expect(within(attendingCard).getByText(/2\/3 responses/i)).toBeInTheDocument();
    expect(screen.getByTestId('stat-dinner-cruise')).toHaveTextContent('6 dinner · 4 cruise');
  });

  it('renders the window priority breakdown as bars with per-window counts and highlights the top window', () => {
    const windowData = [
      row({ name: 'A', window_priority: 'window_2' }),
      row({ name: 'B', window_priority: 'window_1' }),
      row({ name: 'C', window_priority: 'window_2' }),
    ];
    render(<ResponsesTable responses={windowData} />);
    const priorityCard = screen.getByTestId('stat-window-priority');
    expect(within(priorityCard).getByText('6/30-7/6')).toBeInTheDocument();
    expect(within(priorityCard).getByText('7/7-7/13')).toBeInTheDocument();
    expect(within(priorityCard).getByText('7/14-7/18')).toBeInTheDocument();
    expect(within(priorityCard).getByText('1')).toBeInTheDocument();
    expect(within(priorityCard).getByText('2')).toBeInTheDocument();
    const topBar = priorityCard.querySelector('[data-bar-key="window_2"]');
    const nonTopBar = priorityCard.querySelector('[data-bar-key="window_1"]');
    expect(topBar?.className).toContain('bg-terracotta');
    expect(nonTopBar?.className).not.toContain('bg-terracotta');
  });

  it('renders the window totals breakdown with per-window selection counts and no highlight', () => {
    const windowData = [
      row({ name: 'A', window_1_selected: true, window_2_selected: true }),
      row({ name: 'B', window_2_selected: true }),
    ];
    render(<ResponsesTable responses={windowData} />);
    const totalsCard = screen.getByTestId('stat-window-totals');
    expect(within(totalsCard).getByText('6/30-7/6')).toBeInTheDocument();
    expect(within(totalsCard).getByText('7/7-7/13')).toBeInTheDocument();
    expect(within(totalsCard).getByText('7/14-7/18')).toBeInTheDocument();
    expect(within(totalsCard).getByText('1')).toBeInTheDocument();
    expect(within(totalsCard).getByText('2')).toBeInTheDocument();
    expect(within(totalsCard).getByText('0')).toBeInTheDocument();
    const bars = totalsCard.querySelectorAll('[data-bar-key]');
    bars.forEach((bar) => expect(bar.className).not.toContain('bg-terracotta'));
  });

  it('shows a dash for the average hotel stay when nobody is staying at the hotel', () => {
    const noHotelData = [row({ name: 'A', hotel_staying: false }), row({ name: 'B', hotel_staying: null })];
    render(<ResponsesTable responses={noHotelData} />);
    expect(within(screen.getByTestId('stat-hotel')).getByText('—')).toBeInTheDocument();
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

  describe('edit name', () => {
    it('shows an input pre-filled with the current name when clicked', async () => {
      const user = userEvent.setup();
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
    });

    it('saves the new name on Enter and updates the row', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Enter}');
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/responses/${data[0].id}`,
        expect.objectContaining({ method: 'PATCH' })
      );
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(JSON.parse(call.body).name).toBe('Charlotte');
      expect(await screen.findByText('Charlotte')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Charlotte')).not.toBeInTheDocument();
    });

    it('cancels on Escape without saving', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Escape}');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows an error and keeps editing when the name is empty', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn());
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, '   {Enter}');
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('   ', { normalizer: (text) => text })).toBeInTheDocument();
    });

    it('shows an inline error and keeps editing when the save fails', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      render(<ResponsesTable responses={data} />);
      await user.click(screen.getByText('Charlie'));
      const input = screen.getByDisplayValue('Charlie');
      await user.clear(input);
      await user.type(input, 'Charlotte{Enter}');
      expect(await screen.findByText(/couldn.t save/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Charlotte')).toBeInTheDocument();
    });

    it('saves a second edit on a different row after an earlier save already completed', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);

      await user.click(screen.getByText('Charlie'));
      const charlieInput = screen.getByDisplayValue('Charlie');
      await user.clear(charlieInput);
      await user.type(charlieInput, 'Charlotte{Enter}');
      expect(await screen.findByText('Charlotte')).toBeInTheDocument();

      // A stale cancelingEditRef left set from the first save must not
      // silently swallow this second, unrelated save.
      await user.click(screen.getByText('Alice'));
      const aliceInput = screen.getByDisplayValue('Alice');
      await user.clear(aliceInput);
      await user.type(aliceInput, 'Alicia{Enter}');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `/api/admin/responses/${data[1].id}`,
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(await screen.findByText('Alicia')).toBeInTheDocument();
    });

    it('does not clobber an in-progress edit on a different row when an earlier save resolves late', async () => {
      const user = userEvent.setup();
      let resolveFetch: (value: { ok: boolean }) => void = () => {};
      const pending = new Promise<{ ok: boolean }>((resolve) => {
        resolveFetch = resolve;
      });
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending));
      render(<ResponsesTable responses={data} />);

      // Start saving Charlie, but the fetch never resolves yet.
      await user.click(screen.getByText('Charlie'));
      const charlieInput = screen.getByDisplayValue('Charlie');
      await user.clear(charlieInput);
      await user.type(charlieInput, 'Charlotte{Enter}');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Before that save resolves, start editing a different row.
      await user.click(screen.getByText('Alice'));
      const aliceInput = screen.getByDisplayValue('Alice');
      await user.clear(aliceInput);
      await user.type(aliceInput, 'Alicia');

      // Now let Charlie's stale save resolve.
      resolveFetch({ ok: true });
      await screen.findByText('Charlotte');

      // Alice's in-progress, unsaved edit must survive Charlie's late resolution.
      expect(screen.getByDisplayValue('Alicia')).toBeInTheDocument();
    });

    it('saves normally on the first attempt after an earlier edit on any row was cancelled with Escape', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      render(<ResponsesTable responses={data} />);

      // Cancel an edit with Escape. If a real blur never fires on unmount in
      // this environment, cancelingEditRef can be left stuck true.
      await user.click(screen.getByText('Charlie'));
      const charlieInput = screen.getByDisplayValue('Charlie');
      await user.clear(charlieInput);
      await user.type(charlieInput, 'Something{Escape}');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText('Charlie')).toBeInTheDocument();

      // A stale cancelingEditRef from the Escape above must not swallow this
      // unrelated save on the very next edit attempt.
      await user.click(screen.getByText('Alice'));
      const aliceInput = screen.getByDisplayValue('Alice');
      await user.clear(aliceInput);
      await user.type(aliceInput, 'Alicia{Enter}');

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/responses/${data[1].id}`,
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(await screen.findByText('Alicia')).toBeInTheDocument();
    });
  });
});
