// Google Calendar access for one account, via an OAuth refresh token obtained
// once with scripts/google-oauth-token.mjs. Secrets (set with
// `supabase secrets set`): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// GOOGLE_REFRESH_TOKEN, and optionally GOOGLE_CALENDAR_ID (default "primary",
// i.e. the calendar of whoever granted consent).

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface Interval {
  start: string; // ISO 8601, UTC
  end: string;
}

let cached: { token: string; expiresAt: number } | null = null;

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function calendarId(): string {
  return Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';
}

export async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      refresh_token: env('GOOGLE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function calendarFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Google Calendar ${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Busy intervals on the calendar between two instants. */
export async function freeBusy(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  const data = await calendarFetch<{ calendars?: Record<string, { busy?: Interval[] }> }>('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'UTC',
      items: [{ id: calendarId() }],
    }),
  });
  // The response is keyed by the id we asked for; take the first entry so
  // "primary" vs the literal address makes no difference.
  const first = Object.values(data.calendars ?? {})[0];
  return first?.busy ?? [];
}

export interface CreatedEvent {
  id: string;
  htmlLink: string | null;
  meetUrl: string | null;
}

export async function createEvent(input: {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  attendee: { email: string; name: string };
}): Promise<CreatedEvent> {
  const path = `/calendars/${encodeURIComponent(calendarId())}/events?conferenceDataVersion=1&sendUpdates=all`;
  const data = await calendarFetch<{ id: string; htmlLink?: string; hangoutLink?: string }>(path, {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: input.end.toISOString(), timeZone: 'UTC' },
      attendees: [{ email: input.attendee.email, displayName: input.attendee.name }],
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: { useDefault: true },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
    }),
  });
  return { id: data.id, htmlLink: data.htmlLink ?? null, meetUrl: data.hangoutLink ?? null };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const path = `/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}?sendUpdates=all`;
  await calendarFetch<void>(path, { method: 'DELETE' });
}
