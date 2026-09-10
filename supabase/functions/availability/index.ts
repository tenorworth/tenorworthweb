// GET /functions/v1/availability — open 30-minute slots for the next two
// weeks: business-hours slots minus whatever Google Calendar reports as busy.
import { json, preflight } from '../_shared/cors.ts';
import { freeBusy } from '../_shared/google.ts';
import { rateLimit } from '../_shared/ratelimit.ts';
import { SLOT_MINUTES, bookingConfig, generateSlots, removeBusy } from '../_shared/slots.ts';

// Read-only, but each call costs a Google free/busy query. Generous enough for
// a visitor reloading the slot list; a scraper runs out.
const MAX_PER_HOUR = 30;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'GET') return json(req, { error: 'Method not allowed' }, 405);

  const limited = await rateLimit(req, 'availability', MAX_PER_HOUR, 3600);
  if (limited) return limited;

  const { timeZone } = bookingConfig();
  const slots = generateSlots();
  if (slots.length === 0) return json(req, { timeZone, slotMinutes: SLOT_MINUTES, slots: [] });

  try {
    const busy = await freeBusy(new Date(slots[0].start), new Date(slots[slots.length - 1].end));
    return json(req, { timeZone, slotMinutes: SLOT_MINUTES, slots: removeBusy(slots, busy) });
  } catch (err) {
    console.error('availability failed', err);
    return json(req, { error: 'The calendar is not reachable right now. Please email us instead.' }, 502);
  }
});
