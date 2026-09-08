-- Lead capture and call bookings for the "Book a call" flow on tenorworth.com.
--
-- Both tables are written ONLY by the Edge Functions in supabase/functions,
-- which use the service role. RLS is on and there are no policies, so the
-- anon and authenticated roles can neither read nor write them. Do not add a
-- permissive policy here without a reason.

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text not null,
  company     text,
  message     text,
  source      text,           -- which CTA sent them (header, home_hero, ...)
  timezone    text,           -- visitor's IANA time zone at submission
  user_agent  text,
  created_at  timestamptz not null default now(),
  constraint leads_email_len check (char_length(email) <= 254),
  constraint leads_name_len  check (char_length(name) between 1 and 120)
);

create index leads_email_idx      on public.leads (lower(email));
create index leads_created_at_idx on public.leads (created_at desc);

create type public.booking_status as enum ('confirmed', 'cancelled');

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads (id) on delete cascade,
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  timezone         text,       -- attendee's IANA time zone when they booked
  google_event_id  text unique,
  meet_url         text,
  html_link        text,
  status           public.booking_status not null default 'confirmed',
  created_at       timestamptz not null default now(),
  constraint bookings_time_order check (end_at > start_at)
);

create index bookings_lead_idx on public.bookings (lead_id);

-- One confirmed booking per start time. The calendar free/busy check should
-- catch clashes first; this is the backstop for two visitors racing.
create unique index bookings_start_confirmed_uq
  on public.bookings (start_at)
  where status = 'confirmed';

alter table public.leads    enable row level security;
alter table public.bookings enable row level security;

revoke all on table public.leads    from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
