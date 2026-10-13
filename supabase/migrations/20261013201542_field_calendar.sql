-- Field calendar for app.tenorworth.com/events.
--
-- San Diego events worth attending to meet buyers: sector association
-- meetings, business mixers and speaker calls. A weekly Claude task researches
-- new ones and writes them here (field_events, keyed on `slug` so a rerun never
-- duplicates), and logs each run in field_calendar_runs. From the page, an
-- admin marks each event going / maybe / skip and can queue it for Claude to
-- register (field_event_registrations); a second Claude task works that queue
-- and writes back its state.
--
-- Times are San Diego wall-clock (`timestamp`, no zone): every event is local,
-- and the page and the calendar links pass America/Los_Angeles explicitly.
--
-- Access: admins only (public.is_admin(), from the pipeline migration). The
-- Claude tasks write through the Supabase MCP server, which runs as the
-- database owner and is not subject to RLS.

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create type public.field_event_category as enum ('sector', 'networking', 'speaking');
create type public.field_event_plan as enum ('going', 'maybe', 'skip');

create table public.field_events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,      -- short-title-yyyy-mm-dd; the research task's dedupe key
  title        text not null,
  org          text,
  category     public.field_event_category not null,
  sector       text,                      -- an INDUSTRY_IDS slug; null = general business
  starts_at    timestamp not null,        -- San Diego local; a speaker call's deadline
  ends_at      timestamp,
  all_day      boolean not null default false,
  venue        text,
  address      text,
  url          text,
  price_usd    integer,                   -- non-member main ticket; 0 = free; null = no public price
  price_label  text,                      -- short display: "$105", "Free", "$395+", "Invite only"
  cost_detail  text,                      -- full breakdown: "$55 members / $105 non-members"
  fit          text,                      -- who is in the room and why it matters
  source       text,                      -- domain the event was found on
  found_on     date not null default current_date,
  plan         public.field_event_plan,   -- Arka's choice; the research task never writes it
  cancelled    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint field_events_slug_ok    check (slug ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  constraint field_events_title_len  check (char_length(title) between 1 and 300),
  constraint field_events_price_pos  check (price_usd is null or price_usd >= 0),
  constraint field_events_label_len  check (price_label is null or char_length(price_label) <= 40),
  constraint field_events_ends_after check (ends_at is null or ends_at >= starts_at),
  constraint field_events_sector_ok  check (sector is null or sector in (
    'community-healthcare', 'credit-unions', 'law-firms', 'life-sciences', 'hospitality', 'insurance'
  ))
);

create index field_events_starts_idx on public.field_events (starts_at);

-- ---------------------------------------------------------------------------
-- Registration queue: one request per event
-- ---------------------------------------------------------------------------

create type public.field_registration_state as enum (
  'queued',     -- asked for from the page, not yet picked up
  'working',    -- the registration task has it
  'needs_you',  -- handed back: payment, sign-in, a question, or an OK in the session
  'sent',       -- request email sent to the organizer
  'registered', -- confirmed
  'failed'      -- closed, sold out, or otherwise not possible
);

create table public.field_event_registrations (
  event_id      uuid primary key references public.field_events (id) on delete cascade,
  state         public.field_registration_state not null default 'queued',
  note          text,
  requested_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint field_event_registrations_note_len check (note is null or char_length(note) <= 1000)
);

create index field_event_registrations_state_idx on public.field_event_registrations (state);

-- ---------------------------------------------------------------------------
-- Research runs: one row per weekly search, newest shown on the page
-- ---------------------------------------------------------------------------

create table public.field_calendar_runs (
  id       uuid primary key default gen_random_uuid(),
  ran_at   timestamptz not null default now(),
  added    integer not null default 0,
  updated  integer not null default 0,
  removed  integer not null default 0,
  note     text,
  constraint field_calendar_runs_counts check (added >= 0 and updated >= 0 and removed >= 0)
);

create index field_calendar_runs_ran_idx on public.field_calendar_runs (ran_at desc);

-- ---------------------------------------------------------------------------
-- Triggers: keep updated_at honest; a confirmed registration means "going"
-- ---------------------------------------------------------------------------

create or replace function public.field_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger field_events_touch
  before update on public.field_events
  for each row execute function public.field_touch();

create trigger field_event_registrations_touch
  before update on public.field_event_registrations
  for each row execute function public.field_touch();

create or replace function public.field_registration_going()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.field_events set plan = 'going' where id = new.event_id;
  return null;
end;
$$;

create trigger field_registration_going
  after insert or update of state on public.field_event_registrations
  for each row when (new.state = 'registered')
  execute function public.field_registration_going();

revoke all on function public.field_touch()              from public, anon, authenticated;
revoke all on function public.field_registration_going() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.field_events              enable row level security;
alter table public.field_event_registrations enable row level security;
alter table public.field_calendar_runs       enable row level security;

revoke all on table public.field_events              from anon, authenticated;
revoke all on table public.field_event_registrations from anon, authenticated;
revoke all on table public.field_calendar_runs       from anon, authenticated;

grant select, insert, update, delete on table public.field_events              to authenticated;
grant select, insert, update, delete on table public.field_event_registrations to authenticated;
grant select                         on table public.field_calendar_runs       to authenticated;

create policy field_events_admin on public.field_events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy field_event_registrations_admin on public.field_event_registrations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy field_calendar_runs_admin_read on public.field_calendar_runs
  for select to authenticated using (public.is_admin());
