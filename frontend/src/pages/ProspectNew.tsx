import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProspectForm from '../components/ProspectForm';
import Shell from '../components/Shell';
import { STAGES, useCreateProspect, type Stage } from '../lib/pipeline';

// For people met off the website: LinkedIn, events, referrals.
export default function ProspectNew() {
  const create = useCreateProspect();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('new');
  const [note, setNote] = useState('');

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/pipeline" className="text-sm text-ink-muted hover:text-brass-deep">← Pipeline</Link>
        <h1 className="mt-4 text-3xl">Add prospect</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Website enquiries are added on their own. Use this for everyone else.
        </p>

        <div className="mt-8">
          <ProspectForm
            submitLabel="Add prospect"
            showSource
            pending={create.isPending}
            error={create.error?.message}
            onSubmit={(input) =>
              create.mutate(
                { prospect: { ...input, stage }, note: note.trim() || undefined },
                { onSuccess: (p) => navigate(`/pipeline/${p.id}`) },
              )
            }
          >
            <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
              <div>
                <label className="label" htmlFor="stage">Stage</label>
                <select id="stage" className="field" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="note">First note</label>
                <textarea
                  id="note"
                  className="field"
                  rows={3}
                  maxLength={5000}
                  placeholder="Where you met, what they care about."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </ProspectForm>
        </div>
      </main>
    </Shell>
  );
}
