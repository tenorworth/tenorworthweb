import { supabase } from '../lib/supabase';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass-deep">app.tenorworth.com</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight">Client portal</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        Scaffold for the Tenorworth client application. Same stack as SupremoAgent: React, Vite,
        TanStack Query, Tailwind, Supabase.
      </p>
      <p className="mt-8 rounded-md border border-cream-line bg-cream-deep/50 p-4 text-sm text-ink-muted">
        Supabase: {supabase ? 'configured' : 'not configured — copy .env.example to .env and fill in the project keys.'}
      </p>
    </main>
  );
}
