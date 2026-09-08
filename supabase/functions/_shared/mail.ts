// Outbound email for the booking flow, sent from the practice mailbox over
// SMTP (Hostinger) rather than by Google Calendar, so the invitation arrives
// from hi@tenorworth.com. Google Calendar is still where the event lives
// (see google.ts); this file only builds and sends the messages.
//
// Secrets: SMTP_HOST (smtp.hostinger.com), SMTP_PORT (465), SMTP_USER
// (hi@tenorworth.com), SMTP_PASS, BOOKING_NOTIFY_EMAIL (where "new booking"
// notes and RSVP replies should reach the principal), ZOOM_JOIN_URL.
import nodemailer from 'npm:nodemailer@6.9.16';

const FROM_NAME = 'Tenorworth';
const SITE = 'https://tenorworth.com';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function mailConfig() {
  const user = env('SMTP_USER');
  const port = Number(Deno.env.get('SMTP_PORT') || 465);
  return {
    host: Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    user,
    pass: env('SMTP_PASS'),
    fromName: FROM_NAME,
    fromEmail: user,
    notifyTo: env('BOOKING_NOTIFY_EMAIL'),
  };
}

export function zoomUrl(): string {
  return env('ZOOM_JOIN_URL');
}

function transport() {
  const c = mailConfig();
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

// ── iCalendar (RFC 5545) ──────────────────────────────────────────────────
const icsEscape = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const fold = (line: string) => line.match(/.{1,72}/g)?.join('\r\n ') ?? line;
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export interface InviteInput {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location: string;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
}

/** A METHOD:REQUEST invitation the recipient's mail client renders with Accept/Decline. */
export function buildInvite(i: InviteInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tenorworth//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${i.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(i.start)}`,
    `DTEND:${stamp(i.end)}`,
    `SUMMARY:${icsEscape(i.summary)}`,
    `DESCRIPTION:${icsEscape(i.description)}`,
    `LOCATION:${icsEscape(i.location)}`,
    `URL:${i.location}`,
    `ORGANIZER;CN=${icsEscape(i.organizer.name)}:mailto:${i.organizer.email}`,
    `ATTENDEE;CN=${icsEscape(i.attendee.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${i.attendee.email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tenorworth call in 10 minutes',
    'TRIGGER:-PT10M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// ── Formatting ────────────────────────────────────────────────────────────
/** "Wednesday, September 9 at 10:00 AM PDT", in `timeZone` (falls back when the zone is unknown). */
export function formatWhen(d: Date, timeZone: string, fallbackZone: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  };
  try {
    return new Intl.DateTimeFormat('en-US', { ...opts, timeZone }).format(d).replace(', ', ', ').replace(' at ', ' at ');
  } catch {
    return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: fallbackZone }).format(d);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Minimal brand-consistent HTML wrapper: ink text on cream, one brass rule, Georgia/Inter stacks. */
function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4F1EA;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F1EA;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#141B2D;font-size:16px;line-height:1.6;">
<tr><td style="padding-bottom:20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:-0.01em;">Tenorworth</td></tr>
<tr><td style="padding-bottom:24px;"><div style="height:1px;width:48px;background:#B8985A;"></div></td></tr>
<tr><td style="padding-bottom:16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;">${escapeHtml(title)}</td></tr>
<tr><td>${bodyHtml}</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid #D9D3C5;margin-top:32px;font-size:13px;color:#4A5266;">
Tenorworth &middot; AI, deployed with care.<br><a href="${SITE}" style="color:#4A5266;">tenorworth.com</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`;
const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 16px 6px 0;color:#4A5266;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;">${value}</td></tr>`;

// ── Messages ──────────────────────────────────────────────────────────────
export interface BookingDetails {
  lead: { name: string; email: string; company: string | null; message: string | null };
  start: Date;
  end: Date;
  minutes: number;
  visitorZone: string;
  practiceZone: string;
  zoom: string;
  calendarLink: string | null;
}

/** The visitor's confirmation: branded email from hi@ with the invitation attached. */
export async function sendInvite(b: BookingDetails, ics: string): Promise<void> {
  const c = mailConfig();
  const when = formatWhen(b.start, b.visitorZone, b.practiceZone);
  const first = b.lead.name.split(/\s+/)[0] || b.lead.name;
  const subject = `Tenorworth intro call: ${when}`;

  const text = [
    `Hi ${first},`,
    '',
    'Your call with Arka Bala at Tenorworth is booked.',
    '',
    `When:  ${when} (${b.minutes} minutes)`,
    `Where: Zoom — ${b.zoom}`,
    '',
    'The invitation is attached; accept it and it goes on your calendar with the Zoom link.',
    'Need to move it? Reply to this email.',
    '',
    'Tenorworth',
    'AI, deployed with care.',
    SITE,
  ].join('\n');

  const html = layout('Your call is booked.', [
    p(`Hi ${escapeHtml(first)},`),
    p('Thirty minutes with Arka Bala, the person who would do the work.'),
    `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;font-size:16px;">
      ${row('When', `${escapeHtml(when)} <span style="color:#4A5266;">(${b.minutes} minutes)</span>`)}
      ${row('Where', `<a href="${escapeHtml(b.zoom)}" style="color:#141B2D;">Join on Zoom</a>`)}
    </table>`,
    `<p style="margin:0 0 24px;"><a href="${escapeHtml(b.zoom)}" style="display:inline-block;background:#141B2D;color:#F4F1EA;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:500;">Open the Zoom link</a></p>`,
    p('The invitation is attached. Accept it and the call goes on your calendar with the link. Need to move it? Reply to this email.'),
  ].join(''));

  await transport().sendMail({
    from: { name: c.fromName, address: c.fromEmail },
    to: { name: b.lead.name, address: b.lead.email },
    subject,
    text,
    html,
    icalEvent: { method: 'REQUEST', filename: 'tenorworth-call.ics', content: ics },
  });
}

/** Heads-up to the principal. The event is already on the calendar via the API, so no .ics here. */
export async function sendNotification(b: BookingDetails): Promise<void> {
  const c = mailConfig();
  const when = formatWhen(b.start, b.practiceZone, b.practiceZone);
  const theirs = formatWhen(b.start, b.visitorZone, b.practiceZone);
  const subject = `New booking: ${b.lead.name}${b.lead.company ? ` (${b.lead.company})` : ''} — ${when}`;

  const lines = [
    `New booking via tenorworth.com`,
    '',
    `When:     ${when}`,
    `Name:     ${b.lead.name}`,
    b.lead.company ? `Company:  ${b.lead.company}` : null,
    `Email:    ${b.lead.email}`,
    `Their tz: ${b.visitorZone} (${theirs})`,
    `Zoom:     ${b.zoom}`,
    b.calendarLink ? `Calendar: ${b.calendarLink}` : null,
    b.lead.message ? `\nWhat they want to discuss:\n${b.lead.message}` : null,
    '',
    'Their invitation was sent from this mailbox; an accept or decline will arrive here as a reply.',
  ].filter((l): l is string => l !== null);

  const html = layout('New booking.', [
    `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;font-size:16px;">
      ${row('When', escapeHtml(when))}
      ${row('Name', escapeHtml(b.lead.name))}
      ${b.lead.company ? row('Company', escapeHtml(b.lead.company)) : ''}
      ${row('Email', `<a href="mailto:${escapeHtml(b.lead.email)}" style="color:#141B2D;">${escapeHtml(b.lead.email)}</a>`)}
      ${row('Their time', `${escapeHtml(theirs)} <span style="color:#4A5266;">(${escapeHtml(b.visitorZone)})</span>`)}
      ${row('Zoom', `<a href="${escapeHtml(b.zoom)}" style="color:#141B2D;">Join</a>`)}
      ${b.calendarLink ? row('Calendar', `<a href="${escapeHtml(b.calendarLink)}" style="color:#141B2D;">Open event</a>`) : ''}
    </table>`,
    b.lead.message
      ? `<p style="margin:0 0 8px;color:#4A5266;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;">What they want to discuss</p>
         <blockquote style="margin:0 0 20px;padding:0 0 0 16px;border-left:2px solid #B8985A;color:#4A5266;">${escapeHtml(b.lead.message).replace(/\n/g, '<br>')}</blockquote>`
      : '',
    `<p style="margin:0;color:#4A5266;font-size:14px;">Their invitation went out from this mailbox. An accept or decline arrives here as a reply.</p>`,
  ].join(''));

  await transport().sendMail({
    from: { name: c.fromName, address: c.fromEmail },
    to: c.notifyTo,
    replyTo: { name: b.lead.name, address: b.lead.email },
    subject,
    text: lines.join('\n'),
    html,
  });
}
