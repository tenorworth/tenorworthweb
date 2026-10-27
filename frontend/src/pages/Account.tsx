import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  STAGES, formatDateTime, formatDue, isOverdue, sectorLabel, useUpdateProspect,
  type Prospect as P, type Stage,
} from '../lib/pipeline';
import {
  ACCOUNT_STATUSES, CHANNELS, SEQUENCE, channelLabel, formatAssets, formatCount, hostOf,
  useAccount, useAddPerson, useAddTouch, useDeleteAccount, useDeleteTouch, useUpdateAccount,
  type Account as A, type AccountStatus, type Touch, type TouchChannel,
} from '../lib/accounts';
import {
  PARTNER_PERSONAS, cuDraft, firstName, linkedinSearch, mailto, partnerDraft,
  type Audience, type Draft, type PartnerPersona,
} from '../lib/outreach';
import { ago } from './Accounts';

type Step = 1 | 2 | 3 | 4;

export default function Account() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useAccount(id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/accounts" className="text-sm text-ink-muted hover:text-brass-deep">← Accounts</Link>
      {isLoading && <p className="mt-6 text-sm text-ink-muted">Loading…</p>}
      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}
      {!isLoading && !error && data && !data.account && <p className="mt-6 text-sm text-ink-muted">This account no longer exists.</p>}
      {data?.account && <Detail key={data.account.id} a={data.account} people={data.people} touches={data.touches} />}
    </main>
  );
}

function Detail({ a, people, touches }: { a: A; people: P[]; touches: Touch[] }) {
  const update = useUpdateAccount(a.id);
  const remove = useDeleteAccount();
  const navigate = useNavigate();
  const [compose, setCompose] = useState<{ p: P; step: Step } | null>(null);
  const [logFor, setLogFor] = useState<P | null>(null);

  const facts = [
    a.kind === 'partner' ? 'Referral partner' : sectorLabel(a.sector),
    a.tier && `Tier ${a.tier}`,
    [a.city, a.county && `${a.county} County`].filter(Boolean).join(', '),
    a.assets_usd != null && `${formatAssets(a.assets_usd)} assets`,
    a.members != null && `${formatCount(a.members)} members`,
    a.employees != null && `${formatCount(a.employees)} staff`,
    a.branches != null && `${a.branches} ${a.branches === 1 ? 'branch' : 'branches'}`,
    a.charter && `Charter ${a.charter}`,
    a.list_name,
  ].filter(Boolean);

  function destroy() {
    const ok = window.confirm(`Delete ${a.name}? The people stay in the pipeline; only the account record and its link to them go.`);
    if (ok) remove.mutate(a.id, { onSuccess: () => navigate('/accounts') });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl">{a.name}</h1>
          <p className="mt-2 text-xs text-ink-muted">{facts.join(' · ')}</p>
          <Links a={a} />
        </div>
        <label className="text-sm">
          <span className="label">Status</span>
          <select
            className="field w-auto"
            value={a.status}
            onChange={(e) => update.mutate({ status: e.target.value as AccountStatus })}
          >
            {ACCOUNT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
      {update.error && <p className="mt-3 text-sm text-brass-deep">{update.error.message}</p>}

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-10">
          <OpeningLine a={a} />

          <section aria-labelledby="people">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="people" className="text-xl">People <span className="text-base text-ink-muted">{people.length}</span></h2>
              <p className="text-xs text-ink-muted">
                Sequence: note → email in 3 days → founding-client email 8 days later → close 10 days after that.
              </p>
            </div>
            {people.length === 0 && (
              <p className="mt-3 text-sm text-ink-muted">Nobody attached yet. Add a person below, or add a prospect whose company is "{a.name}".</p>
            )}
            <ul className="mt-4 divide-y divide-cream-line border-y border-cream-line">
              {people.map((p) => (
                <Person
                  key={p.id}
                  p={p}
                  onCompose={(step) => { setLogFor(null); setCompose({ p, step }); }}
                  onLog={() => { setCompose(null); setLogFor(p); }}
                />
              ))}
            </ul>
            <AddPerson a={a} />
          </section>

          {compose && (
            <Composer
              key={`${compose.p.id}-${compose.step}`}
              a={a}
              p={compose.p}
              initialStep={compose.step}
              onClose={() => setCompose(null)}
            />
          )}

          {logFor && <LogTouch a={a} p={logFor} people={people} onClose={() => setLogFor(null)} />}

          <div className="border-t border-cream-line pt-6">
            <button type="button" onClick={destroy} className="text-sm text-ink-muted hover:text-brass-deep">Delete account</button>
            {remove.error && <p className="mt-2 text-sm text-brass-deep">{remove.error.message}</p>}
          </div>
        </div>

        <Timeline a={a} touches={touches} />
      </div>
    </>
  );
}

function Links({ a }: { a: A }) {
  const links = [
    a.website && /^https?:\/\//.test(a.website) && { href: a.website, label: hostOf(a.website) },
    a.linkedin_url && /^https?:\/\//.test(a.linkedin_url) && { href: a.linkedin_url, label: 'LinkedIn' },
    a.phone && { href: `tel:${a.phone.replace(/[^+0-9]/g, '')}`, label: a.phone },
    a.address && { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`, label: a.address },
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

// The trigger is what the research found; the opening line is the sentence the templates
// insert. Nothing goes out without one, so it sits at the top.
function OpeningLine({ a }: { a: A }) {
  const update = useUpdateAccount(a.id);
  const [trigger, setTrigger] = useState(a.trigger ?? '');
  const [line, setLine] = useState(a.opening_line ?? '');
  const [notes, setNotes] = useState(a.notes ?? '');
  const [saved, setSaved] = useState(false);
  const dirty = trigger !== (a.trigger ?? '') || line !== (a.opening_line ?? '') || notes !== (a.notes ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    update.mutate(
      { trigger: trigger.trim() || null, opening_line: line.trim() || null, notes: notes.trim() || null },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-cream-line bg-cream-deep/40 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="trigger">Trigger (what the research found)</label>
          <textarea id="trigger" className="field" rows={3} maxLength={2000} value={trigger} onChange={(e) => setTrigger(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="opening">Opening line (goes into touch 1 and 2 verbatim)</label>
          <textarea
            id="opening"
            className="field"
            rows={3}
            maxLength={600}
            placeholder='e.g. "Your careers page has two contact-center openings and a compliance analyst role open at the same time."'
            value={line}
            onChange={(e) => setLine(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink-muted">{line.length}/600{!line.trim() && ' · the templates show a placeholder until this is written'}</p>
        </div>
      </div>
      <div className="mt-3">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" className="field" rows={2} maxLength={10000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className="btn-secondary" disabled={update.isPending || !dirty}>{saved ? 'Saved' : 'Save'}</button>
        {update.error && <span className="text-sm text-brass-deep">{update.error.message}</span>}
      </div>
    </form>
  );
}

function Person({ p, onCompose, onLog }: { p: P; onCompose: (step: Step) => void; onLog: () => void }) {
  const update = useUpdateProspect();
  const next = Math.min((p.sequence_step ?? 0) + 1, 4) as Step;
  const done = (p.sequence_step ?? 0) >= 4;
  const closed = p.stage === 'won' || p.stage === 'lost';
  const overdue = isOverdue(p.next_step_due);
  return (
    <li className="grid gap-3 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <Link to={`/pipeline/${p.id}`} className="font-medium hover:text-brass-deep">{p.name}</Link>
        {p.title && <p className="truncate text-xs text-ink-muted" title={p.title}>{p.title}</p>}
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-muted">
          {p.email && <a href={`mailto:${p.email}`} className="hover:text-brass-deep">{p.email}</a>}
          {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-brass-deep">LinkedIn</a>}
          {!p.email && !p.linkedin_url && <span>No email or LinkedIn yet</span>}
        </p>
      </div>
      <div className="text-xs">
        <select
          className="field w-auto py-1 text-xs"
          value={p.stage}
          aria-label={`Stage for ${p.name}`}
          onChange={(e) => update.mutate({ id: p.id, patch: { stage: e.target.value as Stage } })}
        >
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <p className="mt-1.5">
          <span className="text-ink-muted">Touch {p.sequence_step ?? 0} of 4</span>
          {p.last_touch_at && <span className="text-ink-muted"> · last {ago(p.last_touch_at)}</span>}
        </p>
        {p.next_step && !closed && (
          <p className={`mt-0.5 ${overdue ? 'font-medium text-brass-deep' : ''}`}>
            {overdue ? 'Overdue: ' : ''}{p.next_step}
            {p.next_step_due && <span className="text-ink-muted"> · {formatDue(p.next_step_due)}</span>}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {!done && !closed && (
          <button type="button" className="btn-primary px-3 py-1.5" onClick={() => onCompose(next)}>
            Compose touch {next}
          </button>
        )}
        <button type="button" className="btn-secondary px-3 py-1.5" onClick={onLog}>Log reply or call</button>
      </div>
    </li>
  );
}

function AddPerson({ a }: { a: A }) {
  const add = useAddPerson(a);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    add.mutate(
      {
        name: name.trim(),
        title: title.trim() || null,
        email: email.trim().toLowerCase() || null,
        linkedin_url: linkedin.trim() || null,
      },
      { onSuccess: () => { setName(''); setTitle(''); setEmail(''); setLinkedin(''); setOpen(false); } },
    );
  }

  if (!open) {
    return <button type="button" className="mt-3 text-sm text-brass-deep hover:underline" onClick={() => setOpen(true)}>Add a person</button>;
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1.4fr_1.2fr_1.2fr_auto] sm:items-end">
      <div>
        <label className="label" htmlFor="np-name">Name</label>
        <input id="np-name" className="field" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="np-title">Title</label>
        <input id="np-title" className="field" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="np-email">Email</label>
        <input id="np-email" className="field" type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="np-li">LinkedIn URL</label>
        <input id="np-li" className="field" maxLength={200} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-secondary" disabled={add.isPending || !name.trim()}>Add</button>
        <button type="button" className="text-sm text-ink-muted hover:text-brass-deep" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {add.error && <p className="text-sm text-brass-deep sm:col-span-5">{add.error.message}</p>}
    </form>
  );
}

// ── Composer ────────────────────────────────────────────────────────────────

const guessAudience = (title: string | null): Audience =>
  /risk|compliance|audit|bsa/i.test(title ?? '') ? 'risk'
  : /information|technology|digital|cio|cto|systems/i.test(title ?? '') ? 'tech'
  : 'exec';

function readRate(): string {
  try { return localStorage.getItem('tw.foundingRate') || '[fee]'; } catch { return '[fee]'; }
}

function Composer({ a, p, initialStep, onClose }: { a: A; p: P; initialStep: Step; onClose: () => void }) {
  const addTouch = useAddTouch(a.id);
  const updateProspect = useUpdateProspect();
  const [step, setStep] = useState<Step>(initialStep);
  const [audience, setAudience] = useState<Audience>(() => guessAudience(p.title));
  const [persona, setPersona] = useState<PartnerPersona>('msp');
  const [rate, setRate] = useState(readRate);
  const [email, setEmail] = useState(p.email ?? '');
  const [copied, setCopied] = useState(false);

  const draft: Draft = useMemo(() => {
    const ctx = { firstName: firstName(p.name), orgName: a.name, specificLine: a.opening_line, sector: a.sector, foundingRate: rate };
    return a.kind === 'partner' ? partnerDraft(step, ctx, persona) : cuDraft(step, ctx, audience);
  }, [a, p.name, step, audience, persona, rate]);

  const [subject, setSubject] = useState(draft.subject ?? '');
  const [body, setBody] = useState(draft.body);
  useEffect(() => { setSubject(draft.subject ?? ''); setBody(draft.body); }, [draft]);

  const isEmail = draft.channel === 'email';
  const over = draft.limit != null && body.length > draft.limit;
  const linkedinHref = p.linkedin_url || linkedinSearch(p.name, a.name);

  function saveRate(v: string) {
    setRate(v);
    try { localStorage.setItem('tw.foundingRate', v); } catch { /* private window */ }
  }

  function saveEmailIfChanged() {
    const next = email.trim().toLowerCase() || null;
    if (next !== (p.email ?? null)) updateProspect.mutate({ id: p.id, patch: { email: next } });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked; the textarea is selectable */ }
  }

  function markSent() {
    addTouch.mutate(
      { prospect_id: p.id, channel: draft.channel, direction: 'out', step, subject: isEmail ? subject.trim() || null : null, body },
      { onSuccess: onClose },
    );
  }

  return (
    <section aria-labelledby="composer" className="rounded-lg border border-brass/60 bg-white/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="composer" className="text-xl">{draft.title} <span className="text-base text-ink-muted">to {p.name}</span></h2>
        <button type="button" className="text-sm text-ink-muted hover:text-brass-deep" onClick={onClose}>Close</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="label">Step</span>
          <select className="field w-auto" value={step} onChange={(e) => setStep(Number(e.target.value) as Step)}>
            {SEQUENCE.map((s) => <option key={s.step} value={s.step}>{s.step}. {s.label}</option>)}
          </select>
        </label>
        {a.kind === 'partner' ? (
          <label className="text-sm">
            <span className="label">Their firm</span>
            <select className="field w-auto" value={persona} onChange={(e) => setPersona(e.target.value as PartnerPersona)}>
              {PARTNER_PERSONAS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>
        ) : (
          <label className="text-sm">
            <span className="label">Reader</span>
            <select className="field w-auto" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
              <option value="exec">CEO or operations executive</option>
              <option value="risk">Risk or compliance executive</option>
              <option value="tech">Technology executive</option>
            </select>
          </label>
        )}
        {a.kind !== 'partner' && step === 3 && (
          <label className="text-sm">
            <span className="label">Founding rate</span>
            <input className="field w-32" value={rate} onChange={(e) => saveRate(e.target.value)} />
          </label>
        )}
      </div>

      {!a.opening_line?.trim() && (
        <p className="mt-3 rounded-md border border-brass/50 bg-brass/10 px-3 py-2 text-xs text-brass-deep">
          No opening line on this account yet. Write it in the box above and save; the template inserts it where the placeholder is.
        </p>
      )}

      {isEmail && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="c-to">To</label>
            <input id="c-to" className="field" type="email" placeholder="their address" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={saveEmailIfChanged} />
          </div>
          <div>
            <label className="label" htmlFor="c-subject">Subject</label>
            <input id="c-subject" className="field" maxLength={300} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mt-3">
        <label className="label" htmlFor="c-body">{isEmail ? 'Body' : 'Note'}</label>
        <textarea id="c-body" className="field font-mono text-xs leading-relaxed" rows={isEmail ? 18 : 6} maxLength={10000} value={body} onChange={(e) => setBody(e.target.value)} />
        <p className={`mt-1 text-xs ${over ? 'font-medium text-brass-deep' : 'text-ink-muted'}`}>
          {body.length}{draft.limit ? ` / ${draft.limit} characters` : ' characters'}
          {over && ' · too long for a LinkedIn connection note'}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
        {isEmail ? (
          <a
            className={`btn-secondary ${email.trim() ? '' : 'pointer-events-none opacity-50'}`}
            href={mailto(email.trim() || null, subject, body)}
            onClick={saveEmailIfChanged}
            aria-disabled={!email.trim()}
          >
            Open in Mail
          </a>
        ) : (
          <a className="btn-secondary" href={linkedinHref} target="_blank" rel="noreferrer">
            {p.linkedin_url ? 'Open their LinkedIn' : 'Find them on LinkedIn'}
          </a>
        )}
        <button type="button" className="btn-primary" onClick={markSent} disabled={addTouch.isPending || over}>
          Mark as sent
        </button>
        <button type="button" className="text-sm text-ink-muted hover:text-brass-deep" onClick={() => { setSubject(draft.subject ?? ''); setBody(draft.body); }}>
          Reset to template
        </button>
        {addTouch.error && <span className="text-sm text-brass-deep">{addTouch.error.message}</span>}
      </div>
      {isEmail && !email.trim() && (
        <p className="mt-2 text-xs text-ink-muted">Add their address to open it in Mail, or copy the text into any client. Marking it sent records the touch and sets the next step either way.</p>
      )}
    </section>
  );
}

// ── Replies, calls and meetings ─────────────────────────────────────────────

function LogTouch({ a, p: initial, people, onClose }: { a: A; p: P; people: P[]; onClose: () => void }) {
  const addTouch = useAddTouch(a.id);
  const [prospectId, setProspectId] = useState(initial.id);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [channel, setChannel] = useState<TouchChannel>('email');
  const [body, setBody] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    addTouch.mutate(
      { prospect_id: prospectId, channel, direction, step: null, body: body.trim() || null },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-cream-line bg-white/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl">Log a reply, call or meeting</h2>
        <button type="button" className="text-sm text-ink-muted hover:text-brass-deep" onClick={onClose}>Close</button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="label">Person</span>
          <select className="field" value={prospectId} onChange={(e) => setProspectId(e.target.value)}>
            {people.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="label">What happened</span>
          <select className="field" value={direction} onChange={(e) => setDirection(e.target.value as 'in' | 'out')}>
            <option value="in">They replied or called</option>
            <option value="out">I called, met or wrote outside the sequence</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="label">Channel</span>
          <select className="field" value={channel} onChange={(e) => setChannel(e.target.value as TouchChannel)}>
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3">
        <label className="label" htmlFor="log-body">What they said, or what you said</label>
        <textarea id="log-body" className="field" rows={4} maxLength={10000} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={addTouch.isPending}>Log it</button>
        {direction === 'in' && <span className="text-xs text-ink-muted">A reply sets the next step to answering it today and marks the account replied.</span>}
        {addTouch.error && <span className="text-sm text-brass-deep">{addTouch.error.message}</span>}
      </div>
    </form>
  );
}

// ── Timeline ────────────────────────────────────────────────────────────────

function Timeline({ a, touches }: { a: A; touches: Touch[] }) {
  const remove = useDeleteTouch(a.id);
  return (
    <section aria-labelledby="timeline">
      <h2 id="timeline" className="text-xl">Touches <span className="text-base text-ink-muted">{touches.length}</span></h2>
      {touches.length === 0 && <p className="mt-3 text-sm text-ink-muted">Nothing logged yet. Composing a touch and marking it sent records it here.</p>}
      <ol className="mt-6 space-y-5 border-l border-cream-line pl-5">
        {touches.map((t) => (
          <Entry
            key={t.id}
            at={t.happened_at}
            accent={t.direction === 'in'}
            title={`${t.prospects?.name ?? 'Someone'} · ${t.direction === 'in' ? 'replied' : 'sent'} · ${channelLabel(t.channel)}${t.step ? ` · touch ${t.step}` : ''}`}
          >
            {t.subject && <p className="font-medium">{t.subject}</p>}
            {t.body && <Body text={t.body} />}
            <button
              type="button"
              className="mt-1 text-xs text-ink-muted hover:text-brass-deep"
              onClick={() => window.confirm('Delete this touch? The next step it set stays as it is.') && remove.mutate(t.id)}
            >
              Delete
            </button>
          </Entry>
        ))}
      </ol>
      {remove.error && <p className="mt-3 text-sm text-brass-deep">{remove.error.message}</p>}
    </section>
  );
}

function Body({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280;
  return (
    <div>
      <p className="whitespace-pre-wrap text-ink-muted">{open || !long ? text : `${text.slice(0, 280)}…`}</p>
      {long && (
        <button type="button" className="mt-1 text-xs text-brass-deep hover:underline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Less' : 'Show all'}
        </button>
      )}
    </div>
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

