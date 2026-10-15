# Analytics — what tenorworth.com sends to Google Analytics

Google Analytics 4 property `tenorworth_web`. The tag loads only when
`PUBLIC_GA_MEASUREMENT_ID` is set in `marketing/.env` at build time, so local
dev sends nothing unless you set it.

Two ways an event leaves the site:

- **Declarative.** Any element with `data-event="name"` sends `name` on click.
  Its other `data-*` attributes become parameters (`data-article-slug` →
  `article_slug`) and anchors add `link_url`. See `GoogleAnalytics.astro`.
- **Scripted.** `track(name, params)` from `src/lib/analytics.ts`, used where
  the event depends on runtime state (form outcomes, scroll depth).

Every page view carries `content_group`: `home`, `services`, `insights`,
`book`, `card` or `other` (set in `BaseLayout.astro`).

No event carries a name, email, company or message. Error reasons are short
codes or the server's generic error string.

## Event catalogue

### Calls to action (declarative)

| Event | Parameters | Where |
|---|---|---|
| `cta_click` | `source` | Every "Book a call" button, "Save contact", "Send me the notes". `source` is the CTA's placement (`header`, `home_hero`, `insights_<industry>`, `card_book`, …) and is also written to the lead row. |

### Booking funnel, `/book` (scripted)

All carry `source`, taken from `?source=` on the URL (the CTA that sent them)
or `book_page`.

| Step | Event | Extra parameters |
|---|---|---|
| 1 | `lead_form_start` | — (first focus in the form, once per page) |
| 2 | `lead_submitted` | `has_company`, `has_message` |
| 2 ✗ | `lead_failed` | `reason` (`turnstile_missing`, `validation`, `network`, or the server error), `status` |
| 3 | `slots_viewed` | `slot_count` (0 means the calendar was full) |
| 3 ✗ | `slots_failed` | `reason`, `status` |
| 4 | `slot_selected` | `days_out` (lead time in whole days) |
| 5 | `booking_confirmed` | — |
| 5 ✗ | `booking_failed` | `reason` (`slot_taken`, `network`, or the server error), `status` |

### In-person card, `/card` (scripted + declarative)

| Event | Parameters |
|---|---|
| `card_open` | `card_source`: `card_qr`, `card_nfc` or `card` |
| `cta_click` | `source`, `card_source` (added at runtime to the card's buttons) |
| `card_notes_requested` | `source`, `card_source`, `has_met` |
| `lead_failed` | `source`, `reason`, `status` |

### Insights (scripted + declarative)

Article events carry `article_slug`, `article_title`, `industry`,
`reading_time` (minutes).

| Event | Extra parameters | Fires |
|---|---|---|
| `article_view` | — | Post page load |
| `article_read` | `percent_scrolled` 25 / 50 / 75 | Once each, as the article body scrolls |
| `article_complete` | `seconds_on_page` | End of the article (before FAQ/sources) enters view |
| `post_card_click` | `list` (`insights`, `industry_hub`, `related`), `article_slug`, `industry` | Any post card |
| `industry_hub_click` | `industry`, `placement` (`breadcrumb`, `in_practice`) | Links to `/insights/industry/<sector>` from a post |
| `service_click` | `industry`, `article_slug` | "See the engagement that fits" |
| `source_click` | `article_slug`, `industry`, `link_url` | A cited source |

## One-time GA admin setup

Code can send these events but cannot configure the property. Do this once
in the GA admin for `tenorworth_web`.

### 1. Key events (conversions)

Admin → Data display → Events → "Mark as key event":

- `booking_confirmed` — the real conversion
- `lead_submitted` — the half-way mark, so funnels have a mid point
- `card_notes_requested` — the in-person conversion

Events only appear in this list after GA has seen them once. Fire them from
a real browser against the live site (or create them pre-emptively with
"Create event" using the same names).

### 2. Custom dimensions

Admin → Data display → Custom definitions → Create custom dimension, scope
**Event**, one per parameter. Without this GA stores the parameter but no
report or exploration can show it.

| Dimension name | Event parameter |
|---|---|
| Source | `source` |
| Card source | `card_source` |
| Article slug | `article_slug` |
| Article title | `article_title` |
| Industry | `industry` |
| List | `list` |
| Placement | `placement` |
| Reason | `reason` |

Custom **metrics** (same screen, "Create custom metric", unit Standard):
`percent_scrolled`, `slot_count`, `days_out`, `reading_time`,
`seconds_on_page`.

`content_group` and `link_url` are built in and need nothing.

The free tier allows 50 event-scoped dimensions and 50 metrics; this uses 8
and 5.

### 3. Funnel explorations

Explore → Funnel exploration. Make both **open** funnels so people who land
mid-way still count.

**Book a call**

1. `cta_click`
2. `lead_form_start`
3. `lead_submitted`
4. `slots_viewed`
5. `booking_confirmed`

Break down by **Source** to see which CTA converts.

**Insights to lead**

1. `article_view`
2. `article_read` where `percent_scrolled` = 50
3. `cta_click`
4. `lead_submitted`

Break down by **Industry** or **Article slug**.

### 4. Enhanced measurement

Admin → Data streams → tenorworth.com → Enhanced measurement. Keep **Outbound
clicks** and **File downloads** on: the vCard download on `/card` arrives as
GA's own `file_download` event. GA's built-in **Scroll** event fires at 90 %
of the whole page and carries no article data, so it is redundant with
`article_read` but harmless.

### 5. Verifying

Admin → DebugView shows events live from any browser with the
[GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
extension on, or from a page loaded with `?debug_mode=1` once in the
session. Standard reports lag by a day or more.

## Adding an event

1. Prefer `data-event` on the element. Reach for `track()` only when the
   event depends on something the markup does not know.
2. Add it to the catalogue above.
3. Register any new parameter as a custom dimension (step 2) the same day,
   or the data collected in the meantime is invisible.
4. Keep names `snake_case`, under 40 characters, and never put personal data
   in a parameter.
