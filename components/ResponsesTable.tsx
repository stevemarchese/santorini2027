import type { ResponseRow } from '@/lib/payload';

interface ResponsesTableProps {
  responses: (ResponseRow & { id: string; created_at: string })[];
}

export default function ResponsesTable({ responses }: ResponsesTableProps) {
  return (
    <table className="w-full border-collapse text-sm text-cream">
      <thead>
        <tr className="border-b border-cream/35 text-left uppercase text-sage">
          <th className="p-2">Submitted</th>
          <th className="p-2">Name</th>
          <th className="p-2">Attending</th>
          <th className="p-2">Party</th>
          <th className="p-2">Hotel</th>
          <th className="p-2">Windows</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Travel</th>
          <th className="p-2">Travel Note</th>
          <th className="p-2">Dinner</th>
          <th className="p-2">Cruise</th>
          <th className="p-2">Note</th>
        </tr>
      </thead>
      <tbody>
        {responses.map((row) => (
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
  );
}
