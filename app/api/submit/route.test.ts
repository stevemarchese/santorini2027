import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_DRAFT } from '@/lib/types';

const insertMock = vi.fn();
const sendMock = vi.fn().mockResolvedValue({ id: 'abc' });

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdminClient: () => ({ from: () => ({ insert: insertMock }) }),
}));
vi.mock('@/lib/resend-client', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

describe('POST /api/submit', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    sendMock.mockClear();
  });

  it('rejects an invalid draft without inserting', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(EMPTY_DRAFT),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('inserts a valid draft and sends the notification email', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify({ ...EMPTY_DRAFT, name: 'Steve', attending: false }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Steve', attending: false }));
    expect(sendMock).toHaveBeenCalled();
  });
});
