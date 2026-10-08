import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProspectForm from '../components/ProspectForm';
import {
  MANUAL_SOURCES, STAGES, daysSince, formatDateTime, formatUsd, offerLabel, sectorLabel, sourceLabel, stageLabel,
  useActivity, useAddNote, useDeleteNote, useDeleteProspect, useProspect, useUpdateProspect,
  type Lead, type Prospect as P, type ProspectEvent,
} from '../lib/pipeline';

export default function Prospect() {
  const { id = '' } = useParams();
  const { data: p, isLoading, error } = useProspect(id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/pipeline" className="text-sm text-ink-muted hover:text-brass-deep">← Pipeline</Link>
      {isLoading && <p className="mt-6 text-sm text-ink-muted">Loading…</p>}
      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}
      {!isLoading && !error && !p && <p className="mt-6 text-sm text-ink-muted">This prospect no longer exists.</p>}
      {p && <Detail key={p.id} p={p} />}
    </main>
  );
}

function Detail({ p }: { p: P }) {
  const update = useUpdateProspect();
  const remove = useDeleteProspect();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const manualSource = !p.source || MANUAL_SOURCES.some((s) => s.id === p.source);

  const facts = [
    sectorLabel(p.sector),
    offerLabel(p.offer),
    p.value_usd ? formatUsd(p.value_usd) : null,
    sourceLabel(p.source),
  ].filter(Boolean);

  function destroy() {
    const ok = window.confirm(
      `Delete ${p.name}? This also deletes their website form submissions and booking records. It cannot be undone.`,
    );
    if (ok) remove.mutate(p.id, { onSuccess: () => navigate('/pipeline') });
  }

  return (
    <>
      <div className="mt-4">
        <h1 className="text-3xl">{p.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {[p.title, p.company].filter(Boolean).join(', ') || 'No company yet'}
        </p>
        <p className="mt-2 text-xs text-ink-muted">{facts.join(' · ')}</p>
        <ContactLinks p={p} />
      </div>

      <section className="mt-6" aria-label="Stage">
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={p.stage === s.id}
              onClick={() => p.stage !== s.id && update.mutate({ id: p.id, patch: { stage: s.id } })}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                p.stage === s.id
                  ? 'border-ink bg-ink text-cream'
                  : 'border-cream-line bg-white/50 text-ink-muted hover:border-brass hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {stageLabel(p.stage)} {inStageFor(p.stage_changed_at)}
        </p>
        {p.stage === 'lost' && <LostReason p={p} />}
      </section>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <section aria-labelledby="details">
          <h2 id="details" className="text-xl">Details</h2>
          <div className="mt-4">
            <ProspectForm
              initial={p}
              submitLabel={saved ? 'Saved' : 'Save changes'}
              showSource={manualSource}
              pending={update.isPending}
              error={update.error?.message}
              onSubmit={(input) =>
                update.mutate(
                  { id: p.id, patch: input },
                  { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
                )
              }
            />
          </div>
          <div className="mt-12 border-t border-cream-line pt-6">
            <button type="button" onClick={destroy} className="text-sm text-ink-muted hover:text-brass-deep">
              Delete prospect
            </button>
            {remove.error && <p className="mt-2 text-sm text-brass-deep">{remove.error.message}</p>}
          </div>
        </section>

        <Activity p={p} />
      </div>
    </>
  );
}

function inStageFor(iso: string): string {
  const d = daysSince(iso);
  return d === 0 ? 'since today' : `for ${d} ${d === 1 ? 'day' : 'days'}`;
}

function ContactLinks({ p }: { p: P }) {
  const links = [
    p.email && { href: `mailto:${p.email}`, label: p.email },
    p.phone && { href: `tel:${p.phone.replace(/[^+0-9]/g, '')}`, label: p.phone },
    p.linkedin_url && /^https:\/\//.test(p.linkedin_url) && { href: p.linkedin_url, label: 'LinkedIn' },
  ].filter(Boolean) as { href: string; label: string }[];
  if (!links.length) return null;
  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((l) => (
        <a key={l.href} href={l.href} className="text-brass-deep underline-offset-2 hover:underline" target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {l.label}
        </a>
      ))}
    </p>
  );
}

function LostReason({ p }: { p: P }) {
  const update = useUpdateProspect();
  const [reason, setReason] = useState(p.lost_reason ?? '');
  const save = () => {
    const next = reason.trim() || null;
    if (next !== p.lost_reason) update.mutate({ id: p.id, patch: { lost_reason: next } });
  };
  return (
    <div className="mt-3 max-w-md">
      <label className="label" htmlFor="lost_reason">Why lost</label>
      <input
        id="lost_reason"
        className="field"
        maxLength={200}
        placeholder="Budget, timing, chose another firm…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}

type Item =
  | { at: string; kind: 'lead'; lead: Lead }
  | { at: string; kind: 'booking'; lead: Lead; booking: Lead['bookings'][number] }
  | { at: string; kind: 'event'; event: ProspectEvent }
  | { at: string; kind: 'added' };

function Activity({ p }: { p: P }) {
  const { data, isLoading, error } = useActivity(p.id);
  const addNote = useAddNote(p.id);
  const deleteNote = useDeleteNote(p.id);
  const [note, setNote] = useState('');

  function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    const body = note.trim();
    if (body) addNote.mutate(body, { onSuccess: () => setNote('') });
  }

  const items: Item[] = [];
  for (const lead of data?.leads ?? []) {
    items.push({ at: lead.created_at, kind: 'lead', lead });
    for (const booking of lead.bookings) items.push({ at: booking.created_at, kind: 'booking', lead, booking });
  }
  for (const event of data?.events ?? []) items.push({ at: event.created_at, kind: 'event', event });
  // Prospects added by hand have no form submission to mark their start.
  if (data && !data.leads.length) items.push({ at: p.created_at, kind: 'added' });
  items.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section aria-labelledby="activity">
      <h2 id="activity" className="text-xl">Activity</h2>

      <form onSubmit={submit} className="mt-4">
        <label className="label" htmlFor="note">Add a note</label>
        <textarea
          id="note"
          className="field"
          rows={3}
          maxLength={5000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e); }}
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="submit" className="btn-secondary" disabled={addNote.isPending || !note.trim()}>Add note</button>
          {addNote.error && <span className="text-sm text-brass-deep">{addNote.error.message}</span>}
        </div>
      </form>

      {isLoading && <p className="mt-6 text-sm text-ink-muted">Loading…</p>}
      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}

      <ol className="mt-6 space-y-5 border-l border-cream-line pl-5">
        {items.map((item) => {
          switch (item.kind) {
            case 'lead':
              return (
                <Entry key={`l${item.lead.id}`} at={item.at} title={`Website form · ${sourceLabel(item.lead.source)}`}>
                  {item.lead.company && <p className="text-ink-muted">{item.lead.company}</p>}
                  {item.lead.message && <p className="mt-1 whitespace-pre-wrap">{item.lead.message}</p>}
                  {item.lead.timezone && <p className="mt-1 text-xs text-ink-muted">Time zone: {item.lead.timezone}</p>}
                </Entry>
              );
            case 'booking':
              return (
                <Entry key={`b${item.booking.id}`} at={item.at} title="Intro call booked" accent>
                  <p>
                    {formatDateTime(item.booking.start_at)}
                    {item.booking.status === 'cancelled' && <span className="text-ink-muted"> · cancelled</span>}
                  </p>
                  {item.booking.html_link && (
                    <a href={item.booking.html_link} target="_blank" rel="noreferrer" className="text-xs text-brass-deep hover:underline">
                      Open in Google Calendar
                    </a>
                  )}
                </Entry>
              );
            case 'event':
              return item.event.kind === 'stage' ? (
                <Entry key={item.event.id} at={item.at} title={`${item.event.from_stage ? stageLabel(item.event.from_stage) : '—'} → ${stageLabel(item.event.to_stage!)}`}>
                  {!item.event.author && <p className="text-xs text-ink-muted">Automatic</p>}
                </Entry>
              ) : (
                <Entry key={item.event.id} at={item.at} title="Note">
                  <p className="whitespace-pre-wrap">{item.event.body}</p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-ink-muted hover:text-brass-deep"
                    onClick={() => window.confirm('Delete this note?') && deleteNote.mutate(item.event.id)}
                  >
                    Delete
                  </button>
                </Entry>
              );
            case 'added':
              return <Entry key="added" at={item.at} title={`Added · ${sourceLabel(p.source)}`} />;
          }
        })}
      </ol>
    </section>
  );
}

function Entry({ at, title, accent = false, children }: { at: string; title: string; accent?: boolean; children?: ReactNode }) {
  return (
    <li className="relative text-sm">
      <span className={`absolute -left-[1.53rem] top-1.5 h-2 w-2 rounded-full ${accent ? 'bg-brass' : 'bg-cream-line'}`} aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="text-xs text-ink-muted">{formatDateTime(at)}</p>
      {children && <div className="mt-1.5">{children}</div>}
    </li>
  );
}
