# Privacy

Effective date: 20 September 2026. Overrool is an educational legal-strategy
simulation. This page explains what the application collects from you, what it
does not collect, and how you can control it.

## Short version

- **Bring-your-own-key (BYOK): your model API key never reaches our servers.**
  It is stored only on your device (and, when you opt in, in browser storage on
  that same device) and sent directly from your browser to the provider you
  chose. No chat history or case details from simulated trials are transmitted
  to our servers for BYOK trials. Keys are **scoped per identity**: a key armed
  while signed in to one account can never be read or billed by a different
  account signing in on the same device — signed-out users share only the
  unsigned-in "device" scope, never each other's keys.
- **Accounts.** If you create an account, we store your normalized email
  address, a salted PBKDF2 password hash, a created-at timestamp, and your
  game-progress saves. That is all.
- **Hosted inference (administrator only).** When the workspace administrator
  enables the server-side model, their trial prompts are processed on
  Cloudflare Workers AI. Non-administrators never use this path and no AI keys
  are ever exposed in the UI.
- **No ads, no trackers, no analytics beacons.** We do not use advertising or
  third-party analytics. Our privacy surface is intentionally small.

## What we store

| Data | Where | Why |
|------|-------|-----|
| Email address (normalized to lowercase) | Cloudflare D1, `users.email` | Account identity |
| Password hash (salted PBKDF2-SHA256, 100k iterations (Workers crypto cap)) | Cloudflare D1, `users.pw_hash` | Authentication — the plaintext password is never stored |
| Account role (`user` / `admin`) | Cloudflare D1, `users.role` | Gating server-side hosted inference |
| Created-at timestamp | Cloudflare D1, `users.created_at` | Account metadata |
| Session token (SHA-256 digest only) | Cloudflare D1, `sessions` | Remembering you while signed in |
| Game-progress JSON (chips, XP, jokers, boss progress) | Cloudflare D1, `runs` | Cross-device save sync |
| BYOK provider config (provider + model, and the key on your device) | Your device only | Connecting you to your own LLM provider |

## What we never store

- Your LLM API keys (ours or yours).
- Trial prompts, judge rulings, or case texts from BYOK trials.
- Browsing history, IP-derived profiles, or advertising identifiers.
- Payment information (we hold no money).

## Cookies and sessions

Signing in sets a single `__Host-overrool_session` cookie:
`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`. It is the only cookie we
create. Signing out clears it, and logging in again rotates the stored digest.

## How hosted inference works

The workspace administrator may enable server-side inference (Cloudflare
Workers AI) inside the Key Vault. In that mode, the admin's simulated trial
calls are proxied through Overrool's own `/api/llm` function to the Workers AI
model; the same-origin request carries only the current turn's prompts, and
the model output is returned to the browser. Admins can verify the free-tier
quota on Cloudflare at any time. Non-admin accounts are rejected on this path
and continue with their own keys.

## Third parties

- **Cloudflare** hosts the static application, the Pages Functions, D1, and
  Workers AI. Cloudflare's data-processing and privacy terms apply to that
  hosting relationship.
- **Your chosen LLM provider** (Google, OpenAI, Anthropic, or Groq) receives
  only what your browser sends it for a BYOK trial under your own quota, and the
  provider applies its own terms to that traffic. Review that provider's privacy
  terms before choosing; trial text you submit under your own key is subject to
  that provider's data-handling rules, not ours.

## Retention and deletion

Account saves are retained while the account exists. To delete your account
and all associated data, contact the maintainers (see SECURITY.md for the
coordinated-disclosure channel and ask for account deletion); on an
enterprise/self-managed deployment, deletion can also be performed by the
administrator via D1. Local BYOK config is removed with the Key Vault's
"Clear" button or by clearing your browser storage.

## Children

Overrool is aimed at practising lawyers and law students. Accounts for
individuals under the age of 13 (or the age of digital consent in your
jurisdiction, whichever is higher) are not permitted; delete such accounts on
discovery.

## Governing law and contact

This application and its data handling are maintained for educational use
worldwide. Questions, deletion requests, or complaints:

- Open an issue in the source repository of the deployment you use, or
- Contact the account administrator of the deployment (D1 admins can be
  reached through the maintainers channel referenced in SECURITY.md).

## Changes

If this notice changes materially, the revision date at the top of this file
is updated and the change is logged in [CHANGELOG.md](CHANGELOG.md). Continued
use after a change means you accept the revised notice.