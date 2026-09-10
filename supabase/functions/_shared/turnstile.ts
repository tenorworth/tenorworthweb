// Cloudflare Turnstile verification for the public forms.
//
// TURNSTILE_SECRET_KEY unset means verification is skipped, so `supabase
// functions serve` and any deploy made before the key exists keep working. With
// the key set the check fails closed: a token that Cloudflare will not confirm
// is refused, and the visitor is told to try again or email us.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled(): boolean {
  return Boolean(Deno.env.get('TURNSTILE_SECRET_KEY'));
}

/** True when the widget token is valid, or when Turnstile is not configured. */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return true;
  if (!token) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success !== true) console.warn('turnstile rejected', data['error-codes']);
    return data.success === true;
  } catch (err) {
    console.error('turnstile verify failed', err);
    return false;
  }
}
