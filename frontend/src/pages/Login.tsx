import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Email and password. Sign-ups are off in Supabase: accounts are created in the
// dashboard, never from this page (see supabase/README.md).
export default function Login() {
  const session = useSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/pipeline';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (session) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setPending(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    // Same message for an unknown address and a wrong password.
    if (error) setError(/invalid login credentials/i.test(error.message) ? 'That email and password do not match.' : error.message);
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <img src="/favicon.svg" alt="" className="h-10 w-10" />
      <p className="eyebrow mt-8">app.tenorworth.com</p>
      <h1 className="mt-3 text-3xl">Sign in</h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-brass-deep" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={!supabase || pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
        {!supabase && <p className="text-xs text-ink-muted">Supabase is not configured.</p>}
      </form>
    </main>
  );
}
