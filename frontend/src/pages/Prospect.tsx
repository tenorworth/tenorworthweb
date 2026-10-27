import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import ProspectForm from '../components/ProspectForm';
import { useAccountName } from '../lib/accounts';
import {
  MANUAL_SOURCES, STAGES, daysSince, formatDateTime, formatUsd, needsPhotoSearch, offerLabel, sectorLabel,
  sourceLabel, stageLabel, useActivity, useAddNote, useDeleteNote, useDeleteProspect, useFindPhoto, useProspect,
  useUpdateProspect, type Lead, type Prospect as P, type ProspectEvent,
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
    p.met_at && `Met at ${p.met_at}`,
  ].filter(Boolean);

  function destroy() {
    const ok = window.confirm(
      `Delete ${p.name}? This also deletes their website form submissions and booking records. It cannot be undone.`,
    );
    if (ok) remove.mutate(p.id, { onSuccess: () => navigate('/pipeline') });
  }

  return (
    <>
      <div className="mt-4 flex items-start gap-4 sm:gap-5">
        <Avatar name={p.name} url={p.photo_url} size={72} />
        <div className="min-w-0">
          <h1 className="text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {[p.title, p.company].filter(Boolean).join(', ') || 'No company yet'}
            <AccountLink id={p.account_id} />
          </p>
          <p className="mt-2 text-xs text-ink-muted">{facts.join(' · ')}</p>
          <Photo p={p} />
          <ContactLinks p={p} />
          {p.problems && <p className="mt-4 max-w-2xl whitespace-pre-wrap border-l-2 border-brass pl-3 text-sm">{p.problems}</p>}
        </div>
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

function AccountLink({ id }: { id: string | null }) {
  const { data } = useAccountName(id);
  if (!data) return null;
  return (
    <>
      {' · '}
      <Link to={`/accounts/${data.id}`} className="text-brass-deep underline-offset-2 hover:underline">Account</Link>
    </>
  );
}

// Where the photo came from, with a search the first time the prospect is
// opened ("Find photos" on the pipeline does everyone at once), and a way to
// paste an image link instead. Kept out of the details form, whose values are
// read once and would put back an empty photo after a search fills one.
function Photo({ p }: { p: P }) {
  const find = useFindPhoto();
  const update = useUpdateProspect();
  const searched = useRef(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (searched.current || !needsPhotoSearch(p)) return;
    searched.current = true;
    find.mutate(p.id);
  }, [p, find]);

  const action = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="underline-offset-2 hover:text-brass-deep hover:underline">{label}</button>
  );
  const sourceHost = p.photo_source && /^https?:\/\//.test(p.photo_source)
    ? new URL(p.photo_source).hostname.replace(/^www\./, '')
    : null;

  let status: ReactNode;
  if (find.isPending) status = 'Looking for a photo…';
  else if (p.photo_url) {
    status = p.photo_source === 'gravatar' ? 'Photo from Gravatar'
      : sourceHost ? <>Photo from <a href={p.photo_source!} target="_blank" rel="noreferrer" className="text-brass-deep underline-offset-2 hover:underline">{sourceHost}</a></>
      : 'Photo added by hand';
  } else status = p.photo_checked_at ? 'No photo found' : 'No photo';

  if (link !== null) {
    const save = (e: FormEvent) => {
      e.preventDefault();
      update.mutate(
        { id: p.id, patch: { photo_url: link.trim() || null, photo_source: null } },
        { onSuccess: () => setLink(null) },
      );
    };
    return (
      <form onSubmit={save} className="mt-2 flex max-w-xl flex-wrap items-center gap-2 text-xs">
        <input
          className="field min-w-0 flex-1 py-1.5 text-xs"
          type="url"
          pattern="https://.*"
          maxLength={2000}
          placeholder="https://… link to an image of them"
          aria-label="Photo link"
          autoFocus
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs" disabled={update.isPending}>Save</button>
        <button type="button" onClick={() => setLink(null)} className="text-ink-muted hover:text-brass-deep">Cancel</button>
        {update.error && <span className="w-full text-brass-deep">{update.error.message}</span>}
      </form>
    );
  }

  const idle = !find.isPending;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      <span>{status}</span>
      {idle && (p.website || p.email) && action(p.photo_checked_at || p.photo_url ? 'Search again' : 'Find photo', () => find.mutate(p.id))}
      {idle && action('Use a link', () => setLink(p.photo_url ?? ''))}
      {idle && p.photo_url && action('Remove', () => update.mutate({ id: p.id, patch: { photo_url: null, photo_source: null } }))}
      {find.error && <span className="text-brass-deep">{find.error.message}</span>}
    </p>
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
    p.website && /^https?:\/\//.test(p.website) && { href: p.website, label: p.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') },
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
