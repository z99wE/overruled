// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildSessionCookie,
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
  parseCookies,
  SESSION_COOKIE,
  sha256Hex,
  verifyPassword,
} from './auth';

describe('password hashing', () => {
  it('hashes with unique salts and verifies the right password', async () => {
    const a = await hashPassword('hunter2-hunter2');
    const b = await hashPassword('hunter2-hunter2');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyPassword('hunter2-hunter2', a.salt, a.iterations, a.hash)).toBe(true);
  });

  it('rejects the wrong password and mutated salts', async () => {
    const { hash, salt, iterations } = await hashPassword('correct horse');
    expect(await verifyPassword('battery staple', salt, iterations, hash)).toBe(false);
    expect(await verifyPassword('correct horse', '00'.repeat(16), iterations, hash)).toBe(false);
  });
});

describe('session tokens', () => {
  it('creates opaque tokens whose stored hash is the SHA-256 of the token', async () => {
    const { token, tokenHash } = await createSessionToken();
    expect(token).toHaveLength(64);
    expect(tokenHash).toBe(await sha256Hex(token));
    expect(token).not.toBe(tokenHash);
  });

  it('tokens are unique', async () => {
    const t1 = await createSessionToken();
    const t2 = await createSessionToken();
    expect(t1.token).not.toBe(t2.token);
  });
});

describe('cookies', () => {
  it('parses a cookie header', () => {
    const cookies = parseCookies('hello=world; __Host-overrool_session=abc123; empty=');
    expect(cookies.get('hello')).toBe('world');
    expect(cookies.get(SESSION_COOKIE)).toBe('abc123');
    expect(cookies.get('empty')).toBeUndefined();
  });

  it('returns an empty map for no header', () => {
    expect(parseCookies(null).size).toBe(0);
  });

  it('builds a hardened session cookie', () => {
    const c = buildSessionCookie('s3cret');
    expect(c).toContain(`${SESSION_COOKIE}=s3cret`);
    expect(c).toContain('HttpOnly');
    expect(c).toContain('Secure');
    expect(c).toContain('SameSite=Strict');
    expect(c).toContain('Path=/');
    expect(c).toMatch(/Max-Age=\d+/);
  });

  it('clears the session cookie', () => {
    expect(clearSessionCookie()).toContain('Max-Age=0');
  });
});

describe('validation', () => {
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.co')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('enforces a sane password policy', () => {
    expect(isValidPassword('short').ok).toBe(false);
    expect(isValidPassword('x'.repeat(129)).ok).toBe(false);
    const ok = isValidPassword('eightchars');
    expect(ok.ok).toBe(true);
  });
});