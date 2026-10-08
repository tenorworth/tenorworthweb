import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Email magic link. shouldCreateUser is off: accounts are created in the
// Supabase dashboard, never from this form (see supabase/README.md).
export default function Login() {
  const session = useSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/pipeline';
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  if (session) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setState('sending');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}${from}` },
    });
    // An unknown address comes back as "Signups not allowed". Do not say which
    // addresses exist: that case looks the same as success.
    if (error && !/signups not allowed/i.test(error.message)) {
      setError(error.message);
      setState('idle');
      return;
    }
    setState('sent');
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <img src="/favicon.svg" alt="" className="h-10 w-10" />
      <p className="eyebrow mt-8">app.tenorworth.com</p>
      <h1 className="mt-3 text-3xl">Sign in</h1>

      {state === 'sent' ? (
        <p className="mt-6 text-sm leading-relaxed text-ink-muted">
          If <span className="text-ink">{email}</span> has an account, a sign-in link is on its way.
          Open it on this device.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-brass-deep">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={!supabase || state === 'sending'}>
            {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {!supabase && <p className="text-xs text-ink-muted">Supabase is not configured.</p>}
        </form>
      )}
    </main>
  );
}
