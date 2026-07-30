import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin-session', () => ({ isAdminAuthed: vi.fn() }));
const deleteResponseMock = vi.fn();
const updateResponseNameMock = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
  deleteResponse: (id: string) => deleteResponseMock(id),
  updateResponseName: (id: string, name: string) => updateResponseNameMock(id, name),
}));

import { DELETE, PATCH } from './route';
import { isAdminAuthed } from '@/lib/admin-session';

function req(id: string): Request {
  return new Request(`http://localhost/api/admin/responses/${id}`, { method: 'DELETE' });
}

function patchReq(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/admin/responses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/admin/responses/[id]', () => {
  beforeEach(() => {
    deleteResponseMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(401);
    expect(deleteResponseMock).not.toHaveBeenCalled();
  });

  it('deletes and returns ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteResponseMock).toHaveBeenCalledWith('abc');
  });

  it('returns 500 with the error message when the delete fails', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    deleteResponseMock.mockResolvedValue({ error: 'boom' });
    const res = await DELETE(req('abc'), ctx('abc'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'boom' });
  });
});

describe('PATCH /api/admin/responses/[id]', () => {
  beforeEach(() => {
    updateResponseNameMock.mockReset().mockResolvedValue({ error: null });
  });

  it('returns 401 when not authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(false);
    const res = await PATCH(patchReq('abc', { name: 'New Name' }), ctx('abc'));
    expect(res.status).toBe(401);
    expect(updateResponseNameMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the name is empty or whitespace-only', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await PATCH(patchReq('abc', { name: '   ' }), ctx('abc'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Name is required' });
    expect(updateResponseNameMock).not.toHaveBeenCalled();
  });

  it('trims and updates the name, returning ok when authed', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    const res = await PATCH(patchReq('abc', { name: '  New Name  ' }), ctx('abc'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateResponseNameMock).toHaveBeenCalledWith('abc', 'New Name');
  });

  it('returns 500 with the error message when the update fails', async () => {
    vi.mocked(isAdminAuthed).mockResolvedValue(true);
    updateResponseNameMock.mockResolvedValue({ error: 'boom' });
    const res = await PATCH(patchReq('abc', { name: 'New Name' }), ctx('abc'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'boom' });
  });
});
