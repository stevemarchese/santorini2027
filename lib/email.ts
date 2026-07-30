import type { ResponseRow } from './payload';

export function buildNotificationEmailText(row: ResponseRow): string {
  const lines = [`${row.name} — ${row.attending ? 'ATTENDING' : 'not attending'}`];
  if (row.attending) {
    lines.push(`Party size: ${row.party_size}`);
    lines.push(
      row.hotel_staying
        ? `Staying at Adamastos: yes, ${row.hotel_nights} night(s)`
        : 'Staying at Adamastos: no'
    );
    const windows: string[] = [];
    if (row.window_1_selected) windows.push('6/30-7/6');
    if (row.window_2_selected) windows.push('7/7-7/13');
    if (row.window_3_selected) windows.push('7/14-7/18');
    lines.push(`Date windows: ${windows.join(', ') || 'none selected'}`);
    lines.push(`Priority window: ${row.window_priority ?? 'none'}`);
    lines.push(`Travel timing: ${row.travel_timing ?? 'none'}`);
    if (row.travel_note) lines.push(`Travel note: ${row.travel_note}`);
    lines.push(`Group dinner: ${row.dinner_interested ? 'yes' : 'no'}`);
    lines.push(`Sunset cruise: ${row.cruise_interested ? 'yes' : 'no'}`);
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

interface ResendLikeClient {
  emails: { send: (payload: ResendEmailPayload) => Promise<unknown> };
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
  await client.emails.send({
    from: `Santorini 2027 <${fromEmail}>`,
    to: parseNotifyRecipients(),
    subject: `New RSVP: ${row.name} (${row.attending ? 'attending' : 'not attending'})`,
    text: buildNotificationEmailText(row),
  });
}
