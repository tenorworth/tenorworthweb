import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SECTORS, daysSince, formatDue, isOverdue, sectorLabel } from '../lib/pipeline';
import {
  ACCOUNT_STATUSES, KINDS, formatAssets, formatCount, statusLabel, useAccounts, useCreateAccount,
  type AccountKind, type AccountRow,
} from '../lib/accounts';

type Sort = 'size' | 'due' | 'recent' | 'name';

const toUrl = (s: string) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s);

export default function Accounts() {
  const { data, isLoading, error } = useAccounts();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<AccountKind | ''>('buyer');
  const [sector, setSector] = useState('');
  const [tier, setTier] = useState('');
  const [county, setCounty] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<Sort>('size');
  const [adding, setAdding] = useState(false);

  const counties = useMemo(
    () => [...new Set((data ?? []).map((a) => a.county).filter((c): c is string => !!c))].sort(),
    [data],
  );

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = (data ?? []).filter((a) =>
      (!kind || a.kind === kind) &&
      (!sector || a.sector === sector) &&
      (!tier || String(a.tier ?? '') === tier) &&
      (!county || a.county === county) &&
      (!status || a.status === status) &&
      (!needle || [a.name, a.city, a.county, a.trigger, a.opening_line, a.notes].some((v) => v?.toLowerCase().includes(needle))),
    );
    const cmp: Record<Sort, (a: AccountRow, b: AccountRow) => number> = {
      size: (a, b) => (a.tier ?? 9) - (b.tier ?? 9) || (b.assets_usd ?? 0) - (a.assets_usd ?? 0) || a.name.localeCompare(b.name),
      due: (a, b) => (a.nextDue ?? '9999').localeCompare(b.nextDue ?? '9999') || a.name.localeCompare(b.name),
      recent: (a, b) => (b.lastTouch ?? '').localeCompare(a.lastTouch ?? '') || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(cmp[sort]);
  }, [data, search, kind, sector, tier, county, status, sort]);

  const people = shown.reduce((n, a) => n + a.people, 0);
  const untouched = shown.filter((a) => a.status === 'untouched').length;
  const dueNow = shown.filter((a) => a.nextDue && (isOverdue(a.nextDue) || a.nextDue === today())).length;

  return (
    <main className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Accounts</h1>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Stat label="Shown" value={String(shown.length)} />
            <Stat label="People" value={String(people)} />
            <Stat label="Untouched" value={String(untouched)} />
            <Stat label="Due today or overdue" value={String(dueNow)} accent={dueNow > 0} />
          </dl>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : 'Add account'}
        </button>
      </div>

      {adding && <AddAccount onDone={() => setAdding(false)} />}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="field max-w-xs"
          type="search"
          placeholder="Search name, city, trigger, notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search accounts"
        />
        <select className="field w-auto" value={kind} onChange={(e) => setKind(e.target.value as AccountKind | '')} aria-label="Kind">
          <option value="">Buyers and partners</option>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <select className="field w-auto" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector">
          <option value="">All sectors</option>
          {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="field w-auto" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier">
          <option value="">All tiers</option>
          <option value="1">Tier 1 · SD and OC</option>
          <option value="2">Tier 2 · LA, IE, Ventura</option>
        </select>
        {counties.length > 0 && (
          <select className="field w-auto" value={county} onChange={(e) => setCounty(e.target.value)} aria-label="County">
            <option value="">All counties</option>
            {counties.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          {ACCOUNT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="size">Tier, then size</option>
          <option value="due">Next due first</option>
          <option value="recent">Most recently touched</option>
          <option value="name">Name</option>
        </select>
      </div>

      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}
      {isLoading && <p className="mt-6 text-sm text-ink-muted">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <p className="mt-6 text-sm text-ink-muted">No accounts yet. Add one, and the prospects carrying that company name attach to it.</p>
      )}

      {shown.length > 0 && (
        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <table className="w-full min-w-[64rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cream-line text-left text-xs text-ink-muted">
                <th className="py-2 pr-4 font-medium">Account</th>
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">People</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Next due</th>
                <th className="py-2 pr-4 font-medium">Last touch</th>
                <th className="py-2 font-medium">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => <Row key={a.id} a={a} />)}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Row({ a }: { a: AccountRow }) {
  const overdue = isOverdue(a.nextDue);
  return (
    <tr className="border-b border-cream-line/70 align-top hover:bg-white/40">
      <td className="py-3 pr-4">
        <Link to={`/accounts/${a.id}`} className="font-medium hover:text-brass-deep">{a.name}</Link>
        <p className="mt-0.5 text-xs text-ink-muted">
          {[a.city, a.county && `${a.county} County`, a.tier && `Tier ${a.tier}`, a.kind === 'partner' ? 'Partner' : sectorLabel(a.sector)].filter(Boolean).join(' · ')}
        </p>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        {a.assets_usd != null && <p>{formatAssets(a.assets_usd)}</p>}
        <p className="text-xs text-ink-muted">
          {[a.members != null && `${formatCount(a.members)} members`, a.employees != null && `${formatCount(a.employees)} staff`].filter(Boolean).join(' · ')}
        </p>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <p>{a.people}{a.open !== a.people && <span className="text-ink-muted"> · {a.open} open</span>}</p>
        {a.furthest > 0 && <p className="text-xs text-ink-muted">touch {a.furthest} reached</p>}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <StatusChip status={a.status} />
      </td>
      <td className={`py-3 pr-4 whitespace-nowrap ${overdue ? 'font-medium text-brass-deep' : ''}`}>
        {a.nextDue ? `${overdue ? 'Overdue · ' : ''}${formatDue(a.nextDue)}` : <span className="text-ink-muted">—</span>}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap text-ink-muted">
        {a.lastTouch ? ago(a.lastTouch) : '—'}
      </td>
      <td className="py-3 max-w-md">
        {a.trigger ? <p className="line-clamp-2 text-xs text-ink-muted" title={a.trigger}>{a.trigger}</p> : <span className="text-xs text-ink-muted">—</span>}
      </td>
    </tr>
  );
}

export function StatusChip({ status }: { status: AccountRow['status'] }) {
  const tone =
    status === 'client' ? 'border-ink bg-ink text-cream'
    : status === 'replied' || status === 'meeting' ? 'border-brass bg-brass/10 text-brass-deep'
    : status === 'paused' || status === 'lost' ? 'border-cream-line text-ink-muted'
    : 'border-cream-line bg-white/60 text-ink';
  return <span className={`inline-block rounded-md border px-2 py-0.5 text-xs ${tone}`}>{statusLabel(status)}</span>;
}

function AddAccount({ onDone }: { onDone: () => void }) {
  const create = useCreateAccount();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('buyer');
  const [sector, setSector] = useState('credit-unions');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), kind, sector: sector || null, city: city.trim() || null, website: toUrl(website.trim()) || null },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-lg border border-cream-line bg-cream-deep/50 p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:items-end">
      <div>
        <label className="label" htmlFor="acc-name">Name</label>
        <input id="acc-name" className="field" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="acc-kind">Kind</label>
        <select id="acc-kind" className="field" value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
          <option value="buyer">Buyer</option>
          <option value="partner">Referral partner</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="acc-sector">Sector</label>
        <select id="acc-sector" className="field" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">General</option>
          {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="acc-city">City</label>
        <input id="acc-city" className="field" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="acc-site">Website</label>
        <input id="acc-site" className="field" maxLength={200} placeholder="example.org" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-secondary" disabled={create.isPending || !name.trim()}>Save</button>
      </div>
      {create.error && <p className="text-sm text-brass-deep sm:col-span-6">{create.error.message}</p>}
    </form>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`font-medium ${accent ? 'text-brass-deep' : ''}`}>{value}</dd>
    </div>
  );
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ago(iso: string): string {
  const d = daysSince(iso);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;
}
