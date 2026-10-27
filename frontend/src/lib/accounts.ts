// Accounts: organisations we sell to or partner with, the people attached to them, and the
// log of touches that drives the outreach sequence. Schema and access rules:
// supabase/migrations/20261026120000_accounts_touches.sql.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Prospect, ProspectInput, Stage } from './pipeline';

export type AccountKind = 'buyer' | 'partner';
export type AccountStatus = 'untouched' | 'working' | 'replied' | 'meeting' | 'client' | 'paused' | 'lost';
export type TouchChannel = 'linkedin_note' | 'linkedin_dm' | 'email' | 'phone' | 'meeting' | 'other';
export type Direction = 'out' | 'in';

export const KINDS: { id: AccountKind; label: string }[] = [
  { id: 'buyer', label: 'Buyers' },
  { id: 'partner', label: 'Referral partners' },
];

export const ACCOUNT_STATUSES: { id: AccountStatus; label: string }[] = [
  { id: 'untouched', label: 'Untouched' },
  { id: 'working', label: 'Working' },
  { id: 'replied', label: 'Replied' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'client', label: 'Client' },
  { id: 'paused', label: 'Paused' },
  { id: 'lost', label: 'Lost' },
];

export const CHANNELS: { id: TouchChannel; label: string }[] = [
  { id: 'linkedin_note', label: 'LinkedIn note' },
  { id: 'linkedin_dm', label: 'LinkedIn message' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'other', label: 'Other' },
];

export const statusLabel = (s: AccountStatus) => ACCOUNT_STATUSES.find((x) => x.id === s)?.label ?? s;
export const channelLabel = (c: TouchChannel) => CHANNELS.find((x) => x.id === c)?.label ?? c;

// The outbound sequence, as the database trigger applies it when a touch is logged.
export const SEQUENCE: { step: 1 | 2 | 3 | 4; label: string; channel: TouchChannel; daysAfterPrevious: number }[] = [
  { step: 1, label: 'LinkedIn note', channel: 'linkedin_note', daysAfterPrevious: 0 },
  { step: 2, label: 'Email', channel: 'email', daysAfterPrevious: 3 },
  { step: 3, label: 'Founding-client email', channel: 'email', daysAfterPrevious: 8 },
  { step: 4, label: 'Close', channel: 'email', daysAfterPrevious: 10 },
];

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  status: AccountStatus;
  sector: string | null;
  tier: number | null;
  county: string | null;
  city: string | null;
  state: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  linkedin_url: string | null;
  charter: string | null;
  assets_usd: number | null;
  members: number | null;
  employees: number | null;
  branches: number | null;
  trigger: string | null;
  opening_line: string | null;
  notes: string | null;
  list_name: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountInput = Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;

export interface Touch {
  id: string;
  prospect_id: string;
  account_id: string | null;
  channel: TouchChannel;
  direction: Direction;
  step: number | null;
  subject: string | null;
  body: string | null;
  happened_at: string;
  author: string | null;
  created_at: string;
  prospects?: { name: string } | null;   // embedded by the account query
}

export interface TouchInput {
  prospect_id: string;
  channel: TouchChannel;
  direction: Direction;
  step?: number | null;
  subject?: string | null;
  body?: string | null;
  happened_at?: string;
}

// A row on the accounts list: the account plus what its people are up to.
export interface AccountRow extends Account {
  people: number;
  open: number;
  nextDue: string | null;      // earliest next_step_due among open people
  lastTouch: string | null;    // latest last_touch_at among people
  furthest: number;            // highest sequence step reached
  stages: Partial<Record<Stage, number>>;
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function fail(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === '23505') throw new Error('An account with that name (or charter number) already exists.');
  throw new Error(error.message);
}

type PersonSummary = Pick<Prospect, 'id' | 'account_id' | 'stage' | 'next_step_due' | 'last_touch_at' | 'sequence_step'>;

const OPEN: Stage[] = ['new', 'contacted', 'call_booked', 'discovery', 'proposal'];

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const [accounts, people] = await Promise.all([
        db().from('accounts').select('*').order('name'),
        db().from('prospects').select('id, account_id, stage, next_step_due, last_touch_at, sequence_step').not('account_id', 'is', null),
      ]);
      fail(accounts.error);
      fail(people.error);
      const byAccount = new Map<string, PersonSummary[]>();
      for (const p of people.data as PersonSummary[]) {
        const list = byAccount.get(p.account_id!) ?? [];
        list.push(p);
        byAccount.set(p.account_id!, list);
      }
      return (accounts.data as Account[]).map((a): AccountRow => {
        const ps = byAccount.get(a.id) ?? [];
        const open = ps.filter((p) => OPEN.includes(p.stage));
        const dues = open.map((p) => p.next_step_due).filter((d): d is string => !!d).sort();
        const touches = ps.map((p) => p.last_touch_at).filter((d): d is string => !!d).sort();
        const stages: Partial<Record<Stage, number>> = {};
        for (const p of ps) stages[p.stage] = (stages[p.stage] ?? 0) + 1;
        return {
          ...a,
          people: ps.length,
          open: open.length,
          nextDue: dues[0] ?? null,
          lastTouch: touches[touches.length - 1] ?? null,
          furthest: ps.reduce((m, p) => Math.max(m, p.sequence_step ?? 0), 0),
          stages,
        };
      });
    },
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const [account, people, touches] = await Promise.all([
        db().from('accounts').select('*').eq('id', id).maybeSingle(),
        db().from('prospects').select('*').eq('account_id', id).order('created_at'),
        db().from('touches').select('*, prospects (name)').eq('account_id', id).order('happened_at', { ascending: false }),
      ]);
      fail(account.error);
      fail(people.error);
      fail(touches.error);
      return {
        account: account.data as Account | null,
        people: people.data as Prospect[],
        touches: touches.data as Touch[],
      };
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountInput & { name: string }) => {
      const { data, error } = await db().from('accounts').insert(input).select('*').single();
      fail(error);
      return data as Account;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
    },
  });
}

export function useUpdateAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: AccountInput) => {
      const { data, error } = await db().from('accounts').update(patch).eq('id', id).select('*').single();
      fail(error);
      return data as Account;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['account', id] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('accounts').delete().eq('id', id);
      fail(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
    },
  });
}

// People under an account are ordinary prospects; the account's name is their company so the
// attach-by-name trigger links them even if account_id were left out.
export function useAddPerson(account: Account) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProspectInput & { name: string }) => {
      const row = {
        account_id: account.id,
        company: account.name,
        sector: account.sector,
        source: 'other',
        met_at: account.list_name,
        ...input,
      };
      const { data, error } = await db().from('prospects').insert(row).select('*').single();
      fail(error);
      return data as Prospect;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account', account.id] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
    },
  });
}

export function useAddTouch(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TouchInput) => {
      const { data, error } = await db().from('touches').insert(input).select('*').single();
      fail(error);
      return data as Touch;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['account', accountId] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospect', input.prospect_id] });
      qc.invalidateQueries({ queryKey: ['activity', input.prospect_id] });
    },
  });
}

export function useDeleteTouch(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('touches').delete().eq('id', id);
      fail(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account', accountId] }),
  });
}

// For the prospect page: the account a person belongs to.
export function useAccountName(id: string | null) {
  return useQuery({
    queryKey: ['account-name', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db().from('accounts').select('id, name').eq('id', id!).maybeSingle();
      fail(error);
      return data as { id: string; name: string } | null;
    },
  });
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function formatAssets(n: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

export const formatCount = (n: number | null) => (n == null ? '' : n.toLocaleString('en-US'));

export const hostOf = (url: string | null) =>
  url ? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '';
