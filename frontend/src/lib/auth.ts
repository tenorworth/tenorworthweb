import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// undefined while the stored session is being read, null when signed out.
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}

// Mirrors public.is_admin(). The database enforces it; this only decides what
// to render. app_metadata is set server side and cannot be edited by the user.
export const isAdmin = (session: Session | null | undefined) =>
  session?.user.app_metadata?.role === 'admin';
