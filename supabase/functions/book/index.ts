// POST /functions/v1/book — step two of "Book a call". Confirms the slot is
// still open, puts the call on the principal's Google Calendar (no Google
// emails), records the booking, then sends the visitor a branded invitation
// from hi@tenorworth.com with the Zoom link, and the principal a heads-up.
import { json, preflight, readJson, str } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/db.ts';
import { createEvent, deleteEvent, freeBusy } from '../_shared/google.ts';
import { buildInvite, mailConfig, sendInvite, sendNotification, zoomUrl } from '../_shared/mail.ts';
import { rateLimit } from '../_shared/ratelimit.ts';
import { SLOT_MINUTES, bookingConfig, generateSlots } from '../_shared/slots.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAKEN = 'That time was just taken. Please pick another.';

// Every success here writes to the calendar and sends mail from hi@, so this is
// the tightest cap on the site. Losing a slot to a race and picking another
// still fits.
const MAX_PER_HOUR = 3;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const limited = await rateLimit(
    req, 'book', MAX_PER_HOUR, 3600,
    'That is several booking attempts in a row. Please wait a little, or email us and we will find a time.',
  );
  if (limited) return limited;

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

  const practiceZone = bookingConfig().timeZone;
  const visitorZone = timezone || lead.timezone || practiceZone;
  const zoom = zoomUrl();
  const company = lead.company ? ` (${lead.company})` : '';
  const summary = `Tenorworth intro call: ${lead.name}${company}`;

  // 1. Calendar event on the principal's calendar.
  let event;
  try {
    const busy = await freeBusy(start, end);
    if (busy.length) return json(req, { error: TAKEN }, 409);

    event = await createEvent({
      start,
      end,
      summary,
      location: zoom,
      description: [
        'Thirty-minute intro call booked via tenorworth.com.',
        '',
        `Zoom: ${zoom}`,
        '',
        `Name: ${lead.name}`,
        lead.company ? `Company: ${lead.company}` : null,
        `Email: ${lead.email}`,
        lead.message ? `\nWhat they want to discuss:\n${lead.message}` : null,
        `\nTheir time zone: ${visitorZone}`,
      ].filter((line) => line !== null).join('\n'),
    });
  } catch (err) {
    console.error('calendar failed', err);
    return json(req, { error: 'The calendar is not reachable right now. Please email us instead.' }, 502);
  }

  // 2. Record it (the partial unique index is the backstop for two visitors racing).
  const { data: booking, error: insertErr } = await db
    .from('bookings')
    .insert({
      lead_id: lead.id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      timezone: timezone || null,
      google_event_id: event.id,
      meet_url: zoom,
      html_link: event.htmlLink,
    })
    .select('id')
    .single();

  if (insertErr || !booking) {
    console.error('booking insert failed', insertErr);
    await deleteEvent(event.id).catch((e) => console.error('event rollback failed', e));
    if (insertErr?.code === '23505') return json(req, { error: TAKEN }, 409);
    return json(req, { error: 'Something went wrong. Please try again.' }, 500);
  }

  // 3. The visitor's invitation, from hi@. If this fails they have nothing, so undo.
  const details = {
    lead: { name: lead.name, email: lead.email, company: lead.company, message: lead.message },
    start, end, minutes: SLOT_MINUTES, visitorZone, practiceZone, zoom, calendarLink: event.htmlLink,
  };
  try {
    const { fromName, fromEmail } = mailConfig();
    const ics = buildInvite({
      uid: `${booking.id}@tenorworth.com`,
      start, end, summary,
      description: `Thirty-minute intro call with Arka Bala, Tenorworth.\nZoom: ${zoom}\n\nNeed to move it? Reply to the invitation email.`,
      location: zoom,
      organizer: { name: fromName, email: fromEmail },
      attendee: { name: lead.name, email: lead.email },
    });
    await sendInvite(details, ics);
  } catch (err) {
    console.error('invite email failed', err);
    await db.from('bookings').delete().eq('id', booking.id);
    await deleteEvent(event.id).catch((e) => console.error('event rollback failed', e));
    return json(req, { error: 'We could not send the invitation just now. Please try again, or email us.' }, 502);
  }

  // 4. Heads-up to the principal. Best effort: the event is already on the calendar.
  await sendNotification(details).catch((e) => console.error('notification email failed', e));

  return json(req, {
    start: start.toISOString(),
    end: end.toISOString(),
    meetUrl: zoom,
    htmlLink: event.htmlLink,
    timeZone: practiceZone,
  }, 201);
});
