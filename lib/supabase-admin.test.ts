import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const createClientMock = vi.fn(() => ({ from: fromMock }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('getSupabaseAdminClient', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('throws when env vars are missing', async () => {
    const { getSupabaseAdminClient } = await import('./supabase-admin');
    expect(() => getSupabaseAdminClient()).toThrow(/SUPABASE_URL/);
  });
});

describe('getAllResponses', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('selects all responses ordered by newest first', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const select = vi.fn(() => ({ order }));
    fromMock.mockReturnValue({ select });

    const { getAllResponses } = await import('./supabase-admin');
    const result = await getAllResponses();

    expect(fromMock).toHaveBeenCalledWith('responses');
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([{ id: '1' }]);
  });
});
