# Changelog

All notable changes to overrruled are documented here. This project follows
Keep a Changelog conventions; version numbers follow SemVer.

## [Unreleased]

### Added — in-app AI Briefing newsletter
- Free opt-in newsletter at signup ("Send me the free AI Briefing"), persisted
  as a single `newsletter_optin` boolean on the account (D1). Delivered **in-app**
  on the matter gallery — static bundled feed, no email provider, Cloudflare-only.
  Toggle anytime from the account modal (`POST /api/preferences`).
  Files: `src/core/news.ts`, `src/components/NewsFeed.tsx`, `functions/api/preferences.ts`,
  `d1/migrations/20260922_newsletter_optin.sql`, `AuthModal.tsx`.

### Added — fair access & hardened AI surface
- **Daily credit meter.** 100 credits per identity per UTC day (identity-scoped via
  the BYOK scope) with a resettable wallet: a trial run costs **10 credits**, a Legal
  Desk model operation **2**, and both Local Judge / Local Rules Analyst stay free.
  Client meter: `src/core/meter.ts` (+ `meter.test.ts`).
- **Server-side hosted-inference limits.** The admin-only `/api/llm` path now enforces
  the same daily cap authoritatively in D1 plus a per-minute burst limit (8 calls/60s)
  and a two-model allowlist, surfacing `429 rate_daily` / `429 rate_burst`.
  `d1/schema.sql` adds the `meter` and `credit_overrides` tables; `credit_overrides`
  is the reserved monetization knob for raising an account's cap later.
  `functions/lib/db.ts` (`meterCheckAndCharge`), `functions/lib/db.test.ts`.
- **Prompt-injection defence.** `src/core/guardrails.ts` adds a SECURITY CONTRACT to
  every system prompt and sandboxes all attacker/model-derived content inside
  `<untrusted-data>…</untrusted-data>` tags before it reaches any model — across trial
  resolution, opposing-counsel persona, Legal Desk ops, and docket enrichment. Covers
  prompt hijacking, LLM-jacking, and LLM-spoofing. `guardrails.test.ts`.
- Test suite grows to **235 tests across 25 files**.

### Changed
- **True 3D card flips.** The fake 92° `tblFlipIn` turn is replaced with real
  `rotateY` flips (`card3d` in `index.css`): hand cards deal in face-down→face-up
  with a stagger, spent cards flip face→back, and the Bench reveal flips at the
  verdict (`flipMode: 'both' | 'toggled'`, `flipDelay` on `GameCard`).
- **Landing realignment.** The landing page now pitches the product without
  hackathon framing — hero, "Your documents" (Legal Desk pillars), "The bench",
  "Where the AI actually runs" (GenAI architecture), "Why it matters", "What it's
  worth", and an FAQ, wired to open the desk via `onOpenDesk`.

### Added
- **The Legal Desk — understand *your* document.** A document-understanding
  workspace in the gallery header. Paste any contract, policy, lease, judgement
  excerpt or terms page (or load a bundled sample) and run one of five
  operations — **Simplify** (plain-English bottom line, what-it-means, who it
  affects, legalese glossary), **Risks & obligations** (evidence-quoted findings
  with kind + severity 1–5), **Compare** (material differences between two
  versions, who each favours), **Ask the text** (grounded answer + quote +
  confidence + next steps), and **For your lawyer** (decision-changing questions,
  why each matters, what papers to bring). Every op is a single structured GenAI
  pass on the same BYOK pipeline as the trial; without a key the clearly-labeled
  deterministic Local Rules Analyst stands in. Results export as markdown
  (copy / download / share). Test suite grows to **222 tests across 23 files**.
  Files: `docEngine.ts`, `docEngine.test.ts`, `deskSamples.ts`, `LegalDesk.tsx`.

### Changed — the case table (full card-game rebuild)
- **Your Hand.** Every matter now *deals* its five verified precedents out as a
  fanned hand of playing cards along the bottom of the table (deterministic
  seeded order in `cardMeta.dealHand`, stable across turns/remounts/restarts).
  Cards deal in one-by-one, dead cards flip to their back ("SPENT"), the
  selected card lifts for the table, and the Clerk reads the pot and streak.
- **Centre-table showdown.** A new felt pit (`CardTable`) replaces the tucked-away
  after-the-fact canvas: the opposing-counsel agent's counter-card drops in
  face-down, your card deals up from the defence rail, the Bench reveals at the
  verdict — the winning card glows gold/red and the loser is burned off the
  table — all **live**, during deliberation, not after.
- **Chamber reads as a table, not a document.** Opposing counsel's persona sits
  on the court rail, the pit occupies centre stage, the transcript flows
  beneath it, and the case file moved to a slide-in drawer with a full
  authority board. The old in-bar card grid is gone — you play from the hand.
- **New building blocks** with full coverage: `cardMeta.ts` (seeded hand deal,
  authority weight, domain suits, turn winner), `GameCard.tsx` (shared playing
  card face), `CardTable.tsx` (phase-driven showdown), `HandFan.tsx`.
- Copy insists on the problem→hand loop ("your problem / your hand") on the
  matter gallery; Bench/opponent/Clerk labels make the agent roster legible.
- Test suite now **210 tests across 22 files**.

### Added
- **High-stakes card-table restyle:** felt screens get a fine grain overlay
  (`felt-noise`), the trial transcript sits in a green cushioned table rail
  (`rail-panel`), hero chips float under a new tagline, and case tiles are now
  playing cards — gradient faces, gold corner pips (jurisdiction + court code),
  a faint watermark suit, and a gold edge on hover.
- **Gemini free-tier signal in the Key Vault:** the Gemini provider tile shows a
  "Free tier" badge and the vault copy states that accounts are unlimited, that
  Gemini calls Google directly from the browser (Overrool never in the loop),
  and that the free path is Google AI Studio + `generativelanguage.googleapis.com`.
- **Password recovery** (fully Cloudflare-native): single-use 30-minute reset
  tokens (`password_resets` table; only SHA-256 of the token is stored), wired
  through `POST /api/auth/forgot` + `POST /api/auth/reset`, delivered by email
  via a Resend HTTP integration when `RESEND_API_KEY`/`RESEND_FROM` are bound.
  The forgot endpoint answers identically for known/unknown emails (no account
  enumeration). Plus **one-time recovery codes** (`recovery_codes` table; only
  digests stored): 8 codes per generation (`XXXX-XXXX`, unambiguous alphabet)
  returned once at signup, regenerable from the account panel, and redeemable
  via `POST /api/auth/recovery/verify` to set a new password. Both paths rotate
  the account's session and revoke its other sessions.
- Auth UI: "Forgot password?" view in `AuthModal`, one-time recovery-code
  screen at signup and on regenerate, and a `ResetPasswordModal` that opens when
  the app boots with `?reset_token=` in the URL.
- Server-side **hosted inference** for the workspace administrator: `users.role`
  column, `POST /api/llm` (admin-only, Workers AI `AI` binding), and the
  **Hosted (Cloudflare)** option in the Key Vault — shown only to the `admin`
  account, with no API-key field and quota/fallback messaging. Everyone else
  keeps zero-knowledge BYOK, and the admin email is never exposed (only `role`).
- Privacy notice (`PRIVACY.md`) and a link section in the README.
- Findability materials: `public/robots.txt`, `public/llms.txt`,
  `public/sitemap.xml`, and OpenGraph / Twitter / canonical meta tags in
  `index.html`.

### Changed
- `LLMProvider` gains `hosted`; `GET /api/auth/me` returns `user.role`.
- Live **Cloudflare deployment**: D1 `overrool` provisioned (APAC),
  `wrangler.toml` wired to its `database_id`, Pages project `overrool` created,
  and PBKDF2 lowered to **100,000 iterations** to satisfy the Workers
  `crypto.subtle` cap (this was failing live with `NotSupportedError` code
  1101; Node's test environment permitted the old 210,000).
- Successful sign-in now clears the failed-login counter and the lockout
  window covers the correct password too (no lock-bypass).
- **BYOK keys are now identity-scoped** (`storage.ts`): each signed-in account
  reads/writes its own device-local key slot (hashed by email), and a signed-in
  user can never see, load, or bill another account's key on the same device.
  Signed-out sessions use the `anonymous` device scope; one legacy pre-scoping
  key is migrated into that scope exactly once. Auth (`/api/auth/me`, signup,
  login, logout) switches the active scope.
- **Keyless copy softened:** the case list no longer scolds keyless players with
  a red "Arm Your Key" nudge; the chip is a muted "No Key" and the banner now
  explains that every case still plays via the rules-only local Bench.
- README/CONTRIBUTING test counts updated (194 tests across 21 suites).
- README now leads with the access model: unlimited free accounts on Cloudflare's
  free tiers, and the four gaps reframed (unlimited accounts → zero-cost practice →
  factual grounding → accountable dockets).

### Fixed
- **CaseSelect dead tiles:** the matter-card buttons had `key`, `type`, and
  `onClick` swallowed inside the `aria-label` string literal, so clicking a
  matter did nothing. Handlers are back on real props.
- `providerCall` no longer relies on `AbortSignal.timeout` (was throwing on
  older Safari/WebKit shells) — a manual abort-timer (`timeoutSignal`) guards
  every request.
- `CardTableCanvas` adds a canvas `roundRect` polyfill (`rr()`) so seating rails
  render on Safari 15-/older WebViews.
- Export modal reports a blocked pop-up with an actionable status ("allow pop-ups
  to use Print / PDF") instead of silently failing, and copy-to-clipboard now
  shows a transient confirmation.
- The action bar no longer offers "Retry trial" during a resolving turn — a
  disabled "The bench is deliberating…" spinner shows instead.

## [2.0.0] - 2026-09-20

### Added
- Feature-flag framework: `flags.json` manifest, `src/core/flags.ts` accessor,
  and per-flag env overrides (`.env`). Flags gate freeform motions, boss
  bounties, and the local sparring bench.
- Comprehensive ESLint 9 flat config (TypeScript + React Hooks) with a `lint`
  npm script; enforces unused-variable and exhaustive-deps hygiene.
- Continuous integration (`GitHub Actions`) running install, typecheck, lint,
  tests, and a production `npm audit`.
- Dependabot configuration for npm and GitHub Actions ecosystems.
- Reproducible installs: dependency version pinning in `package.json` and an
  `.npmrc` that defaults to exact saves.
- Supporting docs: `SECURITY.md`, `CONTRIBUTING.md`, `DISCLAIMER.md`, and this
  `CHANGELOG.md`.

### Changed
- Refactored `CourtroomChamber.tsx` into a `chamber` component suite
  (`Header`, `Sidebar`, `ActionBar`, `ResolutionBlock`, and message
  primitives) to keep every source file under 500 lines.
- All interactive buttons now expose programmatic accessible names via
  `aria-label` attributes.

### Fixed
- Freeform-motion composer and precedent-card picker in `DuelMode` now announce
  themselves to assistive technology.
- Shop close/buy actions in `ShopModal` expose descriptive labels to screen
  readers.

## [1.0.0] - 2026-08-01

### Added
- Initial release of the adversarial legal strategy engine: single-pass
  multi-role LLM bench, real judgments from seven legal systems, and zero-cost
  bring-your-own-key provider wiring.