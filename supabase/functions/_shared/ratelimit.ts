// Per-IP rate limiting, counted in Postgres so it holds across Edge Function
// instances. See migrations/20260910000000_rate_limits.sql.
//
// Two deliberate soft edges: a request with no forwarded IP is not limited (we
// will not put every unknown caller in one shared bucket), and a database error
// lets the request through. The limiter exists to blunt scripted abuse, not to
// take the booking flow down when Postgres hiccups.
import { clientIp, json } from './cors.ts';
import { serviceClient } from './db.ts';

/** Salted so the table holds no reversible record of a visitor's IP. */
async function bucket(name: string, ip: string): Promise<string> {
  const salt = Deno.env.get('RATE_LIMIT_SALT') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${name}:${hex.slice(0, 32)}`;
}

/**
 * Counts one request from this caller against `max` per `windowSeconds`.
 * Returns a 429 Response when they are over the cap, otherwise null and the
 * handler carries on.
 */
export async function rateLimit(
  req: Request,
  name: string,
  max: number,
  windowSeconds: number,
  message = 'Too many requests just now. Please wait a minute and try again.',
): Promise<Response | null> {
  const ip = clientIp(req);
  if (!ip) return null;

  try {
    const db = serviceClient();
    const { data, error } = await db.rpc('rate_limit_hit', {
      p_bucket: await bucket(name, ip),
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('rate limit check failed', error);
      return null;
    }
    if (data === false) {
      console.warn(`rate limit hit on ${name}`);
      const res = json(req, { error: message }, 429);
      res.headers.set('Retry-After', String(windowSeconds));
      return res;
    }
  } catch (err) {
    console.error('rate limit check threw', err);
  }
  return null;
}
