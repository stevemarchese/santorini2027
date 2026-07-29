import { NextResponse } from 'next/server';
import { hashAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password: string };
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', hashAdminPassword(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}
