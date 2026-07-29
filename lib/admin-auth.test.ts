import { describe, it, expect } from 'vitest';
import { hashAdminPassword } from './admin-auth';

describe('hashAdminPassword', () => {
  it('is deterministic and does not return the plaintext', () => {
    const hash = hashAdminPassword('secret123');
    expect(hash).toBe(hashAdminPassword('secret123'));
    expect(hash).not.toBe('secret123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs for different passwords', () => {
    expect(hashAdminPassword('a')).not.toBe(hashAdminPassword('b'));
  });
});
