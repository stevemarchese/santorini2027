import { createHash } from 'crypto';

export function hashAdminPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}
