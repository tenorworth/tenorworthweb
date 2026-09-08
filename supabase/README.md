# supabase/ — lead capture and call booking

The "Book a call" flow on tenorworth.com (`marketing/src/pages/book.astro`) is
served by three public Edge Functions and two tables. No app backend is
involved; the static site calls the functions directly.

```
migrations/20260907000000_leads_bookings.sql   leads, bookings (RLS on, no policies)
functions/lead           POST  save name/email/company/message → { id }
functions/availability   GET   open 30-min slots = business hours − Google busy
functions/book           POST  create the Calendar event + Meet link, record booking
functions/_shared/       cors, service-role client, Google Calendar, slot maths
```

Flow: form → `lead` (row in `leads`) → `availability` → visitor picks a slot →
`book` re-checks free/busy, creates the event on the Google calendar with the
visitor as attendee (Google emails the invite), inserts a `bookings` row.

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
check: invite arrives with a Meet link, event on the calendar, rows in
`leads` and `bookings` (Table Editor).

## Changing things

- Edit a function → `supabase functions deploy <name>`.
- Schema change → new file in `migrations/` → `supabase db push`.
- Rotate the Google token → rerun the script, `supabase secrets set`, done
  (functions pick up new secrets on the next invocation).
- If Google ever revokes the refresh token (password change, "remove access"),
  `availability` returns 502 and the page tells visitors to email instead.
