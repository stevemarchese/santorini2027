import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getMock })),
}));

import { isAdminAuthed } from './admin-session';
import { hashAdminPassword } from './admin-auth';

describe('isAdminAuthed', () => {
  const original = process.env.ADMIN_PASSWORD;
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'secret';
    getMock.mockReset();
  });
  afterEach(() => {
    process.env.ADMIN_PASSWORD = original;
  });

  it('returns false when ADMIN_PASSWORD is unset', async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await isAdminAuthed()).toBe(false);
  });

  it('returns false when the cookie does not match', async () => {
    getMock.mockReturnValue({ value: 'nope' });
    expect(await isAdminAuthed()).toBe(false);
  });

  it('returns true when the cookie equals the hashed password', async () => {
    getMock.mockReturnValue({ value: hashAdminPassword('secret') });
    expect(await isAdminAuthed()).toBe(true);
  });
});
