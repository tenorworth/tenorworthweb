// Field calendar: types, labels, calendar links and the Supabase queries behind /events.
// Schema and access rules: supabase/migrations/20261013201542_field_calendar.sql.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { SECTORS } from './pipeline';

export const TZ = 'America/Los_Angeles';

export const CATEGORIES = [
  { id: 'sector', label: 'Sector events' },
  { id: 'networking', label: 'Networking' },
  { id: 'speaking', label: 'Speaker calls' },
] as const;

export type Category = (typeof CATEGORIES)[number]['id'];
export type Plan = 'going' | 'maybe' | 'skip';
export type RegistrationState = 'queued' | 'working' | 'needs_you' | 'sent' | 'registered' | 'failed';

export const PLANS: { id: Plan; label: string }[] = [
  { id: 'going', label: 'Going' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'skip', label: 'Skip' },
];

export const REGISTRATION_LABELS: Record<RegistrationState, string> = {
  queued: 'Queued for Claude',
  working: 'Claude is on it',
  needs_you: 'Needs you',
  sent: 'Request sent',
  registered: 'Registered',
  failed: "Couldn't register",
};

// Events use the pipeline's sector ids; null means general business.
export const sectorLabel = (id: string | null) =>
  id ? SECTORS.find((s) => s.id === id)?.label ?? id : 'General business';

export interface Registration {
  event_id: string;
  state: RegistrationState;
  note: string | null;
  requested_at: string;
  updated_at: string;
}

export interface FieldEvent {
  id: string;
  slug: string;
  title: string;
  org: string | null;
  category: Category;
  sector: string | null;
  starts_at: string; // San Diego wall-clock, "2026-10-15T17:30:00"
  ends_at: string | null;
  all_day: boolean;
  venue: string | null;
  address: string | null;
  url: string | null;
  price_usd: number | null;
  price_label: string | null;
  cost_detail: string | null;
  fit: string | null;
  source: string | null;
  found_on: string;
  plan: Plan | null;
  cancelled: boolean;
  registration: Registration | null;
}

export interface CalendarRun {
  id: string;
  ran_at: string;
  added: number;
  updated: number;
  removed: number;
  note: string | null;
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

type EventRow = Omit<FieldEvent, 'registration'> & {
  field_event_registrations: Registration | Registration[] | null;
};

export function useFieldEvents() {
  return useQuery({
    queryKey: ['field-events'],
    queryFn: async () => {
      const { data, error } = await db()
        .from('field_events')
        .select('*, field_event_registrations (*)')
        .order('starts_at', { ascending: true });
      fail(error);
      return (data as EventRow[]).map(({ field_event_registrations: r, ...ev }) => ({
        ...ev,
        registration: Array.isArray(r) ? r[0] ?? null : r,
      })) as FieldEvent[];
    },
    // The registration task writes back on its own schedule; keep its state fresh.
    refetchInterval: 60_000,
  });
}

export function useLastRun() {
  return useQuery({
    queryKey: ['field-calendar-run'],
    queryFn: async () => {
      const { data, error } = await db()
        .from('field_calendar_runs')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      fail(error);
      return data as CalendarRun | null;
    },
  });
}

// Optimistic patch of one event in the cached list.
function useEventPatch() {
  const qc = useQueryClient();
  return {
    async apply(id: string, patch: Partial<FieldEvent>) {
      await qc.cancelQueries({ queryKey: ['field-events'] });
      const before = qc.getQueryData<FieldEvent[]>(['field-events']);
      qc.setQueryData<FieldEvent[]>(['field-events'], (list) =>
        list?.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
      return { before };
    },
    restore(ctx?: { before?: FieldEvent[] }) {
      if (ctx?.before) qc.setQueryData(['field-events'], ctx.before);
    },
    settle() {
      qc.invalidateQueries({ queryKey: ['field-events'] });
    },
  };
}

export function useSetPlan() {
  const patch = useEventPatch();
  return useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: Plan | null }) => {
      const { error } = await db().from('field_events').update({ plan }).eq('id', id);
      fail(error);
    },
    onMutate: ({ id, plan }) => patch.apply(id, { plan }),
    onError: (_e, _v, ctx) => patch.restore(ctx),
    onSettled: () => patch.settle(),
  });
}

export function useQueueRegistration() {
  const patch = useEventPatch();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const now = new Date().toISOString();
      const { error } = await db()
        .from('field_event_registrations')
        .upsert({ event_id: eventId, state: 'queued', note: null, requested_at: now }, { onConflict: 'event_id' });
      fail(error);
    },
    onMutate: (eventId) => {
      const now = new Date().toISOString();
      return patch.apply(eventId, {
        registration: { event_id: eventId, state: 'queued', note: null, requested_at: now, updated_at: now },
      });
    },
    onError: (_e, _v, ctx) => patch.restore(ctx),
    onSettled: () => patch.settle(),
  });
}

export function useCancelRegistration() {
  const patch = useEventPatch();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await db().from('field_event_registrations').delete().eq('event_id', eventId);
      fail(error);
    },
    onMutate: (eventId) => patch.apply(eventId, { registration: null }),
    onError: (_e, _v, ctx) => patch.restore(ctx),
    onSettled: () => patch.settle(),
  });
}

// ── Dates ───────────────────────────────────────────────────────────────────
// starts_at / ends_at are San Diego wall-clock strings. Parse the digits as
// they are (into a UTC Date used only as a field holder), so the viewer's own
// timezone never shifts them.

export interface Parts { y: number; mo: number; d: number; h: number | null; mi: number }

export function parts(s: string | null): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s ?? '');
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] != null ? +m[4] : null, mi: m[5] != null ? +m[5] : 0 };
}

const asUTC = (p: Parts) => new Date(Date.UTC(p.y, p.mo - 1, p.d, p.h ?? 0, p.mi));
const pad = (n: number) => String(n).padStart(2, '0');

export function todaySD(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const isPast = (ev: FieldEvent, today: string) => (ev.ends_at ?? ev.starts_at).slice(0, 10) < today;

export function isNew(ev: FieldEvent, today: string): boolean {
  if (ev.plan) return false;
  const f = parts(ev.found_on), t = parts(today);
  return !!f && !!t && (asUTC(t).getTime() - asUTC(f).getTime()) / 86_400_000 <= 7;
}

export function weekday(ev: FieldEvent): string {
  const p = parts(ev.starts_at);
  return p ? asUTC(p).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) : '';
}

export function timeLabel(ev: FieldEvent): string {
  if (ev.category === 'speaking') return 'due';
  const p = parts(ev.starts_at);
  if (!p || ev.all_day || p.h == null) return 'all day';
  return `${p.h % 12 || 12}${p.mi ? `:${pad(p.mi)}` : ''}${p.h < 12 ? 'am' : 'pm'}`;
}

export function monthKey(ev: FieldEvent): string {
  return ev.starts_at.slice(0, 7);
}

export function monthLabel(key: string): string {
  const p = parts(`${key}-01`);
  return p ? asUTC(p).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : key;
}

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── Price ───────────────────────────────────────────────────────────────────

export function priceText(ev: FieldEvent): string {
  if (ev.price_label) return ev.price_label;
  if (ev.price_usd === 0) return 'Free';
  if (ev.price_usd != null) return `$${ev.price_usd.toLocaleString('en-US')}`;
  return 'Price TBD';
}

// Free / invite-only style labels read as words, not money.
export const isMoney = (label: string) => /^\$|^Free$/.test(label);
export const isGated = (ev: FieldEvent) =>
  /invite|approval|ask chapter|members only|partners only/i.test(ev.price_label ?? '');

// ── Calendar links ──────────────────────────────────────────────────────────

function span(ev: FieldEvent) {
  const sp = parts(ev.starts_at);
  if (!sp) return null;
  const allDay = ev.all_day || sp.h == null;
  const start = asUTC(sp);
  const ep = parts(ev.ends_at);
  let end = ep ? asUTC(ep) : null;
  if (allDay) end = new Date((end && end > start ? end : start).getTime() + 86_400_000);
  else if (!end || end <= start) end = new Date(start.getTime() + 90 * 60_000);
  return { start, end, allDay };
}

const stamp = (d: Date, allDay: boolean) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
  (allDay ? '' : `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`);

const isoLocal = (d: Date, allDay: boolean) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
  (allDay ? '' : `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`);

const calTitle = (ev: FieldEvent) => (ev.category === 'speaking' ? `Speaker application due: ${ev.title}` : ev.title);
export const location = (ev: FieldEvent) => [ev.venue, ev.address].filter(Boolean).join(', ');

function details(ev: FieldEvent): string {
  return [ev.fit, ev.org && `Host: ${ev.org}`, ev.cost_detail && `Tickets: ${ev.cost_detail}`, ev.url]
    .filter(Boolean)
    .join('\n');
}

export function googleCalendarUrl(ev: FieldEvent): string | null {
  const s = span(ev);
  if (!s) return null;
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: calTitle(ev),
    dates: `${stamp(s.start, s.allDay)}/${stamp(s.end, s.allDay)}`,
    details: details(ev),
    location: location(ev),
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function outlookUrl(ev: FieldEvent): string | null {
  const s = span(ev);
  if (!s) return null;
  const end = s.allDay ? new Date(s.end.getTime() - 86_400_000) : s.end;
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: calTitle(ev),
    startdt: isoLocal(s.start, s.allDay),
    enddt: isoLocal(end, s.allDay),
    body: details(ev),
    location: location(ev),
  });
  if (s.allDay) q.set('allday', 'true');
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q}`;
}
