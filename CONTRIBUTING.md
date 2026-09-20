# Contributing to overrruled

Thanks for helping make overrruled better. This document sets expectations for
how contributions land.

## Ground rules

- Work in a feature branch and open a pull request against `main`. Direct push
  to `main` is restricted.
- Keep changes focused: one logical change per PR.
- Preserve the toy-first profile: no paid API keys, no server, JSON corpus in
  the repo, fully local runtime.

## Development loop

```sh
npm install
npm run dev        # start the Vite app
npm run typecheck  # strict tsc over src/ (app) + functions/ (Cloudflare Pages Functions)
npm run lint       # ESLint 9 flat config over src, functions, scripts
npm test           # vitest — 181 assertions across 21 suites (app + functions handlers)
```

Run all three checks green before opening a PR.

## Feature flags

New features that are not yet defaults ship behind a flag:

1. Add the flag name to `flags.json` under `flags`.
2. Read it at the call site via `isFlagEnabled('yourFlagName')` from
   `src/core/flags.ts`.
3. Document the flag in `ROLLOUT.md`.

## Tests

- Put tests next to the code they cover (`*.test.ts`).
- Any change to scoring, deck, or game-state logic needs a matching unit test.
- Run `npm run test:coverage` if you want a coverage report.

## Commit style

Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`,
`docs:`, `build:`.

## Review checklist

- [ ] `npm run typecheck`, `npm run lint`, and `npm test` pass
- [ ] No secrets or keys committed (see `.gitignore` for `.env*`)
- [ ] New runtime behavior is gated behind a feature flag or has tests