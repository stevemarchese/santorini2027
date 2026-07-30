'use client';

import { useState } from 'react';
import type { AdminResponse } from '@/lib/payload';
import { sortResponses, type SortKey, type SortDirection } from '@/lib/responses-sort';
import { buildResponsesCsv } from '@/lib/responses-export';

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
];

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const sorted = sortResponses(responses, sortKey, sortDir);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  function handleDownload() {
    const csv = buildResponsesCsv(responses);
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-sage">{responses.length} response{responses.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-cream/35 px-3 py-1.5 text-sm text-cream hover:bg-cream/10"
        >
          Download CSV
        </button>
      </div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
