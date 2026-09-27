import { describe, it, expect, vi } from 'vitest';
import { buildNotificationEmailText, sendNotificationEmail } from './email';
import { buildResponseRow } from './payload';
import { EMPTY_DRAFT } from './types';

describe('buildNotificationEmailText', () => {
  it('lists email, crew, and hotel dates with night count for an attending guest', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      email: 'steve@example.com',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      arrivalDate: '2027-06-30',
      departureDate: '2027-07-06',
      note: 'Bringing the dog',
    });
    const text = buildNotificationEmailText(row);
    expect(text).toBe(
      ['Steve — IN', 'Email: steve@example.com', 'Crew: 2', 'Adamastos: yes, arrive Jun 30 → depart Jul 6 (6 nights)', 'Note: Bringing the dog'].join('\n')
    );
  });

  it('says Adamastos: no when not staying', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT, name: 'Steve', email: 'steve@example.com', attending: true, partySize: 1, hotelStaying: false,
    });
    expect(buildNotificationEmailText(row)).toContain('Adamastos: no');
  });

  it('keeps the not-attending summary short', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });
    const text = buildNotificationEmailText(row);
    expect(text).toBe('Steve — OUT');
  });
});

describe('sendNotificationEmail', () => {
  it('sends via the injected client with from/to/subject/text', async () => {
    const send = vi.fn().mockResolvedValue({ id: 'abc' });
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });

    await sendNotificationEmail({ emails: { send } }, row);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'CONFIRMED: Steve (out)',
        text: expect.stringContaining('Steve'),
      })
    );
  });

  it('throws when the Resend client resolves with an error', async () => {
    const send = vi.fn().mockResolvedValue({
      error: { name: 'validation_error', message: 'You can only send testing emails to your own email address' },
    });
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });

    await expect(sendNotificationEmail({ emails: { send } }, row)).rejects.toThrow(
      /Resend send failed/
    );
  });

  it('splits a comma-separated NOTIFY_EMAIL into multiple recipients', async () => {
    const originalNotifyEmail = process.env.NOTIFY_EMAIL;
    process.env.NOTIFY_EMAIL = 'steve.marchese@gmail.com, andi@example.com ,  ';

    const send = vi.fn().mockResolvedValue({ id: 'abc' });
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });

    try {
      await sendNotificationEmail({ emails: { send } }, row);

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['steve.marchese@gmail.com', 'andi@example.com'],
        })
      );
    } finally {
      process.env.NOTIFY_EMAIL = originalNotifyEmail;
    }
  });
});
