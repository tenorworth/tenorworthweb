// POST /functions/v1/book — step two of "Book a call". Confirms the slot is
// still open, creates the Google Calendar event (attendee + Meet link, invite
// sent by Google), and records the booking against the lead.
import { json, preflight, readJson, str } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/db.ts';
import { createEvent, deleteEvent, freeBusy } from '../_shared/google.ts';
import { SLOT_MINUTES, bookingConfig, generateSlots } from '../_shared/slots.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAKEN = 'That time was just taken. Please pick another.';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const body = await readJson(req);
  if (!body) return json(req, { error: 'Invalid JSON body' }, 400);

  const leadId = str(body.leadId, 36);
  const startIso = str(body.start, 40);
  const timezone = str(body.timezone, 64);
  if (!UUID.test(leadId)) return json(req, { error: 'Missing lead. Please start again.' }, 400);

  const startMs = Date.parse(startIso);
  if (!Number.isFinite(startMs)) return json(req, { error: 'Invalid start time.' }, 400);
  const start = new Date(startMs);
  const end = new Date(startMs + SLOT_MINUTES * 60_000);

  // Only times we would have offered: weekday, business hours, enough notice.
  if (!generateSlots().some((s) => s.start === start.toISOString())) {
    return json(req, { error: 'That time is not available.' }, 409);
  }

  const db = serviceClient();
  const { data: lead, error: leadErr } = await db
    .from('leads')
    .select('id, name, email, company, message, timezone')
    .eq('id', leadId)
    .maybeSingle();
  if (leadErr) {
    console.error('lead lookup failed', leadErr);
    return json(req, { error: 'Something went wrong. Please try again.' }, 500);
  }
  if (!lead) return json(req, { error: 'We could not find your details. Please start again.' }, 404);

  const { data: clash } = await db
    .from('bookings')
    .select('id')
    .eq('start_at', start.toISOString())
    .eq('status', 'confirmed')
    .maybeSingle();
  if (clash) return json(req, { error: TAKEN }, 409);

  let event;
  try {
    const busy = await freeBusy(start, end);
    if (busy.length) return json(req, { error: TAKEN }, 409);

    const company = lead.company ? ` (${lead.company})` : '';
    event = await createEvent({
      start,
      end,
      summary: `Tenorworth intro call: ${lead.name}${company}`,
      description: [
        'Thirty-minute intro call booked via tenorworth.com.',
        '',
        `Name: ${lead.name}`,
        lead.company ? `Company: ${lead.company}` : null,
        `Email: ${lead.email}`,
        lead.message ? `\nWhat they want to discuss:\n${lead.message}` : null,
        timezone || lead.timezone ? `\nTheir time zone: ${timezone || lead.timezone}` : null,
      ].filter((line) => line !== null).join('\n'),
      attendee: { email: lead.email, name: lead.name },
    });
  } catch (err) {
    console.error('calendar failed', err);
    return json(req, { error: 'The calendar is not reachable right now. Please email us instead.' }, 502);
  }

  const { error: insertErr } = await db.from('bookings').insert({
    lead_id: lead.id,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    timezone: timezone || null,
    google_event_id: event.id,
    meet_url: event.meetUrl,
    html_link: event.htmlLink,
  });

  if (insertErr) {
    console.error('booking insert failed', insertErr);
    // Lost the race for this slot (partial unique index). Undo the event.
    if (insertErr.code === '23505') {
      await deleteEvent(event.id).catch((e) => console.error('event rollback failed', e));
      return json(req, { error: TAKEN }, 409);
    }
    return json(req, { error: 'The invite was sent but we could not record it. We will follow up by email.' }, 500);
  }

  return json(req, {
    start: start.toISOString(),
    end: end.toISOString(),
    meetUrl: event.meetUrl,
    htmlLink: event.htmlLink,
    timeZone: bookingConfig().timeZone,
  }, 201);
});
