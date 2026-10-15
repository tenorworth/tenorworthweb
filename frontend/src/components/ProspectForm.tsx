import { useState, type FormEvent, type ReactNode } from 'react';
import { MANUAL_SOURCES, OFFERS, SECTORS, useMetAtOptions, type Prospect, type ProspectInput } from '../lib/pipeline';

type Values = Record<
  'name' | 'email' | 'company' | 'title' | 'phone' | 'linkedin_url' | 'website' | 'sector' | 'offer' |
  'value_usd' | 'source' | 'met_at' | 'problems' | 'next_step' | 'next_step_due',
  string
>;

const toValues = (p?: Prospect | null): Values => ({
  name: p?.name ?? '',
  email: p?.email ?? '',
  company: p?.company ?? '',
  title: p?.title ?? '',
  phone: p?.phone ?? '',
  linkedin_url: p?.linkedin_url ?? '',
  website: p?.website ?? '',
  sector: p?.sector ?? '',
  offer: p?.offer ?? '',
  value_usd: p?.value_usd != null ? String(p.value_usd) : '',
  source: p?.source ?? '',
  met_at: p?.met_at ?? '',
  problems: p?.problems ?? '',
  next_step: p?.next_step ?? '',
  next_step_due: p?.next_step_due ?? '',
});

// "parkerriggs.com" is what people type; the column wants a linkable URL.
const toUrl = (s: string | null) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s);

// Empty strings become nulls so a cleared field clears the column.
function toInput(v: Values): ProspectInput & { name: string } {
  const val = (s: string) => s.trim() || null;
  const value = v.value_usd.replace(/[^0-9]/g, '');
  return {
    name: v.name.trim(),
    email: val(v.email)?.toLowerCase() ?? null,
    company: val(v.company),
    title: val(v.title),
    phone: val(v.phone),
    linkedin_url: val(v.linkedin_url),
    website: toUrl(val(v.website)),
    sector: val(v.sector),
    offer: val(v.offer),
    value_usd: value ? Number(value) : null,
    source: val(v.source),
    met_at: val(v.met_at),
    problems: val(v.problems),
    next_step: val(v.next_step),
    next_step_due: val(v.next_step_due),
  };
}

export default function ProspectForm({
  initial, submitLabel, pending, error, onSubmit, children, showSource,
}: {
  initial?: Prospect | null;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onSubmit: (input: ProspectInput & { name: string }) => void;
  children?: ReactNode;
  showSource: boolean;
}) {
  const [v, setV] = useState<Values>(() => toValues(initial));
  const { data: metAtOptions } = useMetAtOptions();
  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(toInput(v));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" id="name">
          <input id="name" className="field" required maxLength={120} value={v.name} onChange={set('name')} />
        </Field>
        <Field label="Email" id="email">
          <input id="email" className="field" type="email" maxLength={254} value={v.email} onChange={set('email')} />
        </Field>
        <Field label="Company" id="company">
          <input id="company" className="field" maxLength={120} value={v.company} onChange={set('company')} />
        </Field>
        <Field label="Title" id="title">
          <input id="title" className="field" maxLength={120} value={v.title} onChange={set('title')} />
        </Field>
        <Field label="Phone" id="phone">
          <input id="phone" className="field" type="tel" maxLength={40} value={v.phone} onChange={set('phone')} />
        </Field>
        <Field label="LinkedIn" id="linkedin_url">
          <input id="linkedin_url" className="field" type="url" placeholder="https://www.linkedin.com/in/…" value={v.linkedin_url} onChange={set('linkedin_url')} />
        </Field>
        <Field label="Website" id="website">
          <input id="website" className="field" inputMode="url" maxLength={192} placeholder="example.com" value={v.website} onChange={set('website')} />
        </Field>
        <Field label="Sector" id="sector">
          <select id="sector" className="field" value={v.sector} onChange={set('sector')}>
            <option value="">—</option>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Likely engagement" id="offer">
          <select id="offer" className="field" value={v.offer} onChange={set('offer')}>
            <option value="">—</option>
            {OFFERS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Estimated value (USD)" id="value_usd">
          <input id="value_usd" className="field" inputMode="numeric" placeholder="25000" value={v.value_usd} onChange={set('value_usd')} />
        </Field>
        {showSource && (
          <Field label="Source" id="source">
            <select id="source" className="field" value={v.source} onChange={set('source')}>
              <option value="">—</option>
              {MANUAL_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="Met at" id="met_at" wide>
          <input id="met_at" className="field" list="met_at_options" maxLength={200} placeholder="Event or place" value={v.met_at} onChange={set('met_at')} />
          <datalist id="met_at_options">
            {metAtOptions?.map((o) => <option key={o} value={o} />)}
          </datalist>
        </Field>
      </div>

      <Field label="Problems they face" id="problems">
        <textarea id="problems" className="field" rows={3} maxLength={5000} placeholder="What they said is hard, in their words where you can." value={v.problems} onChange={set('problems')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <Field label="Next step" id="next_step">
          <input id="next_step" className="field" maxLength={200} placeholder="Send the roadmap outline" value={v.next_step} onChange={set('next_step')} />
        </Field>
        <Field label="Due" id="next_step_due">
          <input id="next_step_due" className="field" type="date" value={v.next_step_due} onChange={set('next_step_due')} />
        </Field>
      </div>

      {children}

      {error && <p className="text-sm text-brass-deep">{error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button>
    </form>
  );
}

function Field({ label, id, wide = false, children }: { label: string; id: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
