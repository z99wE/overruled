import { activeByokScope } from './storage';

/**
 * DAILY CREDIT METER — app-level spend cap shared by every model surface.
 *
 * Model (per the product decision):
 *   - 1 trial run        = 10 credits
 *   - 1 Legal Desk op    = 2 credits
 *   - default allowance  = 100 credits / day / user, reset at midnight UTC
 *
 * The meter is identity-scoped exactly like the BYOK vault (same scope), so it
 * never bleeds across accounts sharing a device. Behaviour:
 *   - BYOK calls the user's own provider account directly, so this meter is an
 *     honest advisory cap plus a wallet guard; the provider's own quota is the
 *     hard ceiling. It is app-enforced (not server-enforced) for BYOK because
 *     those requests never transit a server we own.
 *   - Hosted inference (/api/llm) is enforced authoritatively server-side in
 *     D1 (see functions/lib/db.ts) — that is the surface that can hit a shared
 *     or admin-owned wallet and must be protected against jacking.
 *
 * The 100/day cap is the default. Monetization later = raising a specific
 * account's cap (credit_overrides in D1) or selling hosted credit packages
 * without touching any of this plumbing.
 */
export const DEFAULT_DAILY_CREDITS = 100;
export const CREDIT_COSTS = {
  trial: 10,
  deskOp: 2,
} as const;

export interface LedgerEntry {
  day: string;
  used: number;
  /** One-time tags (e.g. a trial id) that must only be charged once per day. */
  tags: string[];
}

export interface SpendResult {
  ok: boolean;
  code?: 'daily_cap';
  /** Credits spent by this call (0 when a one-time tag was already charged). */
  cost: number;
  used: number;
  cap: number;
  remaining: number;
}

/** In-memory fallback so the meter works in non-DOM environments and tests. */
const memory = new Map<string, LedgerEntry>();

function readRaw(key: string): LedgerEntry | null {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as LedgerEntry) : null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, entry: LedgerEntry): void {
  memory.set(key, entry);
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* memory fallback already set */
  }
}

function meterKey(scope: string): string {
  return `overrool.meter.${scope}`;
}

export function utcDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Current ledger for a scope, resetting automatically when the day rolls. */
export function ledgerFor(scope: string): LedgerEntry {
  const raw = readRaw(meterKey(scope));
  if (!raw || raw.day !== utcDay()) return { day: utcDay(), used: 0, tags: [] };
  return raw;
}

export function creditsToday(scope?: string): { used: number; cap: number; remaining: number } {
  const s = scope ?? activeByokScope();
  const led = ledgerFor(s);
  return {
    used: led.used,
    cap: DEFAULT_DAILY_CREDITS,
    remaining: Math.max(0, DEFAULT_DAILY_CREDITS - led.used),
  };
}

/**
 * Spend `cost` credits for the active scope. Pass a `tag` (stable identity like
 * a trial id) to charge it at most once per day even if the operation retries
 * or remounts. Returns { ok:false, code:'daily_cap' } when the cap is reached.
 */
export function spendCredits(cost: number, tag?: string, scope?: string): SpendResult {
  const s = scope ?? activeByokScope();
  const led = ledgerFor(s);
  if (tag && led.tags.includes(tag)) {
    return { ok: true, cost: 0, used: led.used, cap: DEFAULT_DAILY_CREDITS, remaining: Math.max(0, DEFAULT_DAILY_CREDITS - led.used) };
  }
  if (led.used + cost > DEFAULT_DAILY_CREDITS) {
    return { ok: false, code: 'daily_cap', cost, used: led.used, cap: DEFAULT_DAILY_CREDITS, remaining: 0 };
  }
  const next: LedgerEntry = {
    ...led,
    used: led.used + cost,
    tags: tag ? [...led.tags, tag] : led.tags,
  };
  writeRaw(meterKey(s), next);
  return { ok: true, cost, used: next.used, cap: DEFAULT_DAILY_CREDITS, remaining: Math.max(0, DEFAULT_DAILY_CREDITS - next.used) };
}

/** Test seam: drop a scope's ledger from both memory and localStorage. */
export function resetMeterForTests(scope: string): void {
  memory.delete(meterKey(scope));
  try {
    window.localStorage.removeItem(meterKey(scope));
  } catch {
    /* noop */
  }
}