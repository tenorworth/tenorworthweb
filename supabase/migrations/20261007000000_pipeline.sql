-- Prospect pipeline for app.tenorworth.com/pipeline.
--
-- A prospect is a person we might work with. Website form submissions stay in
-- `leads` (one row per submission, so a visitor who fills the form twice has
-- two); each lead now points at the prospect it belongs to, matched on email.
-- Prospects met elsewhere (LinkedIn, events, referrals) are added by hand and
-- have no leads.
--
-- Nothing changes for the public Edge Functions: triggers attach each new lead
-- to a prospect and move the prospect to "call booked" when a booking lands.
--
-- Access: only a signed-in user whose app_metadata.role is 'admin' can read or
-- write any of this, enforced by RLS. app_metadata is set server side (SQL or
-- the service role); users cannot edit it themselves, unlike user_metadata.
-- leads and bookings stay write-only for the service role; admins get read.

-- ---------------------------------------------------------------------------
-- Who is an admin
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Prospects
-- ---------------------------------------------------------------------------

create type public.prospect_stage as enum (
  'new',          -- came in, not yet answered
  'contacted',    -- we replied or reached out
  'call_booked',  -- intro call on the calendar
  'discovery',    -- intro call done, scoping
  'proposal',     -- proposal sent
  'won',
  'lost'
);

create table public.prospects (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text,
  company           text,
  title             text,
  phone             text,
  linkedin_url      text,
  sector            text,           -- an INDUSTRY_IDS slug from marketing/src/config/industries.ts
  offer             text,           -- roadmap | pilot | retainer
  value_usd         integer,        -- rough engagement value, for the pipeline total
  source            text,           -- first touch: a CTA source, or linkedin / event / referral / other
  stage             public.prospect_stage not null default 'new',
  stage_changed_at  timestamptz not null default now(),
  next_step         text,
  next_step_due     date,
  lost_reason       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint prospects_name_len   check (char_length(name) between 1 and 120),
  constraint prospects_email_len  check (email is null or char_length(email) <= 254),
  constraint prospects_value_pos  check (value_usd is null or value_usd >= 0),
  constraint prospects_offer_ok   check (offer is null or offer in ('roadmap', 'pilot', 'retainer'))
);

-- One prospect per email address; prospects added by hand may have none.
create unique index prospects_email_uq on public.prospects (lower(email)) where email is not null;
create index prospects_stage_idx on public.prospects (stage, stage_changed_at desc);

-- Notes and stage changes, newest first on the prospect page. Form
-- submissions and bookings are read from their own tables, not copied here.
create type public.prospect_event_kind as enum ('note', 'stage');

create table public.prospect_events (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  kind         public.prospect_event_kind not null,
  body         text,
  from_stage   public.prospect_stage,
  to_stage     public.prospect_stage,
  author       uuid default auth.uid(),   -- null when a trigger made the change
  created_at   timestamptz not null default now(),
  constraint prospect_events_body_len check (body is null or char_length(body) <= 5000),
  constraint prospect_events_shape check (
    (kind = 'note'  and body is not null) or
    (kind = 'stage' and to_stage is not null)
  )
);

create index prospect_events_prospect_idx on public.prospect_events (prospect_id, created_at desc);

alter table public.leads
  add column prospect_id uuid references public.prospects (id) on delete cascade;

create index leads_prospect_idx on public.leads (prospect_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at honest, and log every stage change.
create or replace function public.prospects_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger prospects_touch
  before update on public.prospects
  for each row execute function public.prospects_touch();

create or replace function public.prospects_log_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.prospect_events (prospect_id, kind, from_stage, to_stage, author)
  values (new.id, 'stage', old.stage, new.stage, auth.uid());
  return null;
end;
$$;

create trigger prospects_log_stage
  after update of stage on public.prospects
  for each row when (new.stage is distinct from old.stage)
  execute function public.prospects_log_stage();

-- Every new lead belongs to a prospect: the one with that email, or a new one.
-- A lost prospect who comes back through the form is reopened as new.
create or replace function public.leads_attach_prospect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if new.prospect_id is not null then
    return new;
  end if;

  -- Insert first so two submissions racing on a new email cannot both create
  -- a prospect; the loser falls through to the existing row.
  insert into public.prospects (name, email, company, source)
  values (new.name, lower(new.email), new.company, new.source)
  on conflict (lower(email)) where email is not null do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.prospects where lower(email) = lower(new.email);

    update public.prospects
    set company = coalesce(company, new.company),
        stage   = case when stage = 'lost' then 'new'::public.prospect_stage else stage end
    where id = v_id;
  end if;

  new.prospect_id := v_id;
  return new;
end;
$$;

create trigger leads_attach_prospect
  before insert on public.leads
  for each row execute function public.leads_attach_prospect();

-- A booking moves an early-stage prospect to "call booked". Later stages are
-- left alone: a client booking a follow-up is not a step backwards.
create or replace function public.bookings_advance_prospect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prospects p
  set stage = 'call_booked'
  from public.leads l
  where l.id = new.lead_id
    and p.id = l.prospect_id
    and p.stage in ('new', 'contacted', 'lost');
  return null;
end;
$$;

create trigger bookings_advance_prospect
  after insert on public.bookings
  for each row execute function public.bookings_advance_prospect();

revoke all on function public.prospects_log_stage()       from public, anon, authenticated;
revoke all on function public.leads_attach_prospect()     from public, anon, authenticated;
revoke all on function public.bookings_advance_prospect() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: one prospect per email from the leads we already have, named after
-- the most recent submission, first touch from the earliest.
-- ---------------------------------------------------------------------------

insert into public.prospects (name, email, company, source, stage, created_at, stage_changed_at)
select
  latest.name,
  lower(latest.email),
  coalesce(latest.company, (select l3.company from public.leads l3
                            where lower(l3.email) = lower(latest.email) and l3.company is not null
                            order by l3.created_at desc limit 1)),
  first.source,
  case when exists (
    select 1 from public.bookings b join public.leads l4 on l4.id = b.lead_id
    where lower(l4.email) = lower(latest.email)
  ) then 'call_booked'::public.prospect_stage else 'new'::public.prospect_stage end,
  first.created_at,
  latest.created_at
from (
  select distinct on (lower(email)) * from public.leads order by lower(email), created_at desc
) latest
join (
  select distinct on (lower(email)) * from public.leads order by lower(email), created_at asc
) first on lower(first.email) = lower(latest.email);

update public.leads l
set prospect_id = p.id
from public.prospects p
where l.prospect_id is null and lower(p.email) = lower(l.email);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.prospects       enable row level security;
alter table public.prospect_events enable row level security;

revoke all on table public.prospects       from anon, authenticated;
revoke all on table public.prospect_events from anon, authenticated;

grant select, insert, update, delete on table public.prospects to authenticated;
grant select, insert, delete         on table public.prospect_events to authenticated;
grant select on table public.leads    to authenticated;
grant select on table public.bookings to authenticated;

create policy prospects_admin on public.prospects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy prospect_events_admin_read on public.prospect_events
  for select to authenticated using (public.is_admin());

-- Admins write notes by hand; stage rows come only from the trigger.
create policy prospect_events_admin_note on public.prospect_events
  for insert to authenticated
  with check (public.is_admin() and kind = 'note' and author = auth.uid());

create policy prospect_events_admin_delete_note on public.prospect_events
  for delete to authenticated using (public.is_admin() and kind = 'note');

create policy leads_admin_read on public.leads
  for select to authenticated using (public.is_admin());

create policy bookings_admin_read on public.bookings
  for select to authenticated using (public.is_admin());
