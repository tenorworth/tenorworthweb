# Tenorworth — image, chart, and diagram prompts

Two kinds of asset, two kinds of tool:

- **Photographs / textures** → image model (GPT-image, Midjourney, Ideogram). Prompts below.
- **Charts / diagrams with words in them** → build as inline SVG in the brand tokens
  (ink #141B2D, cream #F4F1EA, brass #B8985A, Fraunces + Inter). Image models mangle
  text and cannot hit exact hex values. The "prompt" for these is the spec below; hand
  it to Claude Code, Figma, or D3 and it renders exactly.

Rule for every chart: **no invented client results.** Numbers are either (a) labeled
"Illustrative", (b) public benchmarks with a source line, or (c) a blank template
that shows what *their* Roadmap output will look like. The brand is credibility.

## Shared style suffix for image models

> Editorial photograph, natural Southern California light, muted colour grade toward
> warm off-white (#F4F1EA) with a hint of brass; ink-navy shadows. Calm, senior,
> trustworthy. No faces, no screens showing UI, no visible brands or logos, no text.
> Shallow depth of field, soft shadows. Avoid: robots, brains, circuits, neon, blue
> tech glows, sparkles, stock-photo handshakes, people pointing at whiteboards.

---

## A. Sector problem → solution visuals (homepage "Who we serve", one per row)

Each row: a photo (left) + a three-panel strip "Problem · What we deploy · What we
measure" (right, SVG). Captions do the selling; the picture sets the room.

### A1. Community healthcare (LA / Inland Empire clinic)
**Photo prompt:** Front desk of a small community health clinic at 7:10 a.m. before
patients arrive, early light through vertical blinds, a neat stack of referral forms
and a fax machine on the counter, a landline handset off the hook, a wall clock.
Warm, human, slightly tired room. + style suffix.

**Strip (SVG):**
- Problem: "Referrals and prior-auth paperwork wait on one coordinator. Patients wait on hold."
- Deployed: "Intake and referral triage agent with human review. Every action logged, PHI never leaves your tenant."
- Measure: "Hours per week on referral paperwork, before vs. after." (label: Illustrative until your Roadmap)

### A2. Credit union / RIA (Orange County, San Diego)
**Photo prompt:** Quiet interior of a community credit union branch after closing,
a member-service desk with a closed binder of loan policies, a brass desk lamp,
late golden coastal light on a cream wall, a framed charter slightly out of focus.
+ style suffix.

**Strip:**
- Problem: "Member-service reps search three policy binders to answer one question. Examiners ask how you know the answer was right."
- Deployed: "Retrieval over your own policies and procedures, with citations, role-based access, and an audit trail NCUA can read."
- Measure: "Average handle time and first-contact resolution."

### A3. Law firm (Century City / downtown LA)
**Photo prompt:** A senior associate's office in a mid-size Los Angeles law firm,
banker's boxes of discovery documents stacked beside a walnut desk, a redweld folder
open, a fountain pen, city haze and the edge of a high-rise through the window.
+ style suffix.

**Strip:**
- Problem: "Document review and intake burn associate hours the client will not pay for."
- Deployed: "Matter-scoped retrieval and drafting assistants. Privilege boundaries enforced per matter, not by policy memo."
- Measure: "Review hours per matter, write-offs on intake."

### A4. Life sciences (San Diego / Torrey Pines)
**Photo prompt:** Quality-assurance office adjoining a biotech lab in San Diego,
a shelf of numbered SOP binders, a deviation report form on a clean desk, a lab
coat on a hook, cool morning light, glass partition to the lab out of focus.
+ style suffix.

**Strip:**
- Problem: "Deviation write-ups and SOP lookups take days and still miss a reference."
- Deployed: "Validated retrieval over controlled documents, with version pinning and an audit trail your QA lead signs off on."
- Measure: "Days to close a deviation. Citations per answer."

### A5. Hospitality operator (multi-site, Palm Springs / coast)
**Photo prompt:** Back office of a boutique hotel in Palm Springs at dusk, a desk with
five property folios fanned out, a night-audit printout, a brass key rack, warm desert
light through a slatted window. + style suffix.

**Strip:**
- Problem: "Five properties, five reports, one controller reconciling them at midnight."
- Deployed: "Nightly reconciliation and reporting automation; guest messaging drafted for a human to send."
- Measure: "Hours to close the night. Errors caught before the owner's report."

---

## B. Charts and diagrams (SVG specs)

### B1. "Where the hours go" — homepage, above "Three ways to engage"
Horizontal bar chart. Five rows, one per sector, each row two bars: manual hours per
week on the target workflow today (ink) vs. after pilot (brass). Cream background,
fine grid-paper lines. Axis in Inter 12px, row labels Fraunces 16px. Footer line:
"Illustrative ranges from comparable deployments. Your Roadmap replaces these with
your numbers." No legend box; label the two bars once on the top row.

### B2. "The engagement arc" — services page hero
A single tenor line across the page. Flat for the first segment labeled "Roadmap ·
2 weeks", one measured rise during "Pilot · 4–6 weeks", then a steady higher plateau
labeled "Fractional Architect · monthly". Small solid brass circle at the end of the
rise. Under each segment, one line of what you hold at the end: "A ranked plan" /
"A working system, measured" / "A program that compounds". This is the logo mark
turned into a diagram, so it should use the same stroke weight as Mark.astro.

### B3. "Governance before the demo" — "Why Tenorworth" dark section
Two horizontal timelines stacked, week 0 to week 8, ink background, cream lines.
Top, "Typical vendor": demo at week 1, then five brass question marks appear at
weeks 5–8 labeled Audit trail · Access control · Data boundary · Retention · Model
risk, with a red-free "stalled" marker (use a hollow circle, no red). Bottom,
"Tenorworth": the same five items as solid brass points in weeks 0–1, demo at
week 3, live at week 6. Caption: "The questions your compliance officer will ask,
answered before anyone sees a prototype."

### B4. "A human stays in the loop" — services "What we build"
Left-to-right flow: Intake → Agent drafts → Confidence check (diamond) → above
threshold: "Human approves" → Action; below threshold: "Routed to a person" →
Action. Every node feeds a thin line down to a long bar at the bottom labeled
"Audit log: who, what, when, which model, which documents." Ink lines on cream,
brass for the human nodes only.

### B5. "What page 3 of your Roadmap looks like" — Roadmap section, services page
A mock of one page of the deliverable: a ranked table, five candidate workflows,
columns Workflow · Hours/week today · Data touched · Governance gaps · Est. annual
return · Pilot fit. Rows filled with realistic but generic entries for a credit
union; return column shows ranges, not point values. Brass rule under the title,
mark bottom-right. This sells the call better than any statistic: it shows the
thing they get.

### B6. "Southern California, in person" — about or contact page
Ink line map of Southern California counties (Ventura, LA, Orange, San Bernardino,
Riverside, San Diego), cream background, brass points at Los Angeles, Irvine,
San Diego, Riverside, Palm Springs. No labels except the five city names in
Inter 12px. Caption: "On site within the week, anywhere from Ventura to the border."
Build from real county geometry (GeoJSON), not an image model.

### B7. Measured-result stat tile (component, reusable)
One tile: metric name (Inter 12px uppercase, brass), baseline → result (Fraunces
40px, ink), a two-point sparkline (the tenor line), and a source line. Use it only
for real, attributable results; until then, ship it inside B5 as the mock.

---

## C. Supporting photographs

### C1. Homepage hero (sits beside the grid-paper hero)
A quiet corner office in Southern California, walnut desk, single legal pad with
a hand-drawn ranked list of five items (unreadable), fountain pen, closed laptop,
ink-navy wall, sheer curtain moving in coastal air. + style suffix.

**Format: portrait 4:5** (the hero is a two-column layout; the photo fills the
right five columns and is cropped to 4:5 with `object-cover`, so compose with the
legal pad and pen in the lower two-thirds and leave quiet wall above). Generate at
1024×1280 or larger, export as JPEG, save to `marketing/src/assets/home/hero.jpg`.
The page picks it up on the next build; until the file exists the hero stays
text-only. Also keep a 16:9 crop for LinkedIn and the OG image.

Full prompt to paste:

> Editorial photograph, portrait orientation 4:5. A quiet corner office in Southern
> California: a walnut desk in the lower two-thirds of the frame holding a single
> yellow legal pad with a hand-written, unreadable ranked list of five short items,
> a black fountain pen resting across it, and a closed laptop pushed to one side.
> Behind the desk an ink-navy wall (#141B2D) and a sheer white curtain lifted slightly
> by coastal air; morning light from the left. Natural Southern California light,
> muted colour grade toward warm off-white (#F4F1EA) with a hint of brass; navy
> shadows. Calm, senior, trustworthy. No people, no faces, no screens showing UI,
> no visible brands or logos, no readable text. Shallow depth of field, soft shadows,
> generous negative space in the upper third. Avoid: robots, brains, circuits, neon,
> blue tech glows, sparkles, stock-photo handshakes.

Alternative C1b (same slot, for an A/B test):

> Editorial photograph, portrait orientation 4:5. A signed one-page agreement lying
> on a walnut conference table in a Southern California office, a fountain pen set
> down beside it, a closed leather folio, morning light through tinted glass with
> the faint outline of a city beyond. Warm off-white and ink-navy palette with a hint
> of brass; no readable text on the page, no people, no brands, no screens. Calm,
> senior, trustworthy. Shallow depth of field, generous negative space above.

### C2. About page, "Seventeen years in regulated rooms"
An empty boardroom in a financial institution, long walnut table, cream leather
chairs, a single printed binder labeled nothing, morning light, a city seen faintly
through tinted glass. + style suffix. 3:2.

### C3. Contact page
A simple wooden table on a shaded patio, two cups of coffee, a notebook, bougainvillea
out of focus, mid-morning Southern California light. Nothing else. + style suffix.

### C4. OG / social cards per sector (5)
Ink navy (#141B2D) background, thin brass tenor line across the lower third with one
measured rise, and a single small monochrome line-icon top-right for the sector
(stethoscope / key / scales / flask / bell), nothing else, left-centre clear for a
text overlay. 1200×630. Build as SVG; the icon can come from an image model as a
"single-weight line icon, monochrome, on transparent" if needed.

---

## Placement summary

| Page / section | Asset | Status |
|---|---|---|
| Home hero | C1b | Built: `src/assets/home/hero.jpg` (GPT Image, 2026-09-08) |
| Home "Not strategy decks" | B4 | Built: `components/diagrams/HumanInLoop.astro` |
| Home "Three ways to engage" | B2 within (B1 dropped: illustrative hour counts read as invented results) | Built: `components/diagrams/EngagementArc.astro` |
| Home "Who we serve" | A1–A5 photo + strip | Built, reuses the Insights hero photos |
| Home "Why Tenorworth" (dark) | B3 | Built: `components/diagrams/GovernanceTimeline.astro` |
| Home footer CTA | Principal photo (`src/assets/arka-bala.jpg`) | Built: `CTA principal` prop |
| Services hero | B2 | Component exists, not placed |
| Services Roadmap block | B5 | Not built |
| Services "What we build" | B4 | Component exists, not placed |
| About | C2, B6 | Not built |
| Contact | C3, B6 | Not built |
| Social | C4 ×5 | Not built |
