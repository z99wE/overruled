// Cloudflare Workers' crypto.subtle rejects PBKDF2 iteration counts above
// 100_000 (NotSupportedError); this is the platform ceiling. OPWASH-adjacent
// guidance wants far more, but the Workers cap is the hard limit here.
const PBKDF2_ITERATIONS = 100_000;
const KEY_LEN = 32;

const enc = new TextEncoder();

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** PBKDF2-SHA256 password hash. Returns {hash, salt, iterations} hex strings. */
export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
  iterations: number;
}> {
  if (password.length > 128) throw new Error('Password exceeds maximum length.');
  const salt = randomHex(16);
  const iterations = PBKDF2_ITERATIONS;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(salt), iterations, hash: 'SHA-256' },
    key,
    KEY_LEN * 8,
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt, iterations };
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  iterations: number,
  expectedHashHex: string,
): Promise<boolean> {
  // Fast-fail on out-of-policy inputs so login never runs PBKDF2 on attacker
  // sized payloads (stored hashes are all 8..128 by construction).
  if (password.length < 8 || password.length > 128) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations, hash: 'SHA-256' },
    key,
    KEY_LEN * 8,
  );
  return constantTimeEqual(bytesToHex(new Uint8Array(bits)), expectedHashHex);
}

/** Session token: opaque 32-byte value handed to the browser; only its SHA-256 digest is stored. */
export async function createSessionToken(): Promise<{ token: string; tokenHash: string }> {
  const token = randomHex(32);
  return { token, tokenHash: await sha256Hex(token) };
}

export const SESSION_COOKIE = '__Host-overrool_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const RECOVERY_CODE_COUNT = 8;

export function parseCookies(header: string | null): Map<string, string> {
  const out = new Map<string, string>();
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name && value) out.set(name, decodeURIComponent(value));
  }
  return out;
}

export function buildSessionCookie(token: string, maxAgeSeconds: number = SESSION_TTL_SECONDS): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Unambiguous alphabet for recovery codes (no 0/O/1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generates one-time recovery codes as "XXXX-XXXX" strings. */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes)
      .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join('');
    out.push(`${chars.slice(0, 4)}-${chars.slice(4)}`);
  }
  return out;
}

/** Normalizes a typed recovery code (strips separators/whitespace, uppercases). */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidPassword(password: string): { ok: true } | { ok: false; reason: string } {
  if (password.length < 8) {
    return { ok: false, reason: 'Password must be at least 8 characters.' };
  }
  if (password.length > 128) {
    return { ok: false, reason: 'Password must be at most 128 characters.' };
  }
  return { ok: true };
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}