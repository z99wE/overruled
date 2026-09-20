# Changelog

All notable changes to overrruled are documented here. This project follows
Keep a Changelog conventions; version numbers follow SemVer.

## [Unreleased]

### Added
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
- **BYOK keys are now identity-scoped** (`storage.ts`): each signed-in account
  reads/writes its own device-local key slot (hashed by email), and a signed-in
  user can never see, load, or bill another account's key on the same device.
  Signed-out sessions use the `anonymous` device scope; one legacy pre-scoping
  key is migrated into that scope exactly once. Auth (`/api/auth/me`, signup,
  login, logout) switches the active scope.
- **Keyless copy softened:** the case list no longer scolds keyless players with
  a red "Arm Your Key" nudge; the chip is a muted "No Key" and the banner now
  explains that every case still plays via the rules-only local Bench.
- README/CONTRIBUTING test counts updated (187 tests across 21 suites).

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