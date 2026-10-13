import { useMemo, useState } from 'react';
import {
  CATEGORIES, PLANS, REGISTRATION_LABELS, formatShortDate, googleCalendarUrl, isGated, isMoney, isNew, isPast,
  location, monthKey, monthLabel, outlookUrl, parts, priceText, sectorLabel, timeLabel, todaySD, useCancelRegistration,
  useFieldEvents, useLastRun, useQueueRegistration, useSetPlan, weekday, type Category, type FieldEvent, type Plan,
  type RegistrationState,
} from '../lib/events';
import { SECTORS } from '../lib/pipeline';

type Show = 'open' | Plan | 'past';

const SHOWS: { id: Show; label: string }[] = [
  { id: 'open', label: 'Upcoming' },
  { id: 'going', label: 'Going' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'skip', label: 'Skipped' },
  { id: 'past', label: 'Past' },
];

const PRICE_CAPS = [
  { id: '', label: 'Any price' },
  { id: '0', label: 'Free' },
  { id: '50', label: 'Under $50' },
  { id: '100', label: 'Under $100' },
  { id: '250', label: 'Under $250' },
];

export default function Events() {
  const { data: events, isLoading, error } = useFieldEvents();
  const { data: lastRun } = useLastRun();
  const setPlan = useSetPlan();
  const queue = useQueueRegistration();
  const cancel = useCancelRegistration();

  const [category, setCategory] = useState<Category | ''>('');
  const [show, setShow] = useState<Show>('open');
  const [sector, setSector] = useState('');
  const [priceCap, setPriceCap] = useState('');

  const today = todaySD();
  const all = events ?? [];
  const upcoming = all.filter((e) => !isPast(e, today));
  const open = upcoming.filter((e) => e.plan !== 'skip');

  const shown = useMemo(() => {
    const list = all.filter((e) => {
      if (category && e.category !== category) return false;
      if (sector && (e.sector ?? 'general') !== sector) return false;
      if (priceCap !== '') {
        if (e.price_usd == null) return false;
        const cap = Number(priceCap);
        if (cap === 0 ? e.price_usd !== 0 : e.price_usd >= cap) return false;
      }
      const past = isPast(e, today);
      if (show === 'past') return past;
      if (past) return false;
      return show === 'open' ? e.plan !== 'skip' : e.plan === show;
    });
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return show === 'past' ? list.reverse() : list;
  }, [all, category, sector, priceCap, show, today]);

  const months = useMemo(() => {
    const m = new Map<string, FieldEvent[]>();
    for (const e of shown) m.set(monthKey(e), [...(m.get(monthKey(e)) ?? []), e]);
    return [...m];
  }, [shown]);

  const mutationError = setPlan.error ?? queue.error ?? cancel.error;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl">Field calendar</h1>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Stat label="Upcoming" value={String(upcoming.length)} />
          <Stat label="Going" value={String(upcoming.filter((e) => e.plan === 'going').length)} />
          <Stat label="New this week" value={String(upcoming.filter((e) => isNew(e, today)).length)} />
          {lastRun && <Stat label="Last search" value={formatShortDate(lastRun.ran_at)} />}
        </dl>
        {lastRun?.note && <p className="mt-2 max-w-2xl text-xs text-ink-muted">{lastRun.note}</p>}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
          <Pill active={category === ''} onClick={() => setCategory('')} count={open.length}>All</Pill>
          {CATEGORIES.map((c) => (
            <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}
              count={open.filter((e) => e.category === c.id).length}>{c.label}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {SHOWS.map((s) => (
            <Pill key={s.id} active={show === s.id} onClick={() => setShow(s.id)}>{s.label}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="field w-auto" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector">
            <option value="">All sectors</option>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            <option value="general">General business</option>
          </select>
          <select className="field w-auto" value={priceCap} onChange={(e) => setPriceCap(e.target.value)} aria-label="Price">
            {PRICE_CAPS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-brass-deep">{(error as Error).message}</p>}
      {mutationError && <p className="mt-6 text-sm text-brass-deep">Could not save that: {mutationError.message}</p>}
      {isLoading && <p className="mt-8 text-sm text-ink-muted">Loading…</p>}

      {!isLoading && !error && all.length === 0 && (
        <Empty title="No events yet.">
          The weekly search runs Monday mornings and adds San Diego sector events, business mixers and speaker calls here.
        </Empty>
      )}
      {!isLoading && all.length > 0 && shown.length === 0 && (
        <Empty title="Nothing matches these filters.">Try “All” types, another sector or any price.</Empty>
      )}

      {months.map(([key, list]) => (
        <section key={key} className="mt-8">
          <h2 className="border-b border-cream-line pb-1.5 text-xl">{monthLabel(key)}</h2>
          <ol>
            {list.map((e) => (
              <EventRow
                key={e.id}
                ev={e}
                today={today}
                onPlan={(plan) => setPlan.mutate({ id: e.id, plan: e.plan === plan ? null : plan })}
                onQueue={() => queue.mutate(e.id)}
                onCancel={() => cancel.mutate(e.id)}
              />
            ))}
          </ol>
        </section>
      ))}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ink-muted">
        Times are San Diego local. “Add to Google Calendar” opens a pre-filled event; nothing is added until you save it
        there. “Ask Claude to register” queues the event: Claude picks up the queue weekdays at 9am and 2pm, fills the
        form or writes the request email from hi@tenorworth.com, and asks you before anything is submitted, sent or paid.
      </p>
    </main>
  );
}

function EventRow({ ev, today, onPlan, onQueue, onCancel }: {
  ev: FieldEvent;
  today: string;
  onPlan: (plan: Plan) => void;
  onQueue: () => void;
  onCancel: () => void;
}) {
  const p = parts(ev.starts_at);
  const price = priceText(ev);
  const money = isMoney(price);
  const gcal = googleCalendarUrl(ev);
  const outlook = outlookUrl(ev);
  const where = [ev.org, location(ev)].filter(Boolean).join(' · ');
  const reg = ev.registration;
  const canQueue = !isPast(ev, today) && !ev.cancelled && (!reg || reg.state === 'failed');
  const queueLabel = reg ? 'Try again'
    : ev.category === 'speaking' ? 'Ask Claude to apply'
    : isGated(ev) ? 'Ask Claude to request a spot'
    : 'Ask Claude to register';

  return (
    <li className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-cream-line py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4 ${ev.plan === 'skip' ? 'opacity-50' : ''}`}>
      <div className="self-start border-r border-dashed border-cream-line pr-3 text-center">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">{weekday(ev)}</div>
        <div className="font-display text-2xl leading-tight tabular-nums sm:text-3xl">{p?.d ?? '?'}</div>
        <div className="text-xs tabular-nums text-ink-muted">{timeLabel(ev)}</div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-sans text-base font-semibold leading-snug tracking-normal">
            {ev.cancelled && <span className="text-brass-deep">Cancelled: </span>}
            {ev.url ? <a href={ev.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-brass">{ev.title}</a> : ev.title}
          </h3>
          <div className="shrink-0 text-right">
            <div className={money
              ? `font-display text-xl leading-tight tabular-nums ${price === 'Free' ? 'text-brass-deep' : ''}`
              : 'pt-0.5 text-[13px] font-semibold text-ink-muted'}>{price}</div>
            {money && price !== 'Free' && (
              <div className="text-[11px] text-ink-muted">{ev.category === 'speaking' ? 'to apply' : 'non-member'}</div>
            )}
          </div>
        </div>

        {where && <p className="text-sm text-ink-muted">{where}</p>}
        {ev.fit && <p className="text-sm">{ev.fit}</p>}
        {ev.cost_detail && <p className="text-[13px] text-ink-muted"><span className="font-semibold text-ink">Tickets:</span> {ev.cost_detail}</p>}

        <div className="flex flex-wrap gap-1.5">
          {isNew(ev, today) && <Tag tone="new">New</Tag>}
          <Tag>{ev.category === 'speaking' ? 'Deadline' : CATEGORIES.find((c) => c.id === ev.category)?.label.replace(/s$/, '')}</Tag>
          <Tag>{sectorLabel(ev.sector)}</Tag>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {gcal && <a className="btn-primary px-3 py-1.5" href={gcal} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>}
          {outlook && <a className="btn-secondary px-3 py-1.5" href={outlook} target="_blank" rel="noopener noreferrer">Outlook</a>}
          {ev.url && <a className="btn-secondary px-3 py-1.5" href={ev.url} target="_blank" rel="noopener noreferrer">{ev.category === 'speaking' ? 'Apply' : 'Register'}</a>}
          {canQueue && (
            <button type="button" className="btn-secondary border-dashed px-3 py-1.5" onClick={onQueue}>{queueLabel}</button>
          )}
          <div className="inline-flex overflow-hidden rounded-md border border-cream-line sm:ml-auto" role="group" aria-label="My plan">
            {PLANS.map((pl) => (
              <button
                key={pl.id}
                type="button"
                aria-pressed={ev.plan === pl.id}
                onClick={() => onPlan(pl.id)}
                className={`px-2.5 py-1 text-xs transition border-l border-cream-line first:border-l-0 ${
                  ev.plan === pl.id
                    ? pl.id === 'going' ? 'bg-ink text-cream' : pl.id === 'maybe' ? 'bg-cream-deep text-ink' : 'bg-ink-muted text-cream'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >{pl.label}</button>
            ))}
          </div>
        </div>

        {reg && (
          <div role="status" className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-md bg-cream-deep px-2.5 py-2 text-[13px]">
            <span className={`text-xs font-semibold uppercase tracking-[0.04em] ${STATE_TONE[reg.state]}`}>
              {REGISTRATION_LABELS[reg.state]}
            </span>
            {reg.note && <span className="min-w-0 break-words text-ink-muted">{reg.note}</span>}
            {reg.state !== 'queued' && <span className="text-ink-muted">· {formatShortDate(reg.updated_at)}</span>}
            {reg.state === 'queued' && (
              <button type="button" onClick={onCancel} className="ml-auto text-xs text-brass-deep underline">Cancel</button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

const STATE_TONE: Record<RegistrationState, string> = {
  queued: 'text-brass-deep',
  working: 'text-brass-deep',
  needs_you: 'text-ink',
  sent: 'text-ink',
  registered: 'text-ink',
  failed: 'text-ink-muted',
};

function Pill({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[13px] transition ${
        active ? 'border-ink bg-ink text-cream' : 'border-cream-line hover:border-brass'
      }`}
    >
      {children}
      {count != null && <span className="ml-1 tabular-nums opacity-60">{count}</span>}
    </button>
  );
}

function Tag({ tone, children }: { tone?: 'new'; children: string | undefined }) {
  return (
    <span className={`rounded px-2 py-0.5 text-[11.5px] ${
      tone === 'new' ? 'border border-brass font-semibold text-brass-deep' : 'bg-cream-deep text-ink-muted'
    }`}>{children}</span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Empty({ title, children }: { title: string; children: string }) {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-cream-line p-6 text-sm text-ink-muted">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
