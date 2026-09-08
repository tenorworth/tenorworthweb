// GET /functions/v1/availability — open 30-minute slots for the next two
// weeks: business-hours slots minus whatever Google Calendar reports as busy.
import { json, preflight } from '../_shared/cors.ts';
import { freeBusy } from '../_shared/google.ts';
import { SLOT_MINUTES, bookingConfig, generateSlots, removeBusy } from '../_shared/slots.ts';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'GET') return json(req, { error: 'Method not allowed' }, 405);

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
