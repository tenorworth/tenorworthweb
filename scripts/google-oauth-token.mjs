#!/usr/bin/env node
// One-time helper: obtain a Google OAuth refresh token for the calendar the
// booking flow writes to. Run it on your own machine, signed in to the Google
// account that owns the calendar (arkajit.bala@gmail.com). Prints the token;
// writes nothing to disk. Store the result with `supabase secrets set`.
//
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-oauth-token.mjs
//
// The OAuth client must be of type "Desktop app" (loopback redirects are
// allowed without registering a URI). Full steps in supabase/README.md.

import http from 'node:http';
import { randomBytes } from 'node:crypto';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment first.');
  process.exit(1);
}

const PORT = Number(process.env.PORT || 8787);
const redirectUri = `http://127.0.0.1:${PORT}/callback`;
const state = randomBytes(16).toString('hex');
const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: scopes.join(' '),
  access_type: 'offline', // ask for a refresh token
  prompt: 'consent',      // force one to be issued even if previously granted
  state,
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
  const finish = (status, text) => { res.writeHead(status, { 'content-type': 'text/plain' }).end(text); };

  if (url.searchParams.get('state') !== state) { finish(400, 'State mismatch. Try again.'); return; }
  const code = url.searchParams.get('code');
  if (!code) { finish(400, `Google returned no code: ${url.searchParams.get('error') ?? 'unknown error'}`); return; }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  const data = await tokenRes.json();
  if (!tokenRes.ok || !data.refresh_token) {
    finish(500, 'Token exchange failed. See the terminal.');
    console.error('Token exchange failed:', data);
    console.error('If there is no refresh_token, revoke the app at https://myaccount.google.com/permissions and run this again.');
    server.close();
    process.exit(1);
  }

  finish(200, 'Done. You can close this tab and return to the terminal.');
  console.log('\nRefresh token obtained. Store it as a Supabase secret (never in the repo):\n');
  console.log(`  supabase secrets set GOOGLE_CLIENT_ID='${clientId}' GOOGLE_CLIENT_SECRET='${clientSecret}' GOOGLE_REFRESH_TOKEN='${data.refresh_token}'\n`);
  server.close();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this URL in a browser signed in as the calendar owner:\n');
  console.log(authUrl.toString());
  console.log(`\nWaiting for Google to redirect to ${redirectUri} ...`);
});
