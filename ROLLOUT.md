# Rollout Strategy

overrruled ships changes behind feature flags defined in `flags.json`. All flags
default to enabled in the source; deployments gate them through `.env`.

## Flag reference

| Flag               | Owner        | Default | Purpose                                                        |
| ------------------ | ------------ | ------- | -------------------------------------------------------------- |
| `freeformMotion`   | Gameplay     | on      | Freeform motion composer (off → precedent-cards only)          |
| `bossBounties`     | Economy      | on      | Chip bounty when a static matter clears its boss target        |

## Promotion path

1. **Canary** — enable flag in a preview build and watch error telemetry for
   one release cycle.
2. **Lift** — flip the flag in `.env` on the release branch.
3. **Steady-state** — after N releases with the flag on, the behavior becomes
   the default and the flag is removed from `flags.json`.

## Kill switch

Every flag is read at call site through `isFlagEnabled(flag)` in
`src/core/flags.ts`. To pull a risky feature, set it to `false` in the
deployment `.env` and redeploy; no code change is required.