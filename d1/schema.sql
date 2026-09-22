-- Overrool accounts + game-progress sync (Cloudflare D1).
-- Apply with:  wrangler d1 execute overrool --remote --file=d1/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pw_hash     TEXT NOT NULL,
  pw_salt     TEXT NOT NULL,
  iterations  INTEGER NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS runs (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Failed-login backoff (see functions/lib/db.ts loginLock).
-- Rows are pruned opportunistically on each failed attempt.
CREATE TABLE IF NOT EXISTS login_attempts (
  email        TEXT NOT NULL COLLATE NOCASE,
  attempted_at TEXT NOT NULL,
  PRIMARY KEY (email, attempted_at)
);

-- One-time recovery codes (password recovery without email). Only SHA-256
-- digests are stored; the plaintext is shown once at creation.
CREATE TABLE IF NOT EXISTS recovery_codes (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at   TEXT,
  PRIMARY KEY (user_id, code_hash)
);
CREATE INDEX IF NOT EXISTS idx_recovery_user ON recovery_codes(user_id);

-- Email password-reset tokens (single-use, 30-minute TTL, hash-only storage).
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id);

-- Hosted-inference credit meter (authoritative, server-side). Rows keyed by
-- account + UTC day: cumulative credits/calls plus a per-minute burst counter.
-- Enforced in /api/llm so the admin-only hosted surface can never be jacked
-- into exhausting the shared inference queue.
CREATE TABLE IF NOT EXISTS meter (
  account_id  TEXT NOT NULL,
  day         TEXT NOT NULL,
  credits     INTEGER NOT NULL DEFAULT 0,
  calls       INTEGER NOT NULL DEFAULT 0,
  burst_at    INTEGER NOT NULL DEFAULT 0,
  burst_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, day)
);
CREATE INDEX IF NOT EXISTS idx_meter_day ON meter(day);

-- Monetization knob: raise (or lower) a single account's daily credit cap.
-- Default when a row is absent is METER_DAILY_CAP (100) in functions/lib/db.ts.
--   INSERT INTO credit_overrides (account_id, daily_cap, updated_at)
--   VALUES ('<user-id>', 500, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
CREATE TABLE IF NOT EXISTS credit_overrides (
  account_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_cap  INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);