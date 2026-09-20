# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Instead, email the
maintainer privately or open a GitHub security advisory. Include:

- a description of the issue,
- steps to reproduce,
- the affected version.

You will receive an acknowledgement within 3 business days and a target date
for a fix.

## Supported runtime profile

The game shell is a fully local, client-side application. LLM calls go
directly from the player's browser to the provider they chose — no LLM proxy.

The only server component is the **optional accounts API**, deployed on
Cloudflare Pages Functions backed by D1. It is reachable only at `/api/auth/*`
and `/api/run`. It exists solely to let players sign in and sync game progress;
it never receives LLM API keys.

## Security model

- **Zero-cost BYOK:** your LLM API keys are stored in device-secure storage
  (Capacitor Secure Storage on native). On the web the key rests unencrypted in
  browser storage (localStorage when "persist" is on, sessionStorage otherwise)
  — the UI discloses this. Keys are never sent to the Overrool servers: they
  travel only to the allowlisted provider endpoints from your own browser.
- **Origin locking:** outbound LLM calls are validated against an allowlist of
  known provider origins (`src/core/providerCall.ts`) and reject anything else.
- **Accounts (`functions/`):** passwords are hashed with salted PBKDF2-SHA256
  (210k iterations, unique per-user salt); only the digest is stored. Sessions
  are opaque 32-byte tokens; the DB stores only their SHA-256, and the cookie
  is `__Host-`-prefixed, `HttpOnly`, `Secure`, `SameSite=Strict`, 30-day TTL.
  Login rotates the account's session. `GET/PUT /api/run` validate payload
  shape and size and require a valid session.
- **Prompt isolation:** provider conversations are built per-request; the system
  never concatenates user-authored text into an executable context.
- **DOM hygiene:** user-authored text is rendered as text, never injected as
  markup; no `dangerouslySetInnerHTML` is used.

## Known account trade-offs (accepted for the MVP)

- No email verification (Cloudflare Pages has no outbound email; a provider
  such as Resend is the intended retrofit).
- No login rate limiting / lockout at this layer (Cloudflare's WAF/rate rules
  can be layered onto the deployment).
- Sessions are a single bearer cookie rotated on login; there is no refresh-token
  rotation after that.
- The auth HTTP layer is a small custom implementation, not a managed IdP.
  Treat account data as low-value sync state, not as a high-assurance identity.

## Dependency hygiene

- Dependencies are pinned to exact versions (`package.json`, `package-lock.json`).
- `npm audit` runs in CI (`npm audit --omit=dev --audit-level=high`); a high or
  critical advisory fails the build.
- Dependabot opens weekly update PRs; security repos come in as PRs automatically.

## Disclosures / scope

Only the packages under this repository are in scope. The LLM providers and
their hosted endpoints are out of scope (report to the provider directly).