import { describe, it, expect, beforeEach } from 'vitest';

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'secret123';
  });

  it('rejects an incorrect password', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('accepts the correct password and sets a cookie', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('admin_session=');
  });
});
