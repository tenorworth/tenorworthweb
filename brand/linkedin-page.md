# LinkedIn company page

Page: https://www.linkedin.com/company/tenorworth (id 143712043). Admin: Arka.

**Audit, 2026-10-11, viewed as a member.** Default LinkedIn banner; tagline reads
"Tenorworth is an AI implementation consultancy"; About is the one-sentence site description;
no specialties, founded year, phone, custom button, hashtags or services; no posts; 1 follower;
industry "IT Services and IT Consulting", so "People also follow" suggests .NET and SAP shops.
Logo, vanity URL, headquarters (San Diego, CA 92107) and company size (2-10) are fine.

Everything below is paste-ready. Character limits are LinkedIn's. Nothing here claims a client
result; the principal's background is as stated on /about.

**Status (2026-10-11, applied through the admin UI):**

| Item | State |
| --- | --- |
| Banner | Done (`brand/linkedin-banner.png`, 1584×396) |
| Tagline | Done |
| About / Overview | Done |
| Industry → Business Consulting and Services | Done |
| Phone | Done |
| Custom button → Contact us → /book?source=linkedin_page | Done |
| Specialties | **Not saved.** Every save with specialties, even five plain ones, returns "Another admin is trying to make changes to this page at the same time as you." All other fields save fine, so this is LinkedIn-side. Try again by hand in a day or two with the list below. |
| Hashtags | LinkedIn no longer offers page hashtags in the editor (no Community tab). Skip. |
| Company Service Page ("Add services") | Not started. It creates a separate Service Page with its own request inbox on LinkedIn, parallel to /book. Decide first whether you want a second lead channel. |
| Intro post from the page | Draft below (section 5), not posted. |
| Follower invites, pages to follow | Yours to pick. |

LinkedIn's editor rejects a save when its copy of the page is stale, with the same
"Another admin" message. Reload the editor before each save and change one tab at a time.

## 1. Banner

Upload `brand/linkedin-banner@2x.png` (3168×792; LinkedIn resizes). `brand/linkedin-banner.png`
is the 1584×396 version. Source is `brand/linkedin-banner.html`, rendered with headless Chrome
and Google Fonts; edit the HTML and re-render if the wording changes. The wordmark starts at
x=440 because LinkedIn overlays the square logo on the bottom-left quarter of the banner.

## 2. Tagline (Edit page → Header → Tagline, max 120 characters)

```text
AI, deployed with care. Working systems for regulated, operations-heavy businesses in Southern California.
```

Alternative, if a plainer line reads better under the name:

```text
Working AI for regulated business in Southern California. Fixed scope, measured return.
```

## 3. About (Edit page → About → Description, max 2,000 characters)

```text
Tenorworth puts working AI systems inside regulated and operations-heavy businesses. Safely, on a fixed scope, with a measured return.

We work with small and mid-market businesses in Southern California where trust and compliance are not optional: community clinics, credit unions and RIAs, law firms, life sciences companies, hospitality operators, and insurance brokers and claims teams.

Not strategy decks. Deployed agents, retrieval over your own documents, and workflow automation that your staff actually use, with audit logging, access control and human review built in from the first day.

Three fixed-scope engagements:

AI Readiness Roadmap. Two weeks, fixed fee. Where AI will pay back in your operation, what has to be true before it can, and a written plan for the first pilot with scope, metric and price.

Pilot. Four to six weeks, fixed scope. One workflow, your real data, a working system in your environment, and a measured result reported plainly.

Fractional AI Architect. Monthly retainer. A named senior architect accountable for your AI program: vendor and model selection, governance, and briefings for leadership and the board.

The practice is led by Arka Bala, who has spent seventeen years building data and AI platforms inside JPMorgan Chase, Scotiabank, KPMG, Highmark Health, QBE Insurance and a $5B specialty insurer. That is why the governance, audit-trail and data-boundary questions get answered before the demo, not after.

We are deliberately small. The person you meet is the person who does the work. And we will tell you when AI is the wrong answer.

Tenorworth is the AI implementation practice of TravAlarm, Inc., based in San Diego.

Book a thirty-minute call: https://tenorworth.com/book
hello@tenorworth.com
+1 (650) 701-7881
```

## 4. Details (Edit page → About)

- **Industry:** change to **Business Consulting and Services**. The buyer is a COO or VP of
  Operations, not an IT department, and the page then sits beside consultancies instead of
  software vendors in "People also follow" and in ad targeting. Judgment call; "IT Services and
  IT Consulting" is defensible if you prefer it.
- **Specialties** (max 20; paste comma-separated):
  `AI implementation, AI agents, Retrieval-augmented generation (RAG), Workflow automation,
  AI governance, Model risk management, AI audit trails, Human-in-the-loop AI, HIPAA-compliant AI,
  AI for credit unions, AI for law firms, AI for life sciences, AI for hospitality,
  AI for insurance claims, AI readiness assessment, Fractional AI architect, Data governance,
  Southern California, San Diego`
- **Founded:** TravAlarm, Inc.'s incorporation year if you want the entity's age to show;
  otherwise 2026 for the practice. Leave blank rather than guess.
- **Phone:** +1 (650) 701-7881 (the Google Voice line already on the site).
- **Website:** already https://tenorworth.com. Keep.
- **Custom button** (Edit page → Header → Buttons): **Contact us** →
  `https://tenorworth.com/book?source=linkedin_page&utm_source=linkedin&utm_medium=page&utm_campaign=cta_button`.
  The `lead` function stores `source`, so these show up in the pipeline as `linkedin_page`.
- **Hashtags** (Edit page → Community → Hashtags, max 3): `#AIGovernance`, `#Compliance`,
  `#SanDiego`. These let the page comment from hashtag feeds as Tenorworth.
- **Services** (the "Add services" nudge on the dashboard): pick the closest categories from
  LinkedIn's fixed list (IT Consulting, Business Consulting, Information Management) and use this
  description:

  ```text
  Three fixed-scope engagements for regulated and operations-heavy businesses in Southern California: a two-week AI Readiness Roadmap, a four-to-six-week Pilot on your real data, and a Fractional AI Architect retainer. Deployed agents, retrieval over your own documents and workflow automation, with the audit trail and data boundary settled before the build starts.
  ```

## 5. Posts (the page has none)

- Post the introduction below natively from the page and pin it as **Featured**. It is the
  batch-1 introduction rewritten in the page's voice (third person, "we"); the facts are the
  same and the sector list matches the About. The link carries `utm_medium=company_page` so GA
  can tell page traffic from profile traffic.

  ```text
  In a regulated business, the hard part of an AI project is rarely the demo.

  It is the question compliance asks afterwards: where did the data go?

  Tenorworth is an AI implementation practice for small and mid-market businesses in Southern California where trust and compliance are not optional: community clinics, credit unions and RIAs, law firms, life sciences companies, hospitality operators, and insurance brokers and claims teams.

  Our principal, Arka Bala, has spent seventeen years building data and AI platforms inside banking, insurance and healthcare institutions. The governance questions were never the obstacle. Answering them late was.

  Three fixed-scope engagements:

  1. A two-week AI Readiness Roadmap
  2. A four-to-six-week Pilot on your real data
  3. A Fractional AI Architect retainer

  Not strategy decks. Working systems your staff use, with the audit trail and the data boundary settled before the build starts.

  Over the coming weeks we will post what that looks like, sector by sector.

  https://tenorworth.com/services?utm_source=linkedin&utm_medium=company_page&utm_campaign=batch-1
  ```
- For posts 2–11 (13 Oct to 3 Nov, 8:00 a.m. Pacific on the personal profile), repost from the
  page the same morning using "Repost with your thoughts" and one line, e.g. "From our principal,
  on the four questions an NCUA examiner asks." The personal profile keeps the reach; the page
  gets a feed that is not empty when a prospect clicks through.
- Change `utm_medium=social` to `utm_medium=company_page` on the page's copies if you want GA to
  split page traffic from personal-profile traffic.
- After batch 1: one native page post per published Insights article, plus one repost a week.
  Two a week is the cadence LinkedIn rewards; do not go faster than the articles support.
- Comment from Arka's personal profile on every page post within the first hour.

## 6. Followers (currently 1)

- **Invite connections**: the page gets 250 invitation credits a month, returned when accepted.
  Start with Southern California operators, compliance leads, credit union and clinic contacts,
  then former colleagues who would plausibly refer.
- Arka's profile is already the one associated member. Check the **Experience** entry for
  Tenorworth links to this page (not free text) and the headline names Tenorworth.
- Follow 10–20 relevant pages (California Credit Union League, CalChamber, State Bar of
  California, local hospital associations, SoCal biotech groups) so the page's feed and
  "Join conversations" module have something to work with.
- Decline the Premium Page trial and the Ads consultation. Neither moves a page with 1 follower,
  and the $0 trial auto-renews.

## 7. Off LinkedIn

- Site: done, uncommitted. `SITE.linkedinCompany` in `marketing/src/config/site.ts`; footer links
  "LinkedIn" (company) and "Arka on LinkedIn"; `sameAs` on the ProfessionalService schema and the
  Insights publisher. Build passes.
- Email signature for hi@/hello@: add the page link.
- `/card` and the vCard keep the personal profile; that is the right link for a handshake.
