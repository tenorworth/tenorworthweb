---
title: "AI in the claim file under California's Fair Claims Settlement Practices Regulations"
description: "How a Southern California claims operation can use AI for file summaries and coverage analysis without breaking the 15-, 40- and 30-day clocks or Bulletin 2022-5."
industry: insurance
region: The San Fernando Valley, Orange County and San Diego
publishDate: 2026-09-28
heroImage: ../../assets/blog/claims-desk-woodland-hills.jpg
heroAlt: "Claims desk in a Woodland Hills insurance office, a thick claim file open with photographs and an estimate clipped to it, a desk calendar with one date circled, and warm Valley light through the blinds"
heroCaption: "The file is still the record the Commissioner examines. The question is who read all four hundred pages, and how fast."
summary: "A claims operation in California can use AI to summarise files, extract dates, draft status letters and analyse coverage against the policy form, provided the licensed adjuster makes every determination, every AI output is filed as a work paper under 10 CCR 2695.3, the system cites the policy provision and regulation it relied on, and no model uses ZIP code or other proxies the Department of Insurance named in Bulletin 2022-5. Built that way, the tool shortens the path to the 40-day decision instead of becoming the reason for a late one."
keywords: ["AI claims adjusting California", "Fair Claims Settlement Practices Regulations", "10 CCR 2695.7", "CDI Bulletin 2022-5", "claims file summarization", "independent adjuster AI", "TPA AI governance", "insurance broker submission intake AI"]
faq:
  - q: "Can an AI system deny a claim in California?"
    a: "No, and nothing in this design lets it. Under 10 CCR 2695.7(b)(1) a denial must be in writing and list every factual and legal basis, including the policy provision relied on. The licensed adjuster writes and signs that letter. The system's job is to hand them the passages, dates and citations that make the letter accurate and on time."
  - q: "Has California adopted the NAIC model bulletin on insurers' use of AI?"
    a: "No. The NAIC's adoption map, as of August 31, 2026, lists California under its own insurance-specific guidance, Bulletin 2022-5 of June 30, 2022, rather than among the twenty-five jurisdictions that adopted the model bulletin. Bulletin 2022-5 is the document a California examiner will have in mind, and it is more pointed about claims practices than the NAIC text."
  - q: "Where do the AI summaries go?"
    a: "In the claim file. 10 CCR 2695.3 requires the file to hold every document, note and work paper that pertains to the claim, in enough detail that the events and their dates can be reconstructed. An AI summary an adjuster relied on is a work paper. Filing it, with the prompt, the version and the adjuster's edits, is what makes the file examinable."
  - q: "Does this apply to a third-party administrator or an independent adjusting firm?"
    a: "Yes. The regulations apply to every licensee handling claims, and the adjusters at an independent firm are individually licensed under Insurance Code section 14022. The difference is commercial: a TPA or independent firm also has to satisfy each carrier client's own AI governance, so the audit log has to be exportable per account."
  - q: "What about the brokerage side?"
    a: "The same controls with a different document set. Submission intake reads applications, loss runs and statements of values into a structured summary with a missing-information list; policy checking compares the issued policy against the binder and quote and lists every discrepancy with a page reference. The broker still reviews, and the errors-and-omissions carrier gets a log that shows they did."
sources:
  - title: "10 CCR § 2695.3, File and Record Documentation"
    url: "https://www.law.cornell.edu/regulations/california/10-CCR-2695.3"
  - title: "10 CCR § 2695.5, Duties upon Receipt of Communications"
    url: "https://www.law.cornell.edu/regulations/california/10-CCR-2695.5"
  - title: "10 CCR § 2695.7, Standards for Prompt, Fair and Equitable Settlements"
    url: "https://www.law.cornell.edu/regulations/california/10-CCR-2695.7"
  - title: "California Department of Insurance, Fair Claims Settlement Practices Regulations"
    url: "https://www.insurance.ca.gov/01-consumers/130-laws-regs-hearings/05-CCR/fair-claims-regs.cfm"
  - title: "California Insurance Code § 790.03, Unfair methods of competition and unfair and deceptive acts"
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=INS&sectionNum=790.03"
  - title: "California Insurance Code § 14022, Insurance Adjuster Act, licensing"
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=INS&sectionNum=14022"
  - title: "California Department of Insurance, Bulletin 2022-5, Allegations of Racial Bias and Unfair Discrimination in Marketing, Rating, Underwriting, and Claims Practices (June 30, 2022)"
    url: "https://www.insurance.ca.gov/0250-insurers/0300-insurers/0200-bulletins/bulletin-notices-commiss-opinion/upload/BULLETIN-2022-5-Allegations-of-Racial-Bias-and-Unfair-Discrimination-in-Marketing-Rating-Underwriting-and-Claims-Practices-by-the-Insurance-Industry.pdf"
  - title: "NAIC, Use of Artificial Intelligence Systems by Insurers: legal adoption map (status as of August 31, 2026)"
    url: "https://content.naic.org/sites/default/files/legal-adoption-map-ai-model-bulletin.pdf"
  - title: "California Department of Insurance, 2026 Guide for Adjusting Property Claims in California After a Major Disaster"
    url: "https://www.insurance.ca.gov/0200-industry/0050-renew-license/0200-requirements/upload/2026-Guide-for-Adjusting-Property-Claims-in-California-After-a-Major-Disaster_Final.pdf"
---

A water-damage claim on a small apartment building in Woodland Hills arrives on a Tuesday. By the time the proof of claim is complete there are two contractor estimates, a plumber's invoice, sixty photographs, a tenant's statement, the policy form with three endorsements, and an email thread with the public adjuster. Four hundred pages, give or take. The adjuster has thirty other files, and this one has forty calendar days on it.

This article is for the claims manager, the head of a third-party administrator, or the principal of an independent adjusting firm in Southern California who is being asked about AI by their carrier clients and their own staff at the same time. The brokerage side gets its own section at the end.

## What does the system actually do in a claim file?

It reads the whole file so the adjuster does not have to read it twice, and it keeps the clocks.

Four things, in practice. It produces a summary of the file with every fact tied to the page it came from. It extracts the dates that matter under the regulations: notice of claim, each communication, proof of claim, and the deadlines those dates start. It drafts the routine correspondence, the acknowledgment and the thirty-day status letter, for the adjuster to edit and send. And it analyses coverage by placing the facts against the policy form and endorsements, returning the provisions that apply with the text quoted, and the ones that might exclude, with the text quoted.

What it does not do is decide. The determination, the reserve, and the denial letter are the licensed adjuster's, and the design makes that visible rather than assuming it.

## Which clocks does it protect?

The three in 10 CCR 2695.5 and 2695.7, and the one most files miss.

Section 2695.5 requires the insurer to acknowledge notice of a claim within fifteen calendar days and to respond to any communication that reasonably calls for a response within fifteen calendar days. Section 2695.7(b) requires the claim to be accepted or denied, in whole or in part, within forty calendar days of proof of claim. Section 2695.7(c)(1) says that if more time is needed, the insurer must send written notice of the need for more time within that forty-day window, and then every thirty days until a determination is made.

The one most files miss is the fifteen-day response clock, because it restarts with every letter from a public adjuster or an attorney. A system that reads inbound correspondence as it is filed and flags the reply date does more for a market conduct exam than any dashboard.

## What will the Department of Insurance look for?

The claim file, first, and then the reasons.

**The file.** Section 2695.3 requires every claim file to contain all documents, notes and work papers that reasonably pertain to the claim, in enough detail that the pertinent events and their dates can be reconstructed. An AI summary the adjuster relied on is a work paper. So is the coverage analysis. They go in the file, with the version of the system that produced them and the adjuster's edits, or the file is incomplete in a way an examiner will notice.

**The reasons.** Section 2695.7(b)(1) requires a written denial to list every basis for it, with the factual and legal grounds for each, and to cite the policy provision or statute relied on with an explanation of how it applies. A coverage analysis that quotes the provision and the page number is a head start on that letter. It is not the letter. The adjuster writes it, and the log records that they did.

**The investigation.** Section 2695.7(d) requires a thorough, fair and objective investigation, and forbids persisting in requests for information not reasonably needed. A system that generates document requests needs a person approving each one, or it will ask for a fourth estimate because a template said so.

**The proxies.** California did not adopt the NAIC model bulletin on insurers' use of AI. The NAIC's own adoption map, as of August 31, 2026, lists California under its own insurance-specific guidance: Bulletin 2022-5, issued June 30, 2022. That bulletin is blunt about claims. Among the practices the Department said it was investigating were subjecting claims from certain ZIP codes to special scrutiny and using facial recognition in claims decisions, and it requires the specific reasons for any adverse action to be given to the consumer. The consequence for design is simple. No triage or fraud-scoring model in the pilot uses ZIP code, name, language, or any feature that stands in for a protected class, and the feature list is written down so a reviewer can check.

**The licence.** Under Insurance Code section 14022, a person who adjusts claims for a carrier without being that carrier's employee must hold an independent adjuster licence. The tool has no licence. Every determination in the log carries the name of the adjuster who made it.

## What has to be true before the pilot starts?

Five things, and the two-week Roadmap exists to confirm them.

1. A claims system the pilot can read from and write to, so the summaries land in the file rather than in a separate tool nobody examines.
2. A written list of the policy forms and endorsements in scope, with versions. Coverage analysis against the wrong edition of a form is worse than none.
3. A data boundary the carrier clients accept in writing: claimant PII, medical records on bodily-injury and workers' compensation files, and photographs stay in your tenant, and the model vendor does not train on any of it.
4. A named claims supervisor who owns the test set, which is a sample of closed files with the determinations a senior adjuster would have made, run before go-live and again whenever a form changes.
5. Baselines. Days from proof of claim to determination, the count of late acknowledgments and late status letters per quarter, and files per adjuster per week, measured before anything is switched on.

## What should the operation measure?

Days from proof of claim to determination, and late letters per quarter.

Both numbers already exist in most claims systems, and the second one is what a market conduct examiner samples for. A pilot that does not move them has not earned a rollout. We agree the baseline in writing, run the pilot for four to six weeks on one line of business, and report the result plainly. We do not publish client numbers in these articles, and any vendor's cycle-time figure should be treated as illustrative until measured on your files.

## What about after a wildfire?

The design holds, and the clocks get harder.

The Department's 2026 guide for adjusting property claims after a major disaster restates the regulations for the situation where a carrier brings in out-of-state adjusters under emergency registration and files arrive by the hundred. That is exactly when a system that reads every inbound document the day it arrives, extracts the dates and drafts the status letters earns its place. It is also when the rule about the adjuster deciding matters most, because those files are the ones a Commissioner reads.

## What about the brokerage side?

The same controls with a different document set, and lower stakes on the regulatory side.

A wholesale broker in Irvine receives a submission as forty PDFs: the application, five years of loss runs, a statement of values, a supplemental. Intake reads them into one structured summary with a list of what is missing, so the broker's first email to the retail agent is the right one. Policy checking compares the issued policy against the binder and the quote and lists every discrepancy with a page reference, which is the errors-and-omissions exposure most agencies handle by hoping. In both cases the broker reviews and decides, and the log shows they did, which is what the E&O carrier will want to see if the question ever comes up.

## What does this look like on the desk?

The adjuster opens the Woodland Hills file on Wednesday morning. The summary is there, two pages, every line with a page number. The dates panel says proof of claim was received on the twelfth, the forty-day date is the twenty-second of next month, and a letter from the public adjuster arrived yesterday, so a response is due in fourteen days. The coverage analysis quotes the water-damage provision, the mould endorsement, and the exclusion that might apply, each with its page. The adjuster reads the sixty photographs themselves, because that is judgment, decides the claim in part, and writes the letter. The system files everything it produced, and everything the adjuster changed, in the claim file.

That is the whole system. It does not adjust the claim. It reads the file so the adjuster can.
