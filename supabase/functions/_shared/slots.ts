// Bookable 30-minute slots: weekdays, business hours in the practice's time
// zone, at least MIN_NOTICE hours out, within the next WINDOW days. All
// instants are UTC ISO strings; the browser renders them in the visitor's zone.
//
// Optional secrets: BOOKING_TIMEZONE (IANA, default America/Los_Angeles),
// BOOKING_START_HOUR (9), BOOKING_END_HOUR (17), BOOKING_WINDOW_DAYS (14),
// BOOKING_MIN_NOTICE_HOURS (4).

import type { Interval } from './google.ts';

export const SLOT_MINUTES = 30;

function int(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== '' ? n : fallback;
}

export function bookingConfig() {
  return {
    timeZone: Deno.env.get('BOOKING_TIMEZONE') || 'America/Los_Angeles',
    startHour: int(Deno.env.get('BOOKING_START_HOUR'), 9),
    endHour: int(Deno.env.get('BOOKING_END_HOUR'), 17),
    windowDays: int(Deno.env.get('BOOKING_WINDOW_DAYS'), 14),
    minNoticeHours: int(Deno.env.get('BOOKING_MIN_NOTICE_HOURS'), 4),
    weekdays: [1, 2, 3, 4, 5], // Mon..Fri
  };
}

interface Parts { year: number; month: number; day: number; hour: number; minute: number; second: number }

function partsIn(date: Date, timeZone: string): Parts {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, number> = {};
  for (const part of f.formatToParts(date)) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  return p as unknown as Parts;
}

/** Offset of `timeZone` from UTC, in minutes, at the given instant. */
function offsetMinutes(date: Date, timeZone: string): number {
  const p = partsIn(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Wall-clock time in `timeZone` → UTC instant. Handles DST by re-checking the offset once. */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const off1 = offsetMinutes(new Date(guess), timeZone);
  let utc = guess - off1 * 60_000;
  const off2 = offsetMinutes(new Date(utc), timeZone);
  if (off2 !== off1) utc = guess - off2 * 60_000;
  return new Date(utc);
}

export function generateSlots(now: Date = new Date()): Interval[] {
  const c = bookingConfig();
  const earliest = now.getTime() + c.minNoticeHours * 3_600_000;
  const today = partsIn(now, c.timeZone);
  const out: Interval[] = [];

  for (let i = 0; i <= c.windowDays; i++) {
    // Civil-date arithmetic: Date.UTC normalises day overflow for us.
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    if (!c.weekdays.includes(d.getUTCDay())) continue;
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();

    for (let mins = c.startHour * 60; mins + SLOT_MINUTES <= c.endHour * 60; mins += SLOT_MINUTES) {
      const start = zonedToUtc(y, m, day, Math.floor(mins / 60), mins % 60, c.timeZone);
      if (start.getTime() < earliest) continue;
      out.push({
        start: start.toISOString(),
        end: new Date(start.getTime() + SLOT_MINUTES * 60_000).toISOString(),
      });
    }
  }
  return out;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return new Date(b.start) < new Date(a.end) && new Date(b.end) > new Date(a.start);
}

export function removeBusy(slots: Interval[], busy: Interval[]): Interval[] {
  return slots.filter((s) => !busy.some((b) => overlaps(s, b)));
}
