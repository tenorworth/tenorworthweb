import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Exported as `null` when unconfigured so the app renders (with a notice)
// instead of crashing on a fresh clone.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
