// POST /functions/v1/lead — step one of "Book a call", and the "send me the
// notes" form on /card. Saves the visitor's details and returns the lead id the
// booking step needs.
//
// Three layers keep bots out: a honeypot field, a Turnstile token the browser
// widget produces, and a per-IP rate limit. The booking step relies on this:
// /book needs a lead id, which only exists once a request got through here.
import { clientIp, json, preflight, readJson, str } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/db.ts';
import { rateLimit } from '../_shared/ratelimit.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A person filling in the form once, changing their mind, and starting over is
// well inside this. A script is not.
const MAX_PER_HOUR = 5;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const limited = await rateLimit(req, 'lead', MAX_PER_HOUR, 3600);
  if (limited) return limited;

  const body = await readJson(req);
  if (!body) return json(req, { error: 'Invalid JSON body' }, 400);

  // Honeypot: real visitors never see the "website" field. Bots fill it.
  // Pretend it worked and store nothing.
  if (str(body.website, 10)) return json(req, { id: crypto.randomUUID() }, 201);

  const passed = await verifyTurnstile(str(body.turnstileToken, 4096), clientIp(req));
  if (!passed) {
    return json(req, { error: 'The spam check did not pass. Please try again, or email us.' }, 403);
  }

  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  const company = str(body.company, 120);
  const message = str(body.message, 2000);
  const source = str(body.source, 60);
  const timezone = str(body.timezone, 64);

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = 'Please tell us your name.';
  if (!EMAIL.test(email)) fields.email = 'Please use a valid email address.';
  if (Object.keys(fields).length) return json(req, { error: 'Check the highlighted fields.', fields }, 422);

  const db = serviceClient();
  const { data, error } = await db
    .from('leads')
    .insert({
      name,
      email,
      company: company || null,
      message: message || null,
      source: source || null,
      timezone: timezone || null,
      user_agent: req.headers.get('user-agent')?.slice(0, 255) ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('lead insert failed', error);
    return json(req, { error: 'We could not save your details. Please try again or email us.' }, 500);
  }
  return json(req, { id: data.id }, 201);
});
