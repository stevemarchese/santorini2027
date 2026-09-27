import type { ResponseRow } from './payload';
import { formatShortDate, nightsBetween } from './trip-dates';

export function buildNotificationEmailText(row: ResponseRow): string {
  const lines = [`${row.name} — ${row.attending ? 'IN' : 'OUT'}`];
  if (row.email) lines.push(`Email: ${row.email}`);
  if (row.attending) {
    lines.push(`Crew: ${row.party_size}`);
    if (row.hotel_staying && row.arrival_date && row.departure_date) {
      const nights = nightsBetween(row.arrival_date, row.departure_date);
      lines.push(
        `Adamastos: yes, arrive ${formatShortDate(row.arrival_date)} → depart ${formatShortDate(row.departure_date)} (${nights} night${nights === 1 ? '' : 's'})`
      );
    } else {
      lines.push('Adamastos: no');
    }
  }
  if (row.note) lines.push(`Note: ${row.note}`);
  return lines.join('\n');
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
}

interface ResendSendResult {
  error?: { message?: string; name?: string } | null;
}

interface ResendLikeClient {
  emails: { send: (payload: ResendEmailPayload) => Promise<ResendSendResult> };
}

function parseNotifyRecipients(): string[] {
  const raw = process.env.NOTIFY_EMAIL ?? 'steve.marchese@gmail.com';
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

export async function sendNotificationEmail(client: ResendLikeClient, row: ResponseRow): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const result = await client.emails.send({
    from: `Santorini 2027 <${fromEmail}>`,
    to: parseNotifyRecipients(),
    subject: `CONFIRMED: ${row.name} (${row.attending ? 'in' : 'out'})`,
    text: buildNotificationEmailText(row),
  });

  // The Resend SDK resolves with an { error } object on API failures rather than
  // throwing — so an unverified sender or disallowed recipient would otherwise
  // fail silently. Surface it so the caller's catch logs a real error.
  if (result?.error) {
    throw new Error(`Resend send failed: ${result.error.message ?? result.error.name ?? 'unknown error'}`);
  }
}
