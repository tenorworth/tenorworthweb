---
title: "Validated AI retrieval over SOPs and deviations for San Diego biotech under Part 11"
description: "How a San Diego biotech can put AI retrieval over SOPs and deviation records in a way QA will sign off on: version pinning, Part 11 audit trails, and a credibility case."
industry: life-sciences
region: San Diego and Torrey Pines
publishDate: 2026-09-08
heroImage: ../../assets/blog/biotech-qa-office-san-diego.jpg
heroAlt: "Quality-assurance office beside a San Diego biotech lab, with a shelf of blank cream binders, a white lab coat on a hook, a blank sheet and pen on the desk, and the lab out of focus through a glass partition"
heroCaption: "The SOP shelf is the truth. A retrieval system has to answer from the version that was in force on the day."
summary: "A life-sciences company can put AI retrieval over its SOPs and deviation records if the system is treated as GxP software: validated for its intended use, pinned to controlled document versions, logged in a Part 11-compliant audit trail, and reviewed by a person before any answer enters a quality record. The FDA's risk-based credibility framework and ISPE GAMP 5 give QA a familiar way to write the validation case."
keywords: ["AI in GxP", "21 CFR Part 11 AI", "SOP retrieval biotech", "deviation investigation AI", "computer software assurance", "GAMP 5 AI", "San Diego biotech"]
faq:
  - q: "Does an AI retrieval tool have to be validated?"
    a: "If its output can influence a GxP decision or record, yes. Validation is for intended use, so a tool that helps a QA associate find the right SOP passage carries a lighter case than one that drafts the root-cause section of a deviation. Scope the intended use narrowly and the validation case follows."
  - q: "How do you validate something that is not deterministic?"
    a: "The same way you qualify an analyst: with a defined set of questions and acceptable answers, agreed in advance, run before release and again on every change. The FDA's 2025 draft guidance on AI for regulatory decision-making describes a risk-based credibility assessment tied to context of use, and GAMP 5's second edition covers software with machine-learning components. Both give QA a structure they already recognise."
  - q: "Can the model see our batch records?"
    a: "It does not need to for the first pilot. Retrieval over SOPs, work instructions and closed deviation reports delivers most of the value with the smallest data footprint. Batch records and open investigations come later, with a separate change control."
  - q: "What happens when an SOP is revised?"
    a: "The system holds every version with its effective date. Questions are answered against the version in force on the date asked, and the audit trail records which version was retrieved. A revision triggers a re-run of the test set before the new version is served."
sources:
  - title: "21 CFR Part 11, Electronic Records; Electronic Signatures"
    url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11"
  - title: "21 CFR 211.192, Production record review (investigation of discrepancies)"
    url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-C/part-211/subpart-J/section-211.192"
  - title: "FDA, Considerations for the Use of Artificial Intelligence to Support Regulatory Decision-Making for Drug and Biological Products (draft guidance, January 2025)"
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/considerations-use-artificial-intelligence-support-regulatory-decision-making-drug-and-biological"
  - title: "FDA, Computer Software Assurance for Production and Quality System Software"
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/computer-software-assurance-production-and-quality-system-software"
  - title: "ISPE, GAMP 5 Guide, 2nd Edition: A Risk-Based Approach to Compliant GxP Computerized Systems"
    url: "https://ispe.org/publications/guidance-documents/gamp-5-guide-2nd-edition"
---

A deviation opens on a Tuesday in Sorrento Valley. The investigator needs the current version of three SOPs, the last two deviations on the same line, and the CAPA that closed them. Each lives in a different system. The write-up takes four days, and the reviewer still finds a reference to a superseded procedure.

This article is for the head of quality or the VP of operations at a clinical-stage or commercial biotech in San Diego, and for the validation lead who will be asked to sign the case.

## What does retrieval over controlled documents actually do?

It answers a question from the controlled documents in force on the date asked, cites the document, section and version, and refuses to answer from anything else.

That is a narrower thing than a chatbot and a more useful one. The investigator asks which SOP governs line clearance on the fill suite. The system returns the passage, the document number, the version, the effective date, and a link into the document management system. If the question is not answered by any controlled document, it says so. It does not improvise a procedure.

Applied to deviations, the same system surfaces prior events with similar descriptions, the investigations that closed them, and the CAPAs that followed. The investigator still does the investigation. They start it with the record in front of them instead of a search.

## Is this a GxP system?

If its output can influence a quality decision or enter a quality record, yes, and it should be treated as one from the first day.

That means an intended-use statement, a risk assessment, a validation plan proportionate to the risk, change control, and a Part 11 audit trail. Part 11 requires that computer-generated audit trails record the date and time of operator entries and actions, that the system limit access to authorised individuals, and that records be retrievable for the retention period. A retrieval system meets those with the same disciplines as any other quality-system software.

The good news for QA is that the validation case is familiar. The FDA's Computer Software Assurance guidance shifts effort toward critical thinking and risk-based testing rather than exhaustive scripts. GAMP 5's second edition addresses machine-learning components explicitly. And the FDA's January 2025 draft guidance on AI for regulatory decision-making lays out a seven-step, risk-based credibility assessment tied to a defined context of use. A retrieval tool that helps an associate find the right passage sits low on that risk scale. A tool that drafts the root-cause section of a deviation sits higher, and its case is written accordingly.

## How do you validate a system that is not deterministic?

With a test set agreed in advance, acceptance criteria written before the run, and a re-run on every change.

Language models do not give byte-identical output. Retrieval systems are more stable than that reputation suggests, because the passages retrieved are deterministic and the model is instructed to answer from them. The validation approach is the one QA already uses for an analyst: a defined set of questions with acceptable answers, a pass rate, and documented review. The set is run at release, on every SOP revision that touches the scope, and on every model or software change. Failures are deviations in the ordinary sense and go through the ordinary process.

Version pinning is what makes the re-run meaningful. The system holds every document version with its effective date and answers against the version in force on the date of the question. The audit trail records which version was retrieved, so an answer from March can be reproduced in September.

## Where does the data live?

Inside the company's own cloud tenant, with the document management system as the source of record and the retrieval index as a controlled copy.

The index is regenerated from the document management system on a schedule and on every approved change, so it can never be more current than the controlled documents. Nothing is sent to a model vendor for training. Access follows the same roles as the document system, and the audit trail lives with the rest of the quality records. Investigations that are open, batch records, and anything under legal hold stay out of scope until a separate change control brings them in.

## What should the company measure?

Days from deviation opened to investigation submitted, and the number of citation errors found at review, before and after.

Both come out of the quality system's own reporting. The first is what the site head cares about. The second is what QA cares about, and it is the number that justifies the validation effort. We agree the baseline in writing before the build, run the pilot for four to six weeks on one site or one product family, and report the result plainly. We do not publish client numbers in these articles, and any range from a vendor is illustrative until measured on your records.

## What has to be true before the pilot starts?

1. A document management system with effective dates and version history the tool can read.
2. An intended-use statement QA agrees with. Narrow beats broad for the first pilot.
3. A validation lead who will own the test set and sign the summary report.
4. A supplier assessment of the cloud and model vendors under the existing supplier-quality process.
5. Baselines for the two metrics above, on the site or product family in scope.

## What does this look like in the QA office?

An associate in Torrey Pines opens a deviation. The system has already listed the governing SOPs at their current versions, the two prior deviations on the same line, and the CAPA that closed them, each with a citation. The associate writes the investigation with those open. The reviewer checks citations against the versions listed instead of searching for them. The audit trail shows who asked, what was retrieved, at which version, and what was written.

That is a validated system. It is also just a very good filing clerk who never cites the wrong revision.
