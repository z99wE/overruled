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