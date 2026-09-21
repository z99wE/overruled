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
directly from the player's browser to the provider they chose. The one
exception is the admin-only hosted path (`/api/llm`), which proxies the
workspace administrator's turn to Cloudflare's Workers AI `AI` binding — it
carries no secret, never serves the admin email (only `role`), and rejects
non-admin sessions with 403.

The only server component is the **optional accounts API**, deployed on
Cloudflare Pages Functions backed by D1. It is reachable only at `/api/auth/*`,
`/api/run`, and `/api/llm`. It exists to let players sign in, sync game
progress, and (for the admin) reach the hosted model; it never receives LLM
API keys.

## Security model

- **Zero-cost BYOK:** your LLM API keys are stored in device-secure storage
  (Capacitor Secure Storage on native). On the web the key rests unencrypted in
  browser storage (localStorage when "persist" is on, sessionStorage otherwise)
  — the UI discloses this. Keys are never sent to the Overrool servers: they
  travel only to the allowlisted provider endpoints from your own browser.
- **Origin locking:** outbound LLM calls are validated against an allowlist of
  known provider origins (`src/core/providerCall.ts`) and reject anything else.
- **Accounts (`functions/`):** passwords are hashed with salted PBKDF2-SHA256
  (100k iterations (Workers crypto cap), unique per-user salt); only the digest is stored. Sessions
  are opaque 32-byte tokens; the DB stores only their SHA-256, and the cookie
  is `__Host-`-prefixed, `HttpOnly`, `Secure`, `SameSite=Strict`, 30-day TTL.
  Login rotates the account's session. `GET/PUT /api/run` validate payload
  shape and size and require a valid session.
- **Prompt isolation:** provider conversations are built per-request; the system
  never concatenates user-authored text into an executable context.
- **Sign-in backoff:** failed logins are recorded in D1 (`login_attempts`) and a
  per-email lock (`429 login_locked`) engages after 10 failures inside 15
  minutes. It covers unknown emails too and won't be bypassed by the correct
  password while locked; a successful sign-in clears the counter.
- **Password recovery:** `/api/auth/forgot` and `/api/auth/reset` implement
  single-use 30-minute reset tokens whose SHA-256 digests are stored in
  `password_resets` (`__Host-only` plaintext lives in the emailed link). The
  forgot endpoint answers identically for known and unknown emails to prevent
  account enumeration. As a fallback, signup and the account panel emit 8
  one-time **recovery codes** (`XXXX-XXXX`, unambiguous alphabet); only
  `sha256(code)` is stored, each code redeems once via
  `/api/auth/recovery/verify`, and both reset paths revoke the account's other
  sessions. Reset email is delivered through Resend only when `RESEND_API_KEY`
  and `RESEND_FROM` are bound; with no transport the server reports
  `emailConfigured:false` and nothing is leaked about whether the account exists.
- **DOM hygiene:** user-authored text is rendered as text, never injected as
  markup; no `dangerouslySetInnerHTML` is used.

## Known account trade-offs (accepted for the MVP)

- No email verification (Cloudflare Pages has no outbound email; a provider
  such as Resend is wired for password-reset links but a sender domain must be
  verified before those emails can go out).
- Application-layer backoff is per-email; a Cloudflare WAF/rate rule can still
  be layered onto `/api/auth/*` for IP-level aggregate limits.
- Sessions are a single bearer cookie rotated on login; there is no refresh-token
  rotation after that.
- Reset links and recovery codes are bearer secrets; treat a lost-device + lost-codes
  scenario as unrecoverable by design (we store only hashes).
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