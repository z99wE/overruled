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

overrruled is a fully local, client-side application. There is no server
component and no persistence of your data beyond local storage in your browser
or device. This dramatically narrows the attack surface: there is no remote
endpoint to target apart from the LLM providers you choose.

## Security model

- **Zero-cost BYOK:** your LLM API keys are stored in device-secure storage
  (Capacitor Secure Storage on native, scoped storage in the browser). Keys are
  never written to localStorage.
- **Origin locking:** outbound LLM calls are validated against an allowlist of
  known provider origins (`src/core/providerCall.ts`) and reject anything else.
- **Prompt isolation:** provider conversations are built per-request; the system
  never concatenates user-authored text into an executable context.
- **DOM hygiene:** user-authored text is rendered as text, never injected as
  markup; no `dangerouslySetInnerHTML` is used.

## Dependency hygiene

- Dependencies are pinned to exact versions (`package.json`, `package-lock.json`).
- `npm audit` runs in CI (`npm audit --omit=dev --audit-level=high`); a high or
  critical advisory fails the build.
- Dependabot opens weekly update PRs; security repos come in as PRs automatically.

## Disclosures / scope

Only the packages under this repository are in scope. The LLM providers and
their hosted endpoints are out of scope (report to the provider directly).