import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin, useSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Signed-in, admin-only layout route for the pipeline pages. Pages mount (and
// start querying) only once this has decided the viewer is an admin.
export default function Shell() {
  const session = useSession();
  const location = useLocation();

  if (!supabase) {
    return (
      <Centered>
        <p className="text-sm text-ink-muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill in the project keys.
        </p>
      </Centered>
    );
  }
  if (session === undefined) return <Centered><p className="text-sm text-ink-muted">Loading…</p></Centered>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const signOut = () => supabase?.auth.signOut();

  if (!isAdmin(session)) {
    return (
      <Centered>
        <h1 className="text-2xl">No access</h1>
        <p className="mt-3 text-sm text-ink-muted">
          {session.user.email} is signed in but does not have access to the pipeline.
        </p>
        <button type="button" className="btn-secondary mt-6" onClick={signOut}>Sign out</button>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-cream-line bg-cream">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/pipeline" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-lg">Tenorworth</span>
            <span className="eyebrow hidden sm:inline">Pipeline</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-muted md:inline">{session.user.email}</span>
            <button type="button" onClick={signOut} className="text-ink-muted hover:text-brass-deep">Sign out</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-md px-6 py-24">{children}</main>;
}
