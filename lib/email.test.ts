import { describe, it, expect, vi } from 'vitest';
import { buildNotificationEmailText, sendNotificationEmail } from './email';
import { buildResponseRow } from './payload';
import { EMPTY_DRAFT } from './types';

describe('buildNotificationEmailText', () => {
  it('includes attending-path details', () => {
    const row = buildResponseRow({
      ...EMPTY_DRAFT,
      name: 'Steve',
      attending: true,
      partySize: 2,
      hotelStaying: true,
      hotelNights: 3,
      window1Selected: true,
      windowPriority: 'window_1',
      travelTiming: 'both',
      dinnerInterested: true,
      cruiseInterested: true,
    });
    const text = buildNotificationEmailText(row);
    expect(text).toContain('Steve — ATTENDING');
    expect(text).toContain('Party size: 2');
    expect(text).toContain('Staying at Adamastos: yes, 3 night(s)');
    expect(text).toContain('6/30-7/6');
  });

  it('keeps the not-attending summary short', () => {
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });
    const text = buildNotificationEmailText(row);
    expect(text).toContain('Steve — not attending');
    expect(text).not.toContain('Party size');
  });
});

describe('sendNotificationEmail', () => {
  it('sends via the injected client with from/to/subject/text', async () => {
    const send = vi.fn().mockResolvedValue({ id: 'abc' });
    const row = buildResponseRow({ ...EMPTY_DRAFT, name: 'Steve', attending: false });

    await sendNotificationEmail({ emails: { send } }, row);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Steve'),
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
