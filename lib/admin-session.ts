import { cookies } from 'next/headers';
import { hashAdminPassword } from './admin-auth';

export async function isAdminAuthed(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === hashAdminPassword(password);
}
