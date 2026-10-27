// POST /functions/v1/prospect-photo — looks for a prospect's headshot and saves
// what it finds on their row. Called by app.tenorworth.com with the signed-in
// admin's session, one prospect per request: { id }. The pipeline page runs a
// few of these at a time for "Find photos"; the search itself is in find.ts.
import { APP_ORIGINS, json, preflight, readJson, str } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/db.ts';
import { findPhoto } from './find.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const pre = preflight(req, APP_ORIGINS);
  if (pre) return pre;
  const reply = (body: unknown, status = 200) => json(req, body, status, APP_ORIGINS);
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  // Admins only, by the same rule as the pipeline's RLS: app_metadata.role,
  // which users cannot set on themselves.
  const db = serviceClient();
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = token ? await db.auth.getUser(token) : { data: { user: null } };
  if (auth.user?.app_metadata?.role !== 'admin') return reply({ error: 'Sign in as an admin.' }, 403);

  const body = await readJson(req);
  const id = str(body?.id, 36);
  if (!UUID.test(id)) return reply({ error: 'Missing prospect id' }, 400);

  const { data: p, error } = await db.from('prospects').select('id, name, email, website').eq('id', id).maybeSingle();
  if (error) {
    console.error('prospect read failed', error);
    return reply({ error: 'Could not read that prospect.' }, 500);
  }
  if (!p) return reply({ error: 'No such prospect' }, 404);

  const found = await findPhoto(p).catch((e) => {
    console.error('photo search failed', id, e);
    return null;
  });

  // A miss records the attempt and leaves any existing photo alone.
  const patch = {
    photo_checked_at: new Date().toISOString(),
    ...(found && { photo_url: found.url, photo_source: found.page }),
  };
  const { data: row, error: saveError } = await db
    .from('prospects')
    .update(patch)
    .eq('id', id)
    .select('photo_url, photo_source, photo_checked_at')
    .single();
  if (saveError) {
    console.error('photo save failed', saveError);
    return reply({ error: 'Found a photo but could not save it.' }, 500);
  }
  return reply({ found: !!found, ...row });
});
