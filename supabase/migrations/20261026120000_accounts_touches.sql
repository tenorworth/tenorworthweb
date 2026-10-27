-- Accounts and touches.
--
-- `accounts` is one row per organisation we sell to or partner with (a credit union, a broker,
-- a managed-IT firm). The people stay in `prospects`, attached by `account_id`. Attachment is
-- by company name, the way website leads attach to prospects by email: creating an account
-- picks up every prospect already carrying that company name, and a prospect saved with a
-- matching company gets its account filled in.
--
-- `touches` is the log of every contact with a person: an outbound LinkedIn note, email or
-- call, or an inbound reply. Logging an outbound touch with a step number advances the
-- outreach sequence (touch 1 note → touch 2 email three days later → touch 3 eight days after
-- that → touch 4 ten days after that), sets the prospect's next step and due date, moves a
-- "new" prospect to "contacted", and marks the account as being worked. A reply sets the next
-- step to answering it today and marks the account "replied". Stage changes on a prospect
-- carry the account to "meeting" and "client".
--
-- Access: admins only, like the rest of the pipeline.

create type public.account_kind   as enum ('buyer', 'partner');
create type public.account_status as enum ('untouched', 'working', 'replied', 'meeting', 'client', 'paused', 'lost');

create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          public.account_kind   not null default 'buyer',
  status        public.account_status not null default 'untouched',
  sector        text,            -- an INDUSTRY_IDS slug; null = general
  tier          smallint,        -- 1 = San Diego and Orange County, 2 = the rest of SoCal
  county        text,
  city          text,
  state         text not null default 'CA',
  address       text,
  phone         text,
  website       text,            -- full http(s) URL
  linkedin_url  text,            -- company page, full URL
  charter       text,            -- NCUA charter number for credit unions
  assets_usd    bigint,
  members       integer,
  employees     integer,         -- full-time staff
  branches      integer,
  trigger       text,            -- the recent event that justifies writing now, with its source
  opening_line  text,            -- the specific sentence that opens touch 1 and touch 2
  notes         text,
  list_name     text,            -- which list it came from, e.g. "NCUA 2026-06"
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint accounts_name_len     check (char_length(name) between 1 and 200),
  constraint accounts_sector_ok    check (sector is null or sector in (
    'community-healthcare', 'credit-unions', 'law-firms', 'life-sciences', 'hospitality', 'insurance'
  )),
  constraint accounts_tier_ok      check (tier is null or tier between 1 and 3),
  constraint accounts_website_ok   check (website is null or (char_length(website) <= 200 and website ~* '^https?://')),
  constraint accounts_linkedin_ok  check (linkedin_url is null or (char_length(linkedin_url) <= 200 and linkedin_url ~* '^https?://')),
  constraint accounts_counts_pos   check (
    (assets_usd is null or assets_usd >= 0) and (members is null or members >= 0) and
    (employees is null or employees >= 0) and (branches is null or branches >= 0)
  ),
  constraint accounts_text_len     check (
    (trigger is null or char_length(trigger) <= 2000) and
    (opening_line is null or char_length(opening_line) <= 600) and
    (notes is null or char_length(notes) <= 10000) and
    (list_name is null or char_length(list_name) <= 100)
  )
);

create unique index accounts_name_uq    on public.accounts (lower(name));
create unique index accounts_charter_uq on public.accounts (charter) where charter is not null;
create index accounts_kind_status_idx   on public.accounts (kind, status);

comment on column public.accounts.trigger      is 'The recent event that justifies writing now (merger, new CEO, open roles), with its source';
comment on column public.accounts.opening_line is 'The specific sentence that opens touch 1 and 2; the templates insert it verbatim';

alter table public.prospects
  add column account_id    uuid references public.accounts (id) on delete set null,
  add column sequence_step smallint not null default 0,   -- highest outbound step logged
  add column last_touch_at timestamptz;

create index prospects_account_idx on public.prospects (account_id);

alter table public.prospects
  add constraint prospects_sequence_step_ok check (sequence_step between 0 and 4);

create type public.touch_channel   as enum ('linkedin_note', 'linkedin_dm', 'email', 'phone', 'meeting', 'other');
create type public.touch_direction as enum ('out', 'in');

create table public.touches (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  account_id   uuid references public.accounts (id) on delete set null,   -- copied from the prospect
  channel      public.touch_channel   not null,
  direction    public.touch_direction not null default 'out',
  step         smallint,          -- 1 to 4 for the outbound sequence; null for calls, meetings, replies
  subject      text,
  body         text,              -- what was sent, or what they said
  happened_at  timestamptz not null default now(),
  author       uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  constraint touches_step_ok     check (step is null or step between 1 and 4),
  constraint touches_subject_len check (subject is null or char_length(subject) <= 300),
  constraint touches_body_len    check (body is null or char_length(body) <= 10000)
);

create index touches_prospect_idx on public.touches (prospect_id, happened_at desc);
create index touches_account_idx  on public.touches (account_id, happened_at desc);

-- ── updated_at ──────────────────────────────────────────────────────────────

create or replace function public.accounts_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger accounts_touch
  before update on public.accounts
  for each row execute function public.accounts_touch();

-- ── Attachment by company name ──────────────────────────────────────────────

create or replace function public.accounts_attach_prospects()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.prospects
     set account_id = new.id
   where account_id is null
     and company is not null
     and lower(company) = lower(new.name);
  return null;
end;
$$;

create trigger accounts_attach_prospects
  after insert on public.accounts
  for each row execute function public.accounts_attach_prospects();

create or replace function public.prospects_attach_account()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.account_id is null and new.company is not null then
    select id into new.account_id
      from public.accounts
     where lower(name) = lower(new.company)
     limit 1;
  end if;
  return new;
end;
$$;

create trigger prospects_attach_account
  before insert or update of company on public.prospects
  for each row execute function public.prospects_attach_account();

-- ── Touches advance the sequence ────────────────────────────────────────────

create or replace function public.touches_fill_account()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.account_id is null then
    select account_id into new.account_id from public.prospects where id = new.prospect_id;
  end if;
  return new;
end;
$$;

create trigger touches_fill_account
  before insert on public.touches
  for each row execute function public.touches_fill_account();

create or replace function public.touches_advance()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  day   date := (new.happened_at at time zone 'America/Los_Angeles')::date;
  nxt   text;
  due   date;
begin
  if new.direction = 'out' then
    if new.step is not null then
      case new.step
        when 1 then nxt := 'Touch 2: email';                   due := day + 3;
        when 2 then nxt := 'Touch 3: founding-client email';   due := day + 8;
        when 3 then nxt := 'Touch 4: close';                   due := day + 10;
        else        nxt := 'Wait for a new trigger';           due := null;
      end case;
      update public.prospects
         set last_touch_at = greatest(coalesce(last_touch_at, 'epoch'::timestamptz), new.happened_at),
             sequence_step = greatest(sequence_step, new.step),
             next_step     = nxt,
             next_step_due = due,
             stage         = case when stage = 'new' then 'contacted'::public.prospect_stage else stage end
       where id = new.prospect_id;
    else
      update public.prospects
         set last_touch_at = greatest(coalesce(last_touch_at, 'epoch'::timestamptz), new.happened_at),
             stage         = case when stage = 'new' then 'contacted'::public.prospect_stage else stage end
       where id = new.prospect_id;
    end if;
    update public.accounts set status = 'working'
     where id = new.account_id and status = 'untouched';
  else
    update public.prospects
       set last_touch_at = greatest(coalesce(last_touch_at, 'epoch'::timestamptz), new.happened_at),
           next_step     = 'Reply received: answer today',
           next_step_due = (now() at time zone 'America/Los_Angeles')::date,
           stage         = case when stage = 'new' then 'contacted'::public.prospect_stage else stage end
     where id = new.prospect_id;
    update public.accounts set status = 'replied'
     where id = new.account_id and status in ('untouched', 'working');
  end if;
  return null;
end;
$$;

create trigger touches_advance
  after insert on public.touches
  for each row execute function public.touches_advance();

-- ── Stage changes carry the account forward ─────────────────────────────────

create or replace function public.prospects_sync_account_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.account_id is null then
    return null;
  end if;
  if new.stage = 'won' then
    update public.accounts set status = 'client' where id = new.account_id;
  elsif new.stage in ('call_booked', 'discovery', 'proposal') then
    update public.accounts set status = 'meeting'
     where id = new.account_id and status in ('untouched', 'working', 'replied');
  end if;
  return null;
end;
$$;

create trigger prospects_sync_account_status
  after update of stage on public.prospects
  for each row when (new.stage is distinct from old.stage)
  execute function public.prospects_sync_account_status();

-- ── Access ──────────────────────────────────────────────────────────────────

alter table public.accounts enable row level security;
alter table public.touches  enable row level security;

grant select, insert, update, delete on table public.accounts to authenticated;
grant select, insert, delete         on table public.touches  to authenticated;

create policy accounts_admin on public.accounts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy touches_admin_read on public.touches
  for select to authenticated using (public.is_admin());

create policy touches_admin_insert on public.touches
  for insert to authenticated with check (public.is_admin());

create policy touches_admin_delete on public.touches
  for delete to authenticated using (public.is_admin());
