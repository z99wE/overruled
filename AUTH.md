# Overrool Cloudflare accounts — deployment runbook

Overrool uses **Cloudflare Pages** for the static PWA and **Pages Functions +
D1** for accounts and game-progress sync. No LLM key ever reaches this stack:
BYOK calls go straight from the player's browser to their provider.

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
| `functions/api/auth/me.ts` | `GET /api/auth/me` |
| `functions/api/run.ts` | `GET/PUT /api/run` (account-scoped save) |
| `functions/lib/*` | D1 access, PBKDF2 + sessions, HTTP helpers |
| `d1/schema.sql` | DDL for `users`, `sessions`, `runs` |
| `public/_redirects` | `/* → /index.html 200` SPA fallback |
| `public/_headers` | security headers incl. CSP `connect-src` provider allowlist |

Local verification without deploying: `npm test` runs the auth + run handlers
end-to-end against an in-memory fake D1 (`functions/api/integration.test.ts`).

## 6. Security posture

- Passwords: salted PBKDF2-SHA256, 210k iterations, unique per-user salt; only
  the digest is stored.
- Sessions: opaque 32-byte tokens; D1 stores only `sha256(token)`. The cookie is
  `__Host-overrool_session`, `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=30d`.
  `__Host-` forces `Secure` + no `Domain`, so the cookie pins to the site origin.
- Login rotates the account's session (single active session).
- `/api/run` requires a valid session, validates payload shape + size (413 on
  oversize), and stores only game-progress JSON.

## 7. Accepted gaps / next steps

- **Email verification:** Cloudflare Pages has no outbound mail. Retrofit: send
  a verification link via Resend/Mailgun from a Function; flip
  `users.verified` (not yet in the schema) to gate full functionality.
- **Rate limiting:** no login lockout yet. Layer Cloudflare WAF rate rules
  against `/api/auth/login` and `/api/auth/signup` in the dashboard.
- **Token lifecycle:** single bearer cookie, rotated on login; no refresh-token
  rotation or device list afterwards. Sufficient for low-value save sync.
- **Account deletion / GDPR:** add `DELETE /api/auth/me` + a cascade-clean job
  (`ON DELETE CASCADE` is already on the FK edges) when required.
- **OAuth:** not included by design — email/password keeps the zero-cost core.
  A managed IdP can be swapped in behind the same `/api/auth/me` contract.