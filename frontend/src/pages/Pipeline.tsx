import { useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import {
  OPEN_STAGES, SECTORS, STAGES, daysSince, formatDue, formatUsd, isOverdue, sectorLabel, sourceLabel,
  useFindPhotos, useProspects, useUpdateProspect, type Prospect, type Stage,
} from '../lib/pipeline';

export default function Pipeline() {
  const { data: prospects, isLoading, error } = useProspects();
  const update = useUpdateProspect();
  const photos = useFindPhotos(prospects);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [source, setSource] = useState('');
  const [metAt, setMetAt] = useState('');
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const sources = useMemo(
    () => [...new Set((prospects ?? []).map((p) => p.source ?? ''))].sort(),
    [prospects],
  );

  const metAts = useMemo(
    () => [...new Set((prospects ?? []).map((p) => p.met_at).filter((m): m is string => !!m))].sort(),
    [prospects],
  );

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (prospects ?? []).filter((p) =>
      (!sector || p.sector === sector) &&
      (!source || (p.source ?? '') === source) &&
      (!metAt || p.met_at === metAt) &&
      (!needle || [p.name, p.company, p.email, p.met_at, p.problems].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [prospects, search, sector, source, metAt]);

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
        <div className="flex flex-wrap items-center justify-end gap-3">
          <PhotoSearch photos={photos} />
          <Link to="/pipeline/new" className="btn-primary">Add prospect</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="field max-w-xs"
          type="search"
          placeholder="Search name, company, problems"
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
        {metAts.length > 0 && (
          <select className="field w-auto max-w-xs" value={metAt} onChange={(e) => setMetAt(e.target.value)} aria-label="Met at">
            <option value="">Met anywhere</option>
            {metAts.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
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
        <div className="flex items-start gap-2.5">
          <Avatar name={p.name} url={p.photo_url} size={36} />
          <div className="min-w-0">
            <p className="font-medium leading-snug">{p.name}</p>
            {(p.company || p.sector) && (
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {[p.company, sectorLabel(p.sector)].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {p.problems && <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted" title={p.problems}>{p.problems}</p>}
        {p.next_step && !closed && (
          <p className={`mt-2 text-xs ${overdue ? 'font-medium text-brass-deep' : 'text-ink'}`}>
            {overdue ? 'Overdue: ' : ''}{p.next_step}
            {p.next_step_due && <span className="text-ink-muted"> · {formatDue(p.next_step_due)}</span>}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span className="truncate" title={p.met_at ?? undefined}>{p.met_at ?? sourceLabel(p.source)}</span>
          <span className="shrink-0">
            {p.value_usd ? `${formatUsd(p.value_usd)} · ` : ''}{daysSince(p.stage_changed_at)}d
          </span>
        </div>
      </Link>
    </li>
  );
}

function PhotoSearch({ photos }: { photos: ReturnType<typeof useFindPhotos> }) {
  const { run, remaining, start, stop } = photos;
  if (run?.active) {
    return (
      <p className="flex items-center gap-3 text-sm text-ink-muted" aria-live="polite">
        <span>
          Finding photos {run.done} of {run.total} · {run.found} found{run.failed > 0 && ` · ${run.failed} skipped`}
        </span>
        <button type="button" onClick={stop} className="hover:text-brass-deep">Stop</button>
      </p>
    );
  }
  return (
    <>
      {run && (
        <p className={`text-sm ${run.error ? 'text-brass-deep' : 'text-ink-muted'}`} aria-live="polite">
          {run.error
            ? `Stopped: ${run.error}`
            : `Found ${run.found} of ${run.done}${run.failed > 0 ? ` · ${run.failed} skipped, run again to retry` : ''}`}
        </p>
      )}
      {remaining > 0 && (
        <button
          type="button"
          onClick={start}
          className="btn-secondary"
          title="Looks for each person's headshot on Gravatar and their company website"
        >
          Find photos <span className="ml-1.5 font-normal text-ink-muted">{remaining}</span>
        </button>
      )}
    </>
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
