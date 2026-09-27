export const TRIP_START = '2027-06-30';
export const TRIP_END = '2027-07-06';
export const STAY_MIN = '2027-06-26';
export const STAY_MAX = '2027-07-12';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD as a UTC day number so DST and local offsets never matter. */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function nightsBetween(arrive: string, depart: string): number {
  return dayNumber(depart) - dayNumber(arrive);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

function isoFromDayNumber(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Every night from `fromIso` up to, but not including, `toIsoExclusive`. */
export function eachNight(fromIso: string, toIsoExclusive: string): string[] {
  const start = dayNumber(fromIso);
  const end = dayNumber(toIsoExclusive);
  const nights: string[] = [];
  for (let day = start; day < end; day++) nights.push(isoFromDayNumber(day));
  return nights;
}
