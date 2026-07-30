import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin-session', () => ({ isAdminAuthed: vi.fn() }));
const upsertMock = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdminClient: () => ({ from: () => ({ upsert: upsertMock }) }),
}));

import { POST } from './route';
import { isAdminAuthed } from '@/lib/admin-session';

function req(body: unknown): Request {
  return new Request('http://localhost/api/admin/content', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/content', () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await POST(req({ letter: 'x', confirmationAttending: 'a', confirmationNotAttending: 'b' }));
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('upserts the three rows and returns ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await POST(req({ letter: 'Hello', confirmationAttending: 'Yay', confirmationNotAttending: 'Aww' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'letter', value: 'Hello' }),
        expect.objectContaining({ key: 'confirmation_attending', value: 'Yay' }),
        expect.objectContaining({ key: 'confirmation_not_attending', value: 'Aww' }),
      ])
    );
  });
});
