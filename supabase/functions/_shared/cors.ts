// Request helpers shared by the public booking functions: CORS, JSON bodies,
// field trimming, caller IP.
// Origins: comma-separated ALLOWED_ORIGINS secret, else the defaults below.

const DEFAULT_ORIGINS = [
  'https://tenorworth.com',
  'https://www.tenorworth.com',
  'http://localhost:4322',
];

const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const ORIGINS = configured.length ? configured : DEFAULT_ORIGINS;

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Trimmed string field, capped at `max` characters; '' when absent. */
export function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Caller's IP as seen by the platform edge. The left-most x-forwarded-for entry
 * is the client; the rest are proxies. '' when no header is present, in which
 * case callers should not guess.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim() ?? '';
  return first || (req.headers.get('cf-connecting-ip') ?? '').trim();
}
