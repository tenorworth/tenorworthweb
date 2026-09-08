# supabase/ — lead capture and call booking

The "Book a call" flow on tenorworth.com (`marketing/src/pages/book.astro`) is
served by three public Edge Functions and two tables. No app backend is
involved; the static site calls the functions directly.

```
migrations/20260907000000_leads_bookings.sql   leads, bookings (RLS on, no policies)
functions/lead           POST  save name/email/company/message → { id }
functions/availability   GET   open 30-min slots = business hours − Google busy
functions/book           POST  calendar event, booking row, invitation email from hi@, heads-up email
functions/_shared/       cors, service-role client, Google Calendar, SMTP + iCalendar, slot maths
```

Flow: form → `lead` (row in `leads`) → `availability` → visitor picks a slot →
`book` re-checks free/busy, puts the event on the principal's Google Calendar
(no attendees, so Google emails nobody), inserts a `bookings` row, then emails
the visitor from **hi@tenorworth.com** (Hostinger SMTP) with a `METHOD:REQUEST`
invitation carrying the Zoom link, and emails `BOOKING_NOTIFY_EMAIL` a heads-up.
When the visitor accepts or declines, their mail client replies to the
organizer, i.e. the hi@ mailbox; forward hi@ to the Gmail account in Hostinger
so those land where they are read.

Why not let Google send the invite: Google Calendar only sends from the account
that owns the calendar, which is a personal Gmail address. Sending from hi@
would otherwise need Google Workspace for the domain.

Only the service role reads or writes these tables. A visitor never holds a
Supabase session, so `verify_jwt = false` in `config.toml` and the functions
validate input themselves (honeypot on the form, strict field checks, slot
membership check, unique index on confirmed start times).

## One-time setup

### 1. Google Cloud: OAuth client for the calendar owner

The calendar is the personal Gmail account **arkajit.bala@gmail.com**. A
service account will not do: Google blocks service accounts from adding
attendees unless a Workspace domain delegates to them, so the visitor would
never get an invite. We use OAuth as the account owner instead, with a
refresh token stored as a function secret.

1. https://console.cloud.google.com → create project "Tenorworth".
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → External. Add the scopes
   `.../auth/calendar.events` and `.../auth/calendar.freebusy`. Then set the
   **publishing status to "In production"** (Testing-mode refresh tokens expire
   after 7 days). Google shows an "unverified app" warning once, only to you.
4. **Credentials → Create credentials → OAuth client ID → Desktop app.** Note
   the client id and secret.
5. Get the refresh token, signed in to Google as arkajit.bala@gmail.com:

   ```bash
   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-oauth-token.mjs
   ```

   Open the printed URL, approve, and copy the `supabase secrets set` command
   it prints. Nothing is written to disk.

### 2. Supabase: link, migrate, secrets, deploy

```bash
npm i -g supabase                      # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref rpvwacqgwuthmnvzqdgs
supabase db push                       # applies migrations/
supabase secrets set \
  GOOGLE_CLIENT_ID='...' GOOGLE_CLIENT_SECRET='...' GOOGLE_REFRESH_TOKEN='...'
supabase functions deploy lead availability book
```

### 2b. Email and Zoom secrets

The invitation goes out over Hostinger SMTP as hi@tenorworth.com. Set the
mailbox password yourself; never paste it anywhere else.

```bash
supabase secrets set \
  SMTP_HOST='smtp.hostinger.com' SMTP_PORT='465' SMTP_USER='hi@tenorworth.com' \
  SMTP_PASS='<mailbox password>' \
  BOOKING_NOTIFY_EMAIL='arkajit.bala@gmail.com' \
  ZOOM_JOIN_URL='https://us02web.zoom.us/j/...?pwd=...'
```

`ZOOM_JOIN_URL` is the personal meeting room link, passcode included, which is
why it is a secret and not in the repo. Turn on the waiting room for that room
in Zoom settings, since every lead gets the same link.

Optional secrets (defaults in brackets): `GOOGLE_CALENDAR_ID` [primary],
`BOOKING_TIMEZONE` [America/Los_Angeles], `BOOKING_START_HOUR` [9],
`BOOKING_END_HOUR` [17], `BOOKING_WINDOW_DAYS` [14],
`BOOKING_MIN_NOTICE_HOURS` [4], `ALLOWED_ORIGINS`
[tenorworth.com, www, localhost:4322].

### 3. Smoke test

```bash
curl -s https://rpvwacqgwuthmnvzqdgs.supabase.co/functions/v1/availability | head -c 300
```

Then open https://tenorworth.com/book, book a slot with your own email, and
check: invitation from hi@ arrives with Accept/Decline and the Zoom link, the
heads-up lands at `BOOKING_NOTIFY_EMAIL`, the event is on the calendar, and
rows exist in `leads` and `bookings` (Table Editor).

## Changing things

- Edit a function → `supabase functions deploy <name>`.
- Schema change → new file in `migrations/` → `supabase db push`.
- Rotate the Google token → rerun the script, `supabase secrets set`, done
  (functions pick up new secrets on the next invocation).
- If Google ever revokes the refresh token (password change, "remove access"),
  `availability` returns 502 and the page tells visitors to email instead.
