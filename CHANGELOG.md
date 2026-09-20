# Changelog

All notable changes to overrruled are documented here. This project follows
Keep a Changelog conventions; version numbers follow SemVer.

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