/**
 * Transactional email for password resets via Resend's HTTP API.
 * Cloudflare has no outbound email, so we call Resend directly (no SDK —
 * plain fetch, ~0 extra bundle weight). When RESEND_API_KEY is not bound the
 * caller degrades gracefully to recovery codes.
 */

interface SendOptions {
  apiKey: string | undefined;
  from: string | undefined;
  to: string;
  resetUrl: string;
}

export function buildResetUrl(origin: string, token: string): string {
  return `${origin}/?reset_token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(opts: SendOptions): Promise<boolean> {
  if (!opts.apiKey || !opts.from) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${opts.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from,
        to: opts.to,
        subject: 'Reset your Overrool password',
        text: [
          'Someone requested a password reset for your Overrool account.',
          '',
          'Open the link below to choose a new password. It expires in 30 minutes',
          'and can only be used once:',
          '',
          opts.resetUrl,
          '',
          'If you didn\u2019t ask for this, you can safely ignore this email.',
        ].join('\n'),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}