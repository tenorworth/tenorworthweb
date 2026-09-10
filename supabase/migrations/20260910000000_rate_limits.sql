-- Per-IP rate limiting for the public Edge Functions.
--
-- One row per (function, hashed IP, window). The functions never read or write
-- this table directly; they call rate_limit_hit(), which counts the request and
-- says whether it is still under the cap. Like leads and bookings, RLS is on
-- with no policies: anon and authenticated cannot touch it.
--
-- The bucket key holds a salted SHA-256 of the caller's IP, never the IP
-- itself, and rows are swept after a day.

create table public.rate_limits (
  bucket        text primary key,
  hits          integer not null default 0,
  window_start  timestamptz not null default now()
);

create index rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

-- Counts one request against `p_bucket` and returns true while the caller is
-- under `p_max` requests per `p_window_seconds`. The window is fixed, not
-- sliding: the first request after an expired window starts a fresh one.
create or replace function public.rate_limit_hit(
  p_bucket         text,
  p_max            integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := now() - make_interval(secs => p_window_seconds);
  v_hits   integer;
begin
  insert into public.rate_limits as r (bucket, hits, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update
    set hits         = case when r.window_start < v_cutoff then 1     else r.hits + 1 end,
        window_start = case when r.window_start < v_cutoff then now() else r.window_start end
  returning r.hits into v_hits;

  -- Opportunistic sweep, roughly once every hundred requests.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
