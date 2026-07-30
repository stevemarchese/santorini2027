'use client';

import { useRef, useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';
import { computeResponsesStats } from '@/lib/responses-stats';

interface ResponsesTableProps {
  responses: AdminResponse[];
}

const COLUMNS: { key: SortKey | null; label: string; srOnly?: boolean }[] = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'name', label: 'Name' },
  { key: 'attending', label: 'Attending' },
  { key: 'party_size', label: 'Party' },
  { key: 'hotel_nights', label: 'Hotel' },
  { key: null, label: 'Windows' },
  { key: 'window_priority', label: 'Priority' },
  { key: 'travel_timing', label: 'Travel' },
  { key: null, label: 'Travel Note' },
  { key: 'dinner_interested', label: 'Dinner' },
  { key: 'cruise_interested', label: 'Cruise' },
  { key: null, label: 'Note' },
  { key: null, label: 'Actions', srOnly: true },
];

const WINDOW_LABELS = { window_1: '6/30-7/6', window_2: '7/7-7/13', window_3: '7/14-7/18' } as const;
const WINDOW_KEYS = Object.keys(WINDOW_LABELS) as (keyof typeof WINDOW_LABELS)[];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [items, setItems] = useState(responses);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const cancelingEditRef = useRef(false);
  const editingIdRef = useRef<string | null>(null);

  const sorted = sortResponses(items, sortKey, sortDir);
  const stats = computeResponsesStats(items);
  const windowMaxCount = Math.max(...WINDOW_KEYS.map((key) => stats.windowPriorityCounts[key]));

  function handleSort(key: SortKey) {
    setActionError(null);
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
    setActionError(null);
    const csv = buildResponsesCsv(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `santorini-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(row: AdminResponse) {
    if (!window.confirm(`Delete ${row.name}'s response? This can't be undone.`)) return;
    setActionError(null);
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((current) => current.filter((r) => r.id !== row.id));
      } else {
        setActionError(`Couldn't delete ${row.name}'s response — try again.`);
      }
    } catch {
      setActionError(`Couldn't delete ${row.name}'s response — try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  function handleStartEdit(row: AdminResponse) {
    setActionError(null);
    // Reset defensively: if a previous edit was cancelled with Escape and the
    // resulting blur (see the input's onBlur below) was never actually fired
    // by the browser, this flag could otherwise stay stuck true and silently
    // swallow this new edit's save.
    cancelingEditRef.current = false;
    editingIdRef.current = row.id;
    setEditingId(row.id);
    setEditingValue(row.name);
  }

  function handleCancelEdit() {
    editingIdRef.current = null;
    setEditingId(null);
    setEditingValue('');
  }

  async function handleSaveEdit(row: AdminResponse) {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setActionError('Name is required');
      return;
    }
    if (trimmed === row.name) {
      handleCancelEdit();
      return;
    }
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setItems((current) => current.map((r) => (r.id === row.id ? { ...r, name: trimmed } : r)));
        if (editingIdRef.current === row.id) {
          handleCancelEdit();
        }
      } else {
        setActionError(`Couldn't save ${row.name}'s name — try again.`);
      }
    } catch {
      setActionError(`Couldn't save ${row.name}'s name — try again.`);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div data-testid="stat-attending" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Attending</div>
          <div className="text-2xl font-bold text-cream">{stats.totalGuests} guests</div>
          <div className="text-xs text-sage">
            {stats.totalAttending}/{stats.totalResponses} responses
          </div>
        </div>
        <div data-testid="stat-hotel" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Avg Hotel Stay</div>
          <div className="text-2xl font-bold text-cream">
            {stats.avgHotelNights == null ? '—' : `${stats.avgHotelNights} nights`}
          </div>
        </div>
        <div data-testid="stat-dinner-cruise" className="rounded-md border border-cream/25 p-3">
          <div className="text-xs uppercase tracking-wide text-sage">Dinner / Cruise</div>
          <div className="text-lg font-bold text-cream">
            {stats.dinnerGuestCount} dinner · {stats.cruiseGuestCount} cruise
          </div>
        </div>
        <div data-testid="stat-window-priority" className="rounded-md border border-cream/25 p-3 md:col-span-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-sage">Window Priority</div>
          {WINDOW_KEYS.map((key) => (
            <div key={key} className="mb-1 flex items-center gap-2 text-xs text-cream last:mb-0">
              <span className="w-20 shrink-0">{WINDOW_LABELS[key]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-cream/10">
                <div
                  data-bar-key={key}
                  className={stats.topPriorityWindow === key ? 'h-full bg-terracotta' : 'h-full bg-cream/30'}
                  style={{ width: `${(stats.windowPriorityCounts[key] / Math.max(1, windowMaxCount)) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right">{stats.windowPriorityCounts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-sage">
          {items.length} response{items.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-cream/35 px-3 py-1.5 text-sm text-cream hover:bg-cream/10"
        >
          Download CSV
        </button>
      </div>

      {actionError && <p className="mb-2 text-sm text-terracotta">{actionError}</p>}

      <table className="w-full border-collapse text-sm text-cream">
        <thead>
          <tr className="border-b border-cream/35 text-left uppercase text-sage">
            {COLUMNS.map((col) => (
              <th key={col.label} className="p-2">
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key as SortKey)}
                    className="uppercase hover:text-cream"
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                ) : col.srOnly ? (
                  <span className="sr-only">{col.label}</span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-cream/10">
              <td className="p-2">{new Date(row.created_at).toLocaleDateString()}</td>
              <td className="p-2">
                {editingId === row.id ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => {
                      // Defensive guard, not a relied-upon mechanism: some
                      // browsers may fire a native blur when a focused input
                      // is unmounted (as Escape does below), which would
                      // otherwise re-trigger a save. If that blur never
                      // arrives, handleStartEdit resets this flag at the
                      // start of the next edit so it can never go stale and
                      // swallow an unrelated future save.
                      if (cancelingEditRef.current) {
                        cancelingEditRef.current = false;
                        return;
                      }
                      handleSaveEdit(row);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        cancelingEditRef.current = true;
                        handleCancelEdit();
                      }
                    }}
                    className="w-full border-b border-cream/35 bg-transparent text-cream outline-none"
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStartEdit(row)}
                    className="cursor-pointer hover:underline"
                  >
                    {row.name}
                  </span>
                )}
              </td>
              <td className="p-2">{row.attending ? 'Yes' : 'No'}</td>
              <td className="p-2">{row.party_size ?? '—'}</td>
              <td className="p-2">
                {row.hotel_staying ? `Yes, ${row.hotel_nights}n` : row.hotel_staying === false ? 'No' : '—'}
              </td>
              <td className="p-2">
                {[row.window_1_selected && '6/30-7/6', row.window_2_selected && '7/7-7/13', row.window_3_selected && '7/14-7/18']
                  .filter(Boolean)
                  .join(', ') || '—'}
              </td>
              <td className="p-2">{row.window_priority ?? '—'}</td>
              <td className="p-2">{row.travel_timing ?? '—'}</td>
              <td className="p-2">{row.travel_note ?? '—'}</td>
              <td className="p-2">{row.dinner_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.cruise_interested ? 'Yes' : '—'}</td>
              <td className="p-2">{row.note ?? '—'}</td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  disabled={deletingId === row.id}
                  className="rounded border border-cream/35 px-2 py-1 text-xs text-cream hover:border-terracotta hover:text-terracotta disabled:opacity-40"
                >
                  {deletingId === row.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
