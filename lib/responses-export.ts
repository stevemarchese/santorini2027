import type { AdminResponse } from './payload';

const HEADERS = [
  'Submitted',
  'Name',
  'Attending',
  'Party',
  'Hotel',
  'Windows',
  'Priority',
  'Travel',
  'Travel Note',
  'Dinner',
  'Cruise',
  'Note',
];

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function windowsValue(row: AdminResponse): string {
  return [
    row.window_1_selected && '6/30-7/6',
    row.window_2_selected && '7/7-7/13',
    row.window_3_selected && '7/14-7/18',
  ]
    .filter(Boolean)
    .join(', ');
}

function hotelValue(row: AdminResponse): string {
  if (row.hotel_staying) return `Yes, ${row.hotel_nights}n`;
  if (row.hotel_staying === false) return 'No';
  return '';
}

function yesNo(value: boolean | null): string {
  return value == null ? '' : value ? 'Yes' : 'No';
}

function rowValues(row: AdminResponse): string[] {
  return [
    row.created_at.slice(0, 10),
    row.name,
    row.attending ? 'Yes' : 'No',
    row.party_size == null ? '' : String(row.party_size),
    hotelValue(row),
    windowsValue(row),
    row.window_priority ?? '',
    row.travel_timing ?? '',
    row.travel_note ?? '',
    yesNo(row.dinner_interested),
    yesNo(row.cruise_interested),
    row.note ?? '',
  ];
}

export function buildResponsesCsv(rows: AdminResponse[]): string {
  const lines = [HEADERS, ...rows.map(rowValues)].map((cols) => cols.map(escapeCsv).join(','));
  return lines.join('\n');
}
