import { useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  OPEN_STAGES, SECTORS, STAGES, daysSince, formatDue, formatUsd, isOverdue, sectorLabel, sourceLabel,
  useProspects, useUpdateProspect, type Prospect, type Stage,
} from '../lib/pipeline';

export default function Pipeline() {
  const { data: prospects, isLoading, error } = useProspects();
  const update = useUpdateProspect();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [source, setSource] = useState('');
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const sources = useMemo(
    () => [...new Set((prospects ?? []).map((p) => p.source ?? ''))].sort(),
    [prospects],
  );

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (prospects ?? []).filter((p) =>
      (!sector || p.sector === sector) &&
      (!source || (p.source ?? '') === source) &&
      (!needle || [p.name, p.company, p.email].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [prospects, search, sector, source]);

  const open = (prospects ?? []).filter((p) => OPEN_STAGES.includes(p.stage));
  const openValue = open.reduce((sum, p) => sum + (p.value_usd ?? 0), 0);
  const overdue = open.filter((p) => isOverdue(p.next_step_due)).length;

  function onDrop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const p = prospects?.find((x) => x.id === id);
    if (p && p.stage !== stage) update.mutate({ id, patch: { stage } });
  }

  return (
    <main className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Pipeline</h1>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Stat label="Open" value={String(open.length)} />
            <Stat label="Open value" value={formatUsd(openValue)} />
            <Stat label="Overdue next steps" value={String(overdue)} accent={overdue > 0} />
          </dl>
        </div>
        <Link to="/pipeline/new" className="btn-primary">Add prospect</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="field max-w-xs"
          type="search"
          placeholder="Search name, company, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search prospects"
        />
        <select className="field w-auto" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector">
          <option value="">All sectors</option>
          {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="field w-auto" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{sourceLabel(s || null)}</option>)}
        </select>
      </div>

      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}
      {update.error && <p className="mt-6 text-sm text-brass-deep">Could not move that card: {update.error.message}</p>}

      <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-3">
          {STAGES.map(({ id, label }) => {
            const cards = shown.filter((p) => p.stage === id);
            const value = cards.reduce((sum, p) => sum + (p.value_usd ?? 0), 0);
            return (
              <section
                key={id}
                aria-label={label}
                onDragOver={(e) => { e.preventDefault(); setDragOver(id); }}
                onDragLeave={() => setDragOver((s) => (s === id ? null : s))}
                onDrop={(e) => onDrop(e, id)}
                className={`flex w-64 shrink-0 flex-col rounded-lg border p-2 transition ${
                  dragOver === id ? 'border-brass bg-cream-deep' : 'border-cream-line bg-cream-deep/50'
                }`}
              >
                <header className="flex items-baseline justify-between px-1.5 pb-2 pt-1">
                  <h2 className="font-sans text-sm font-semibold tracking-normal">
                    {label} <span className="font-normal text-ink-muted">{cards.length}</span>
                  </h2>
                  {value > 0 && <span className="text-xs text-ink-muted">{formatUsd(value)}</span>}
                </header>
                <ol className="flex min-h-24 flex-col gap-2">
                  {cards.map((p) => <Card key={p.id} p={p} />)}
                </ol>
              </section>
            );
          })}
        </div>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {!isLoading && prospects?.length === 0 && (
        <p className="text-sm text-ink-muted">
          No prospects yet. Website enquiries appear here on their own; add anyone else by hand.
        </p>
      )}
    </main>
  );
}

function Card({ p }: { p: Prospect }) {
  const overdue = isOverdue(p.next_step_due);
  const closed = p.stage === 'won' || p.stage === 'lost';
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', p.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded-md border border-cream-line bg-white/70 shadow-sm transition hover:border-brass active:cursor-grabbing"
    >
      <Link to={`/pipeline/${p.id}`} className="block p-3" draggable={false}>
        <p className="font-medium leading-snug">{p.name}</p>
        {(p.company || p.sector) && (
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {[p.company, sectorLabel(p.sector)].filter(Boolean).join(' · ')}
          </p>
        )}
        {p.next_step && !closed && (
          <p className={`mt-2 text-xs ${overdue ? 'font-medium text-brass-deep' : 'text-ink'}`}>
            {overdue ? 'Overdue: ' : ''}{p.next_step}
            {p.next_step_due && <span className="text-ink-muted"> · {formatDue(p.next_step_due)}</span>}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span className="truncate">{sourceLabel(p.source)}</span>
          <span className="shrink-0">
            {p.value_usd ? `${formatUsd(p.value_usd)} · ` : ''}{daysSince(p.stage_changed_at)}d
          </span>
        </div>
      </Link>
    </li>
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
