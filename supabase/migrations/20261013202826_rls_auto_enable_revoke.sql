-- public.rls_auto_enable() backs the `ensure_rls` event trigger, which turns on
-- row level security for every table created in `public`. It was created in
-- the dashboard, not by a migration, and as a SECURITY DEFINER function in an
-- exposed schema it was executable by anon and authenticated through
-- /rest/v1/rpc/rls_auto_enable (security advisor, 2026-10-13).
--
-- Event triggers fire without an EXECUTE check, so revoking it keeps
-- `ensure_rls` working and takes the function off the API.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
