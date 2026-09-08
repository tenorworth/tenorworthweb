---
title: "Generative AI in a Los Angeles law firm: what the State Bar guidance actually requires"
description: "The State Bar of California's generative AI guidance, read as a specification: confidentiality, supervision, billing, and the matter-scoped tools that satisfy it."
industry: law-firms
region: Century City and downtown Los Angeles
publishDate: 2026-09-08
heroImage: ../../assets/blog/law-firm-office-century-city.jpg
heroAlt: "Law firm office in Century City with unlabeled document boxes stacked beside a walnut desk, a closed red folder, a legal pad and pen, and the Los Angeles skyline in haze through the window"
heroCaption: "Discovery still arrives in boxes. The question is whether the tool that reads them can keep one matter's privilege from leaking into another."
summary: "A California law firm may use generative AI, but the State Bar's 2023 guidance holds lawyers to their existing duties: do not put confidential client information into a tool that can retain or train on it, supervise the output as you would a junior's, bill only for time actually spent, and disclose when a client's matter warrants it. The safest architecture scopes every tool to one matter and keeps the firm's documents inside the firm's own environment."
keywords: ["generative AI law firm California", "State Bar generative AI guidance", "legal AI confidentiality", "matter-scoped RAG", "ABA Formal Opinion 512", "AI document review Los Angeles"]
faq:
  - q: "Can our associates use a consumer AI product on client work?"
    a: "Not with confidential client information. The State Bar guidance says a lawyer must not input confidential information into a generative AI tool that lacks adequate confidentiality and security protections, and must review the product's terms to confirm the input is not retained or used for training. An enterprise tool inside the firm's own environment, under a written agreement, is a different matter."
  - q: "Can we bill for time the AI saved?"
    a: "No. The guidance is explicit that a lawyer may charge for the actual time spent on a matter, including time spent prompting and reviewing, but may not charge hourly fees for time saved by using generative AI. If the firm passes through the cost of an AI tool, the fee agreement should say so."
  - q: "Do we have to tell clients we use AI?"
    a: "The guidance says a lawyer should consider disclosure, and that disclosure is required where the engagement terms or a client's instructions call for it, or where the use is material to the representation. Many firms now add a standard paragraph to the engagement letter and make case-by-case decisions on top of it."
  - q: "What does matter-scoped mean?"
    a: "The tool can only see the documents of the matter the lawyer is working on. Privilege and conflict walls are enforced by the system's access model, not by a policy memo asking people to be careful. That is the design the guidance's confidentiality and supervision duties point toward."
sources:
  - title: "State Bar of California, Practical Guidance for the Use of Generative Artificial Intelligence in the Practice of Law (approved November 16, 2023)"
    url: "https://www.calbar.ca.gov/Portals/0/documents/ethics/Generative-AI-Practical-Guidance.pdf"
  - title: "California Rules of Professional Conduct, Rule 1.6 (Confidential Information of a Client)"
    url: "https://www.calbar.ca.gov/Attorneys/Conduct-Discipline/Rules/Rules-of-Professional-Conduct/Current-Rules"
  - title: "California Business and Professions Code §6068(e)"
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=6068.&lawCode=BPC"
  - title: "ABA Formal Opinion 512, Generative Artificial Intelligence Tools (July 29, 2024)"
    url: "https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf"
---

Every managing partner in Century City has had the conversation. An associate used a public AI tool to summarise a deposition. It was fast, the summary was good, and nobody can say for certain where the transcript went. The firm's response was a memo. This article is about what to build instead of a memo.

It is written for the managing partner, the general counsel, or the director of practice technology at a mid-size firm in Los Angeles or Orange County, and it reads the State Bar's guidance the way an engineer would: as a specification.

## What does the State Bar guidance actually say?

It does not create new rules. It applies the existing Rules of Professional Conduct to generative AI, duty by duty.

The guidance, approved by the Board of Trustees in November 2023, walks through confidentiality, competence and diligence, compliance with law, supervision, communication with clients, candor to the tribunal, billing, and the prohibition on discrimination. For each it says what a lawyer must do when the work involves a generative AI tool. The ABA's Formal Opinion 512 from July 2024 reaches similar conclusions under the Model Rules, which matters for firms with offices outside California.

Three of those duties do most of the work in practice.

## What does the confidentiality duty require of the tool?

That confidential client information never enters a system that can retain it, expose it, or train on it, and that a lawyer has read the terms to confirm that.

Rule 1.6 and Business and Professions Code section 6068(e) put the duty on the lawyer, not the vendor. The guidance says a lawyer must not input any confidential information into a tool that lacks adequate protections, should anonymise where possible, and should review the terms of use and privacy policy. That rules out consumer products for client work. It does not rule out a model served inside the firm's own cloud environment, under a written agreement that prohibits retention and training, with the firm's own access controls in front of it.

The architecture that satisfies this is matter-scoped retrieval. Each matter's documents live in their own container. A tool working on a matter can retrieve from that container and nothing else. Conflict walls and privilege are enforced by the access model, which the system logs, rather than by a policy that asks associates to remember. When a lawyer leaves a matter, their access ends and the log shows the date.

## What does supervision look like when the associate is a model?

The same as when the associate is a person: a lawyer reviews the work before it goes out, and the firm has policies that say who reviews what.

The guidance treats generative AI output as something a lawyer must review for accuracy and bias before relying on it, and treats managerial and supervisory lawyers as responsible for the firm's policies on the tool's use under Rules 5.1 and 5.3. Candor to the tribunal adds a sharper edge: fabricated citations in a filing are the lawyer's fabricated citations.

In a deployed system that means two things. Drafting tools cite the source passage for every factual assertion, so review is checking rather than re-reading. And the workflow records the reviewer, so the firm can show who signed off on what.

## How does billing change?

A lawyer bills for the time actually spent, including prompting and review, and does not bill for the time the tool saved.

The guidance is direct on this point, and it has consequences for how a firm prices AI-assisted work. Hourly matters get cheaper for the client. Fixed-fee and alternative-fee matters get more profitable for the firm. The firms that benefit most are the ones that already sell outcomes rather than hours, which is a strategic question the technology only sharpens. If a firm passes the cost of the tool through to clients, the guidance says the fee agreement should disclose it.

## Which workflows should a firm start with?

The ones that cost associate hours the client will not pay for: intake, first-pass document review, and internal research over the firm's own work product.

Intake is the cleanest first pilot. The tool reads the prospective client's documents, drafts the conflicts check inputs and the intake memo, and flags what is missing. It touches one matter, the exposure is bounded, and the result is measurable in hours per intake and in write-offs.

First-pass review over a defined document set is second. The tool tags, summarises and surfaces, and a lawyer decides. It should never be the last set of eyes on a privilege call.

Research over the firm's own briefs, memos and prior work is third, and it is where matter scoping matters most. A retrieval system over the firm's work product is enormously useful and has to respect every wall the firm has ever built.

## What should the firm measure?

Review hours per matter for the document sets in scope, and write-offs on intake, measured before and after on comparable matters.

Those two numbers already exist in the billing system. A pilot that cannot move them has not earned a rollout. We agree the baseline in writing before any build, run the pilot for four to six weeks on one practice group, and report plainly at the end. We do not publish client numbers in these articles.

## What has to be true before the pilot starts?

1. A written AI use policy that the guidance's duties are mapped onto, so the system's controls have something to satisfy.
2. A partner who owns the pilot and will review flagged output.
3. A document management system the tool can read matter by matter, with access groups that already reflect walls.
4. An enterprise agreement with the model vendor that prohibits retention and training, reviewed by someone who has read the guidance.
5. Engagement-letter language on AI use, decided by the firm before a client asks.

## What does this look like on the floor?

An associate in downtown Los Angeles opens a new intake. The tool has read the client's documents inside that matter's container, drafted the conflicts inputs and a memo, and marked three gaps. The associate corrects the memo and sends it to the partner. The log shows the matter, the documents read, the model version, the draft, the edits and the reviewer. When the client asks whether AI was used, the answer is yes, here is how, and here is who reviewed it.

That is a system the guidance was written for. The memo was not.
