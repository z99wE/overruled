-- One-time migration for existing databases (2026-09-22): opt-in column for
-- the in-app AI Briefing newsletter. Fresh installs already get this column
-- from d1/schema.sql; this ALTER only needs to run against pre-existing DBs.
-- Safe to run once:  wrangler d1 execute overrool --remote --file=d1/migrations/20260922_newsletter_optin.sql
ALTER TABLE users ADD COLUMN newsletter_optin INTEGER NOT NULL DEFAULT 0;