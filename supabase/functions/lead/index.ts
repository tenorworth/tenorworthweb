// POST /functions/v1/lead — step one of "Book a call". Saves the visitor's
// details and returns the lead id the booking step needs.
import { json, preflight, readJson, str } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/db.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const body = await readJson(req);
  if (!body) return json(req, { error: 'Invalid JSON body' }, 400);

  // Honeypot: real visitors never see the "website" field. Bots fill it.
  // Pretend it worked and store nothing.
  if (str(body.website, 10)) return json(req, { id: crypto.randomUUID() }, 201);

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
