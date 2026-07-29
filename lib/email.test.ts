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
});
