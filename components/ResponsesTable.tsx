'use client';

import { useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';
import { computeResponsesStats } from '@/lib/responses-stats';

interface ResponsesTableProps {
  responses: AdminResponse[];
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
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
  { key: null, label: '' },
];

const WINDOW_LABELS = { window_1: '6/30-7/6', window_2: '7/7-7/13', window_3: '7/14-7/18' } as const;
const WINDOW_KEYS = Object.keys(WINDOW_LABELS) as (keyof typeof WINDOW_LABELS)[];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [items, setItems] = useState(responses);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sorted = sortResponses(items, sortKey, sortDir);
  const stats = computeResponsesStats(items);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
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
    setDeleteError(null);
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((current) => current.filter((r) => r.id !== row.id));
      } else {
        setDeleteError(`Couldn't delete ${row.name}'s response — try again.`);
      }
    } catch {
      setDeleteError(`Couldn't delete ${row.name}'s response — try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-sage">
        <span>
          Attending: {stats.totalAttending} / {stats.totalResponses}
        </span>
        <span>Avg hotel stay: {stats.avgHotelNights == null ? '—' : `${stats.avgHotelNights} nights`}</span>
        <span>
          Window priority:{' '}
          {WINDOW_KEYS.map((key, i) => (
            <span key={key} className={stats.topPriorityWindow === key ? 'font-bold text-cream' : undefined}>
              {i > 0 ? ' · ' : ''}
              {WINDOW_LABELS[key]} {stats.windowPriorityCounts[key]}
            </span>
          ))}
        </span>
        <span>Dinner: {stats.dinnerYesCount} yes</span>
        <span>Cruise: {stats.cruiseYesCount} yes</span>
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

      {deleteError && <p className="mb-2 text-sm text-terracotta">{deleteError}</p>}

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
              <td className="p-2">{row.name}</td>
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
