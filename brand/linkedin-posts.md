# LinkedIn posts, batch 1

Twelve posts for Arka's personal profile, three a week for four weeks. Each is drawn from a
published Insights article and makes no claim the article does not make. No client results,
no invented anecdotes. Regulatory facts are as cited in the articles' `sources`.

**How to use**

- Post from the personal profile. Repost from the Tenorworth company page once it exists.
- Suggested slots are Tuesday, Wednesday and Thursday mornings. Adjust once you see what your
  own audience responds to.
- Each post stands alone. The article link is the last line; move it to the first comment if
  you prefer to test that.
- Links carry `utm_source=linkedin` so Google Analytics can attribute the visits.
- Attach the article's hero image (`marketing/src/assets/blog/`) where one is named.
- Post 12 waits until the claims article is live on the site.

**Status (2026-10-09):** post 1 went live on Thu 8 Oct. Posts 2–11 are scheduled on the
personal profile, 8:00 a.m. Pacific, as below. Posted without separate images: the link card
already shows the article's hero photo (it is the page's `og:image`). Post 12 is not scheduled.

| Post | Scheduled |
| --- | --- |
| 1. Introduction | Live, Thu 8 Oct |
| 2. Credit unions: the examiner's four questions | Tue 13 Oct |
| 3. Law firms: a specification, not a memo | Wed 14 Oct |
| 4. Clinics: the fax room | Thu 15 Oct |
| 5. Hotels: the night audit | Tue 20 Oct |
| 6. Life sciences: validating AI | Wed 21 Oct |
| 7. Credit unions: the fifth field | Thu 22 Oct |
| 8. Law firms: billing | Tue 27 Oct |
| 9. Clinics: two dates | Wed 28 Oct |
| 10. Hotels: card data | Thu 29 Oct |
| 11. Life sciences: version pinning | Tue 3 Nov |
| 12. Claims: the fifteen-day clock | Waiting for the article to be published |

---

## 1. Introduction

Source: About and Services pages. Image: none, or the principal's photo.

```text
In a regulated business, the hard part of an AI project is rarely the demo.

It is the question compliance asks afterwards: where did the data go?

I have spent seventeen years building data and AI platforms inside banking, insurance and healthcare institutions. The governance questions were never the obstacle. Answering them late was.

Tenorworth is the practice I run for small and mid-market businesses in Southern California where trust and compliance are not optional: community clinics, credit unions and RIAs, law firms, life sciences companies and hospitality operators.

Three fixed-scope engagements:

1. A two-week AI Readiness Roadmap
2. A four-to-six-week Pilot on your real data
3. A Fractional AI Architect retainer

Not strategy decks. Working systems your staff use, with the audit trail and the data boundary settled before the build starts.

Over the next few weeks I will post what that looks like, sector by sector.

https://tenorworth.com/services?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1
```

---

## 2. Credit unions: the examiner's four questions

Source: `policy-retrieval-credit-unions-orange-county-ncua-audit`. Image: `credit-union-branch-desk-orange-county.jpg`.

```text
A member calls a branch in Irvine. Does skip-a-payment apply to a loan that was modified last year?

The rep opens the loan policy, then the modification procedure, then the March memo that changed it. The answer is right, probably. Months later, the examiner asks how anyone knows.

Put an AI assistant over your policies and an NCUA examiner will ask the four questions they ask about any system that touches operations:

1. Where does the data live, and who can reach it? (12 CFR Part 748, Appendix A)
2. Who is the vendor, and how did you diligence them? (Letter 07-CU-13)
3. How do you know the answers are right? (Examiners tend to borrow the framing of SR 11-7: an owner, documentation, validation, monitoring.)
4. What happens when it goes wrong? (The 72-hour notification rule in 748.1(c).)

A system that answers only from approved policies, shows the section and version with every answer, and logs who asked what can answer all four.

A first pilot does not need member data at all.

The full article, with sources:
https://tenorworth.com/insights/policy-retrieval-credit-unions-orange-county-ncua-audit?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#CreditUnions #NCUA #Compliance
```

---

## 3. Law firms: a specification, not a memo

Source: `generative-ai-law-firms-los-angeles-state-bar-guidance`. Image: `law-firm-office-century-city.jpg`.

```text
An associate used a public AI tool to summarise a deposition. It was fast. The summary was good. Nobody can say for certain where the transcript went.

The usual response is a memo.

The State Bar of California's 2023 guidance on generative AI reads better as a specification. It creates no new rules. It applies the existing ones, duty by duty. Three do most of the work.

Confidentiality. Client information never enters a tool that can retain it or train on it. The duty sits with the lawyer, not the vendor.

Supervision. A lawyer reviews the output before it goes out, as with a junior's work. Fabricated citations in a filing are the lawyer's fabricated citations.

Billing. Bill for the time actually spent, including prompting and review. Not for the time saved.

The architecture that satisfies all three scopes every tool to one matter, inside the firm's own environment. Walls are enforced by the access model, not by asking people to remember.

The full article, with sources:
https://tenorworth.com/insights/generative-ai-law-firms-los-angeles-state-bar-guidance?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#LawFirms #LegalEthics #GenerativeAI
```

---

## 4. Clinics: the fax room

Source: `ai-referral-prior-auth-community-clinics-los-angeles`. Image: `community-clinic-front-desk-los-angeles.jpg`.

```text
The referral queue in most community clinics still runs through a fax machine and one coordinator.

That coordinator knows which specialist will actually take a Medi-Cal patient this month. When they are out, the queue stops.

An AI agent can take the reading and the retyping out of that job. On each referral it:

1. Extracts patient, diagnosis, ordering provider, requested service and urgency
2. Checks whether the payer requires prior authorization, and what documentation it wants
3. Drafts the request, or the note back to the referring provider asking for what is missing
4. Places the package in the coordinator's queue with a one-line reason

The coordinator reads, corrects and sends. Nothing reaches a payer or a patient without that step.

On HIPAA the line is simple. A model inside the clinic's own cloud tenant, under a business associate agreement: yes. A consumer AI tool: no.

Measure coordinator hours per week on paperwork. Not model accuracy.

The full article, with sources:
https://tenorworth.com/insights/ai-referral-prior-auth-community-clinics-los-angeles?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#CommunityHealth #PriorAuthorization #HIPAA
```

---

## 5. Hotels: the night audit

Source: `night-audit-reconciliation-automation-palm-springs-hotels`. Image: `hotel-back-office-palm-springs.jpg`.

```text
11:40 p.m. at a boutique hotel in Palm Springs. The night auditor is posting room and tax, checking the card batch, counting a cash drop. In Santa Barbara and Laguna Beach the same thing is happening on different software.

By seven, a controller has to turn five reports into one for the owner.

Every step of a night audit is a comparison between two sources that should agree and often do not:

A rate override without a note.
A card batch that settled short.
A comp posted but not approved.
A folio checked out with a balance.

Finding those exceptions is the real job. The posting and the report formatting are mechanical, and mechanical work is what automation is for.

The system pulls each property's postings into one ledger, runs the reconciliations, and drafts each exception with a suggested resolution. The auditor clears them. The controller reviews one report instead of assembling five. Approvals stay with people.

Measure hours to close per property, and errors caught before the owner's report goes out.

The full article, with sources:
https://tenorworth.com/insights/night-audit-reconciliation-automation-palm-springs-hotels?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#HotelOperations #NightAudit #Hospitality
```

---

## 6. Life sciences: validating AI

Source: `validated-ai-retrieval-sops-deviations-san-diego-biotech`. Image: `biotech-qa-office-san-diego.jpg`.

```text
"How do you validate something that is not deterministic?"

It is the first question QA asks about AI, and the answer is familiar: the way you qualify an analyst.

A defined set of questions with acceptable answers. Acceptance criteria written before the run. A documented review. Then a re-run at release, on every SOP revision in scope, and on every model or software change.

Failures are deviations in the ordinary sense. They go through the ordinary process.

Retrieval is also more stable than its reputation suggests. The passages retrieved are deterministic, and the model is instructed to answer from them.

QA has structure to lean on: the FDA's Computer Software Assurance guidance, GAMP 5 second edition, and the FDA's January 2025 draft guidance on a risk-based credibility assessment tied to context of use.

Scope the intended use narrowly. A tool that helps an associate find the right SOP passage carries a lighter validation case than one that drafts a root-cause section.

The full article, with sources:
https://tenorworth.com/insights/validated-ai-retrieval-sops-deviations-san-diego-biotech?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#GxP #QualityAssurance #Biotech
```

---

## 7. Credit unions: the fifth field

Source: `policy-retrieval-credit-unions-orange-county-ncua-audit`. Image: none.

```text
An audit trail for an AI policy assistant needs five fields. The fifth is the one most vendors leave out.

1. Who asked
2. What they asked
3. Which documents and versions were retrieved
4. What the model answered
5. What the person did with it

When a rep edits an answer before giving it to a member, or overrides it, the log should say so. That is the evidence that a human remained accountable. It is also the fastest way to find the policy passages that confuse people.

Version pinning matters as much as logging. If the loan policy changed on the fifteenth, an answer given on the tenth should be reproducible against the version in force on the tenth.

The same design serves an RIA. Replace the policy manual with the compliance manual, Form ADV and client agreements. The log then fits the books-and-records rule.

The full article, with sources:
https://tenorworth.com/insights/policy-retrieval-credit-unions-orange-county-ncua-audit?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#CreditUnions #RIA #AuditTrail
```

---

## 8. Law firms: billing

Source: `generative-ai-law-firms-los-angeles-state-bar-guidance`. Image: none.

```text
The State Bar of California is direct about billing for AI-assisted work.

A lawyer may charge for the time actually spent, including prompting and review. A lawyer may not charge hourly fees for the time the tool saved.

The consequences are worth thinking through.

Hourly matters get cheaper for the client.
Fixed-fee and alternative-fee matters get more profitable for the firm.

The firms that benefit most already sell outcomes rather than hours. The technology only sharpens that question.

Where to start is the work that costs associate hours the client will not pay for:

1. Intake. One matter, bounded exposure, measurable in hours per intake and in write-offs.
2. First-pass review of a defined document set. The tool tags and summarises. A lawyer decides.
3. Research over the firm's own work product, respecting every wall the firm has built.

If the firm passes the tool's cost through to clients, the fee agreement should say so.

The full article, with sources:
https://tenorworth.com/insights/generative-ai-law-firms-los-angeles-state-bar-guidance?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#LawFirms #LegalBilling #GenerativeAI
```

---

## 9. Clinics: two dates

Source: `ai-referral-prior-auth-community-clinics-los-angeles`. Image: none.

```text
Two dates a California clinic should know before putting AI near patient paperwork.

January 1, 2025. AB 3030 took effect. If generative AI produces a communication about a patient's clinical information, it must carry a disclaimer and tell the patient how to reach a human. The exemption: a licensed provider reads and reviews the message before it goes out. That review is the safer design anyway.

2026. Under the CMS prior authorization rule, impacted payers, including Medicaid managed care and Medicare Advantage plans, must answer urgent requests within 72 hours and standard requests within seven calendar days.

The second date changes the maths. When the payer's clock is short and predictable, the clinic's own clock becomes the bottleneck. A fast payer does not help a submission that sat in a queue for nine days before it went out.

That queue is where an agent helps. It reads the referral, drafts the request and flags the missing note within minutes. A person still approves everything that leaves the building.

The full article, with sources:
https://tenorworth.com/insights/ai-referral-prior-auth-community-clinics-los-angeles?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#CommunityHealth #PriorAuthorization #AB3030
```

---

## 10. Hotels: card data

Source: `night-audit-reconciliation-automation-palm-springs-hotels`. Image: none.

```text
A design rule for any automation that touches hotel reconciliation: it should never see a full card number.

It does not need one. Card settlement reconciles on batch totals, authorisation codes and the last four digits. The property management system and the processor already expose those.

A reconciliation system that ingests full card data has taken on a PCI DSS burden for no operational gain. Design it out.

The same restraint applies to guest messaging. The system drafts the pre-arrival note or the post-stay thank you from the reservation and the property's own templates. A person sends it. Tone stays with the people who know the property, and the log records who approved what.

And a drafted message that quotes a rate quotes the full one. Since July 2024, California has required lodging prices to be advertised inclusive of mandatory fees.

The full article, with sources:
https://tenorworth.com/insights/night-audit-reconciliation-automation-palm-springs-hotels?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#HotelOperations #PCIDSS #Hospitality
```

---

## 11. Life sciences: version pinning

Source: `validated-ai-retrieval-sops-deviations-san-diego-biotech`. Image: none.

```text
A deviation opens on a Tuesday. The investigator needs the current version of three SOPs, the last two deviations on the same line, and the CAPA that closed them. Each lives in a different system.

At review, there is still a reference to a superseded procedure.

Retrieval over controlled documents is built for that problem. It answers from the documents in force on the date asked, cites the document, section and version, and refuses to answer from anything else.

Version pinning is what makes it trustworthy. The system holds every version with its effective date. The audit trail records which version was retrieved, so an answer from March can be reproduced in September.

The index is a controlled copy, regenerated from the document management system. It can never be more current than the controlled documents.

Start narrow: SOPs, work instructions and closed deviation reports. Batch records and open investigations come later, under a separate change control.

Measure days from deviation opened to investigation submitted, and citation errors found at review.

The full article, with sources:
https://tenorworth.com/insights/validated-ai-retrieval-sops-deviations-san-diego-biotech?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#GxP #Part11 #Biotech
```

---

## 12. Claims: the fifteen-day clock

Source: `ai-claim-file-california-fair-claims-settlement-practices`. Image: `claims-desk-woodland-hills.jpg`.
**Hold until the article is published.** The link below does not resolve yet.

```text
The clock most California claim files miss is not the forty-day one.

10 CCR 2695.7(b) gives forty calendar days from proof of claim to accept or deny. Most operations watch that.

Section 2695.5 also requires a response within fifteen calendar days to any communication that reasonably calls for one. That clock restarts with every letter from a public adjuster or an attorney.

This is where AI earns a place in a claims operation. Not deciding claims. Reading every inbound document as it is filed, extracting the dates, flagging the reply deadline, and drafting the status letter for the adjuster to edit and send.

Three design rules:

1. The licensed adjuster makes every determination and writes every denial.
2. Every AI summary the adjuster relied on goes in the claim file as a work paper, under 2695.3.
3. No triage model uses ZIP code or any other proxy the Department of Insurance named in Bulletin 2022-5.

It does not adjust the claim. It reads the file so the adjuster can.

The full article, with sources:
https://tenorworth.com/insights/ai-claim-file-california-fair-claims-settlement-practices?utm_source=linkedin&utm_medium=social&utm_campaign=batch-1

#InsuranceClaims #ClaimsAdjusting #Compliance
```
