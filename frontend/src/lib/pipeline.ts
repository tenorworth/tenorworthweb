// Prospect pipeline: types, labels and the Supabase queries behind /pipeline.
// Schema and access rules: supabase/migrations/20261007000000_pipeline.sql.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export const STAGES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'call_booked', label: 'Call booked' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'proposal', label: 'Proposal sent' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
] as const;

export type Stage = (typeof STAGES)[number]['id'];
export const OPEN_STAGES: Stage[] = ['new', 'contacted', 'call_booked', 'discovery', 'proposal'];
export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? s;

export const OFFERS = [
  { id: 'roadmap', label: 'AI Readiness Roadmap' },
  { id: 'pilot', label: 'Pilot' },
  { id: 'retainer', label: 'Fractional AI Architect' },
] as const;

// Same ids as INDUSTRY_IDS in marketing/src/config/industries.ts.
export const SECTORS = [
  { id: 'community-healthcare', label: 'Healthcare' },
  { id: 'credit-unions', label: 'Credit unions and RIAs' },
  { id: 'law-firms', label: 'Law firms' },
  { id: 'life-sciences', label: 'Life sciences' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'insurance', label: 'Insurance' },
] as const;

// Sources for prospects added by hand. Website leads carry the CTA's source.
export const MANUAL_SOURCES = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'event', label: 'Event' },
  { id: 'referral', label: 'Referral' },
  { id: 'other', label: 'Other' },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  ...Object.fromEntries(MANUAL_SOURCES.map((s) => [s.id, s.label])),
  card: 'Card',
  card_qr: 'Card (QR)',
  card_nfc: 'Card (NFC)',
  book_page: 'Website',
};

export function sourceLabel(source: string | null): string {
  if (!source) return 'Unknown';
  return SOURCE_LABELS[source] ?? `Website · ${source.replace(/_/g, ' ')}`;
}

export const sectorLabel = (id: string | null) => SECTORS.find((s) => s.id === id)?.label ?? null;
export const offerLabel = (id: string | null) => OFFERS.find((o) => o.id === id)?.label ?? null;

export interface Prospect {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  linkedin_url: string | null;
  sector: string | null;
  offer: string | null;
  value_usd: number | null;
  source: string | null;
  stage: Stage;
  stage_changed_at: string;
  next_step: string | null;
  next_step_due: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type ProspectInput = Partial<Omit<Prospect, 'id' | 'created_at' | 'updated_at' | 'stage_changed_at'>>;

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  source: string | null;
  timezone: string | null;
  created_at: string;
  bookings: Booking[];
}

export interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: 'confirmed' | 'cancelled';
  html_link: string | null;
  created_at: string;
}

export interface ProspectEvent {
  id: string;
  kind: 'note' | 'stage';
  body: string | null;
  from_stage: Stage | null;
  to_stage: Stage | null;
  author: string | null;
  created_at: string;
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function fail(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === '23505') throw new Error('A prospect with that email already exists.');
  throw new Error(error.message);
}

export function useProspects() {
  return useQuery({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await db()
        .from('prospects')
        .select('*')
        .order('stage_changed_at', { ascending: false });
      fail(error);
      return data as Prospect[];
    },
  });
}

export function useProspect(id: string) {
  return useQuery({
    queryKey: ['prospect', id],
    queryFn: async () => {
      const { data, error } = await db().from('prospects').select('*').eq('id', id).maybeSingle();
      fail(error);
      return data as Prospect | null;
    },
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const [leads, events] = await Promise.all([
        db()
          .from('leads')
          .select('id, name, email, company, message, source, timezone, created_at, bookings (id, start_at, end_at, status, html_link, created_at)')
          .eq('prospect_id', id)
          .order('created_at', { ascending: false }),
        db().from('prospect_events').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
      ]);
      fail(leads.error);
      fail(events.error);
      return { leads: leads.data as Lead[], events: events.data as ProspectEvent[] };
    },
  });
}

export function useUpdateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProspectInput }) => {
      const { data, error } = await db().from('prospects').update(patch).eq('id', id).select('*').single();
      fail(error);
      return data as Prospect;
    },
    // Move the card straight away; the refetch settles it.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['prospects'] });
      const before = qc.getQueryData<Prospect[]>(['prospects']);
      qc.setQueryData<Prospect[]>(['prospects'], (list) =>
        list?.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { before };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.before) qc.setQueryData(['prospects'], ctx.before);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospect', id] });
      qc.invalidateQueries({ queryKey: ['activity', id] });
    },
  });
}

export function useCreateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ prospect, note }: { prospect: ProspectInput & { name: string }; note?: string }) => {
      const { data, error } = await db().from('prospects').insert(prospect).select('*').single();
      fail(error);
      const created = data as Prospect;
      if (note) {
        const { error: noteErr } = await db()
          .from('prospect_events')
          .insert({ prospect_id: created.id, kind: 'note', body: note });
        fail(noteErr);
      }
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospects'] }),
  });
}

export function useDeleteProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('prospects').delete().eq('id', id);
      fail(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospects'] }),
  });
}

export function useAddNote(prospectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await db()
        .from('prospect_events')
        .insert({ prospect_id: prospectId, kind: 'note', body });
      fail(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity', prospectId] }),
  });
}

export function useDeleteNote(prospectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('prospect_events').delete().eq('id', id);
      fail(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity', prospectId] }),
  });
}

// ── Formatting ──────────────────────────────────────────────────────────────

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatUsd = (n: number) => usd.format(n);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

// next_step_due is a plain date; parse it as local midnight, not UTC.
const localDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDue = (ymd: string) =>
  localDate(ymd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function isOverdue(ymd: string | null): boolean {
  if (!ymd) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return localDate(ymd) < today;
}

export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
