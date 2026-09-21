# Overrool Cloudflare accounts — deployment runbook

Overrool uses **Cloudflare Pages** for the static PWA and **Pages Functions +
D1** for accounts and game-progress sync. BYOK calls go straight from the
player's browser to their provider. Server-side **hosted inference** for the
workspace administrator (one account) runs on the free **Workers AI** tier —
no admin API key is ever shown in the UI.

## 1. Prerequisites

- A Cloudflare account with a Pages plan (free tier is fine).
- Node 18+ with this repo's dependencies installed (`npm ci`).
- `wrangler` (installed as a devDependency) — that means `npx wrangler …` or the
  `npm run …` wrappers below. The `workerd` runtime used by `wrangler pages dev`
  may need an extra approval from npm's script policies on this machine; remote
  deploy and `wrangler d1` do not need it.

## 2. One-time provisioning

```bash
# Log in once (opens a browser)
npx wrangler login

# Create the SQLite database on Cloudflare's D1
npm run d1:create

# It prints a database id. Paste it into wrangler.toml:
#   database_id = "…"
# (The dashboard shows the same id under Workers & Pages → D1.)

# Create the tables (users, sessions, runs)
npm run d1:migrate

# Grant the workspace administrator the 'admin' role so they alone get the
# server-side Hosted (Cloudflare) inference option in the Key Vault.
npx wrangler d1 execute overrool --remote --command="UPDATE users SET role='admin' WHERE email='<admin-email>'"
```

`schema.sql` is idempotent; re-running it is safe.

## 3. Deploy

```bash
npm run cf:deploy      # tsc + vite build, then: npx wrangler pages deploy dist
```

First deploy creates the `overrool` Pages project (or run
`npx wrangler pages project create overrool --production-branch main` first).
Point a custom domain (a bare/root domain is recommended — Vite uses absolute
base paths) inside the Pages dashboard → the project → Custom domains.

## 4. Local full-stack dev

```bash
npm run build
npm run cf:dev         # serves dist/ + Functions and connects to your D1 binding
```

## 5. What got deployed

| File | Purpose |
|------|---------|
| `functions/api/auth/signup.ts` | `POST /api/auth/signup` |
| `functions/api/auth/login.ts` | `POST /api/auth/login` |
| `functions/api/auth/logout.ts` | `POST /api/auth/logout` |
| `functions/api/auth/me.ts` | `GET /api/auth/me` (returns `user.role`) |
| `functions/api/auth/forgot.ts` | `POST /api/auth/forgot` (email reset link) |
| `functions/api/auth/reset.ts` | `POST /api/auth/reset` (consume token, set password) |
| `functions/api/auth/recovery/codes.ts` | `POST /api/auth/recovery/codes` (signed-in: rotate codes) |
| `functions/api/auth/recovery/verify.ts` | `POST /api/auth/recovery/verify` (redeem a code) |
| `functions/api/run.ts` | `GET/PUT /api/run` (account-scoped save) |
| `functions/api/llm.ts` | `POST /api/llm` (admin-only hosted inference via the `AI` binding) |
| `functions/lib/email.ts` | Resend HTTP integration for reset links |
| `functions/lib/*` | D1 access, PBKDF2 + sessions, HTTP helpers |
| `d1/schema.sql` | DDL for `users`, `sessions`, `runs`, `login_attempts`, `recovery_codes`, `password_resets` |
| `public/_redirects` | `/* → /index.html 200` SPA fallback |
| `public/_headers` | security headers incl. CSP `connect-src` provider allowlist |

Local verification without deploying: `npm test` runs the auth + run handlers
end-to-end against an in-memory fake D1 (`functions/api/integration.test.ts`).

## 6. Security posture

- Passwords: salted PBKDF2-SHA256, 100k iterations (Workers crypto cap), unique per-user salt; only
  the digest is stored.
- Sessions: opaque 32-byte tokens; D1 stores only `sha256(token)`. The cookie is
  `__Host-overrool_session`, `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=30d`.
  `__Host-` forces `Secure` + no `Domain`, so the cookie pins to the site origin.
- Login rotates the account's session (single active session).
- `/api/run` requires a valid session, validates payload shape + size (413 on
  oversize), and stores only game-progress JSON.
- **BYOK isolation:** on-device LLM configs are scoped by identity
  (`storage.ts`). A key armed while signed in to account A is stored under a
  hash of A's email and is never read, shown, or billed by account B signing in
  on the same device. Signed-out sessions share only the `anonymous` device
  scope, and a single pre-scoping legacy key is migrated once into that scope.
- **Failed-login backoff:** `/api/auth/login` records each failure in D1
  (`login_attempts`) and refuses sign-in with `429 login_locked` once 10
  failures for an email land inside a 15-minute window (including unknown
  emails, and the correct password stays blocked until the window slides — no
  lock-bypass). A successful sign-in clears the counter. Requires the
  `login_attempts` table from `d1/schema.sql` (re-run `npm run d1:migrate` on
  an existing deployment).
- **Password recovery:** two always-available backstops. (1) **Ignition-reset
  links** — `POST /api/auth/forgot` issues a 160-bit token whose SHA-256 digest
  is stored in `password_resets` with a 30-minute TTL; the plaintext lives only
  in the reset link (`${origin}/?reset_token=…`). `POST /api/auth/reset` sets a
  new password, consumes the token, and rotates the session. The response shape
  is identical for valid/invalid/unknown emails, so the endpoint cannot be used
  to enumerate accounts. (2) **One-time recovery codes** — 8 codes per
  generation, `XXXX-XXXX` (no ambiguous 0/O/1/I/L), shown once at signup and
  when regenerated from the account panel; only `sha256(code)` is stored.
  `POST /api/auth/recovery/verify` redeems a code (single-use) to set a new
  password. Reset links and code redemption both invalidate the account's other
  sessions.
- **Email transport (optionally configured):** Cloudflare has no outbound mail,
  so reset emails go through **Resend** from a Function (`functions/lib/email.ts`,
  plain `fetch`, no SDK). Until a sender domain is verified, bind
  `wrangler pages secret put RESEND_API_KEY` and a `RESEND_FROM` var
  (`[vars]` in `wrangler.toml`); with neither bound, `/api/auth/forgot` answers
  `emailConfigured:false` and the UI points users at their recovery codes.
- `/api/llm` requires a valid session **and** `role = 'admin'` (403 otherwise).
  It is the only server component that touches an LLM; the `model` and prompts
  come from the admin's client, and the `AI` binding (Workers AI free tier,
  `@cf/meta/llama-3.1-8b-instruct` by default) routes via Cloudflare. The admin
  email is never returned by any endpoint — only the `role` flag — so a
  specific administrator account can't be inferred from the UI.

## 7. Hosted inference (admin only)

Every account provides its own key by default. One account — the workspace
administrator — can instead enable **Hosted (Cloudflare)** in the Key Vault,
which calls `/api/llm` on this same origin, so no Workers AI credential ever
reaches the browser. Setup:

1. Deploy with the `[ai]` binding enabled in `wrangler.toml`.
2. Sign up / sign in with the admin account and grant the role:
   `UPDATE users SET role='admin' WHERE email='<admin-email>'`.
3. In the Key Vault choose **Hosted (Cloudflare)** (visible only to the admin
   account) and Enable. No key field is shown or required.
4. Admin quotas: Workers AI has a daily free allocation; when it is exhausted
   `/api/llm` responds `429 hosted_quota` and the Key Vault Test button tells
   the admin to switch back to a BYO key or add a Cloudflare billing method.

The hosted path only sends the current turn's system/user text, temperature,
token cap, and JSON-schema flag. It is a convenience for the administrator —
all other accounts keep the zero-knowledge BYOK route.

## 7. Accepted gaps / next steps

- **Email verification:** Cloudflare Pages has no outbound mail. Reset links are
  delivered via Resend (see above); verifying the address at signup would reuse
  the same transport — flip `users.verified` (not yet in the schema) to gate
  full functionality.
- **Rate limiting:** login lockout ships in-app (see §6). Layer Cloudflare WAF
  rate rules against `/api/auth/login` and `/api/auth/signup` in the dashboard
  to back it at the edge.
- **Recovery codes:** the signup panel only ever shows codes once, but a fresh
  device that signed in earlier relies on the user having stored them. That is
  the documented trade-off for zero-secret storage.
- **Account deletion / GDPR:** add `DELETE /api/auth/me` + a cascade-clean job
  (`ON DELETE CASCADE` is already on the FK edges) when required.
- **OAuth:** not included by design — email/password keeps the zero-cost core.
  A managed IdP can be swapped in behind the same `/api/auth/me` contract.