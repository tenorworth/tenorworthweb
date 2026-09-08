---
title: "Policy retrieval an NCUA examiner can audit: AI for Orange County credit unions"
description: "Retrieval over a credit union's own policies for member-service staff, with citations, role-based access and an audit trail NCUA examiners can read."
industry: credit-unions
region: Orange County and San Diego
publishDate: 2026-09-08
heroImage: ../../assets/blog/credit-union-branch-desk-orange-county.jpg
heroAlt: "Member-service desk in a credit union branch after closing, with a brass lamp, a closed navy binder and late coastal light on a cream wall"
heroCaption: "The policy binder is still the source of truth. The question is how fast a rep can find the right page, and prove it."
summary: "A credit union can safely put an AI assistant over its own policies and procedures if the system answers only from those documents, shows the citation with every answer, limits what each role can see, and records who asked what and which version was used. That record is what turns a helpful tool into something an NCUA or DFPI examiner will accept."
keywords: ["AI for credit unions", "NCUA AI examination", "policy retrieval RAG", "member service AI", "12 CFR Part 748", "RIA compliance AI", "Regulation S-P"]
faq:
  - q: "Will NCUA let us use AI in member service?"
    a: "NCUA has not prohibited it. Examiners apply the rules they already have: safeguarding member information under 12 CFR Part 748, third-party due diligence, and sound governance. A retrieval system that answers only from approved documents, with citations and an audit log, fits inside those expectations. A general chatbot that improvises does not."
  - q: "What is the difference between retrieval and a chatbot?"
    a: "Retrieval means the model is handed the relevant passages from your own approved documents and must answer from them, citing the source. A chatbot answers from whatever it learned in training. For a regulated question, only the first is defensible."
  - q: "Does this need member data at all?"
    a: "Not for the first pilot. Policy retrieval works on your procedures, not on member records. Keeping member PII out of scope is the fastest way to a clean start, and the audit story is simpler."
  - q: "How does the same design apply to an RIA?"
    a: "Replace the credit union's policy manual with the adviser's compliance manual, Form ADV, and client agreements. The controls are the same: answers from approved documents only, citations, role-based access, and a log that fits the books-and-records rule and the amended Regulation S-P incident-response requirements."
sources:
  - title: "12 CFR Part 748, Security Program, Report of Suspected Crimes, Suspicious Transactions, Catastrophic Acts and Bank Secrecy Act Compliance (Appendix A: Guidelines for Safeguarding Member Information)"
    url: "https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748"
  - title: "NCUA Letter to Credit Unions 07-CU-13, Evaluating Third Party Relationships"
    url: "https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/evaluating-third-party-relationships"
  - title: "NCUA, Cyber Incident Notification Requirements (12 CFR 748.1(c))"
    url: "https://ncua.gov/regulation-supervision/regulatory-compliance-resources/cybersecurity-resources/cyber-incident-notification-requirements"
  - title: "SEC, Amendments to Regulation S-P (adopted May 16, 2024)"
    url: "https://www.sec.gov/newsroom/press-releases/2024-58"
  - title: "Federal Reserve SR 11-7, Supervisory Guidance on Model Risk Management"
    url: "https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm"
---

A member calls a branch in Irvine to ask whether a skip-a-payment applies to a loan that was modified last year. The rep opens the loan policy, then the modification procedure, then the memo from March that changed the modification procedure. The member waits. The answer is right, probably. The examiner's question, months later, is how anyone knows.

This article is for the COO or chief risk officer of a credit union in Orange County or San Diego, and for the chief compliance officer of an RIA who has the same problem with a different manual.

## What does policy retrieval do that a search box does not?

It answers the question in plain language, from your approved documents only, and shows the passage it relied on.

A search box returns documents. Retrieval returns an answer with a citation. The technical term is retrieval-augmented generation: the system finds the relevant passages in your policy manual, hands them to a language model with the instruction to answer only from those passages, and returns the answer with the source, section and version. If the documents do not contain an answer, it says so and routes the question to a supervisor. It does not improvise.

That last property is what makes the system examinable. Every answer traces to a document that a committee approved on a date.

## What will the examiner actually ask?

Four things, and they are the same questions they ask about any system that touches operations.

**Where does the data live and who can reach it?** Part 748's Appendix A requires a written information security program that protects member information. A policy retrieval pilot can be designed with no member data at all, which keeps it out of the highest-risk tier. When member records are added later, the data stays inside the credit union's own cloud tenant, access is by role, and the model vendor does not train on any of it.

**Who is the vendor and how did you diligence them?** NCUA's Letter 07-CU-13 on third-party relationships still frames examiner expectations: planning, due diligence, contract terms, and ongoing monitoring. The AI vendor and the cloud provider both go through that process, and the contract has to cover data use, breach notice, and exit.

**How do you know the answers are right?** NCUA has no model-risk rule of its own. Examiners tend to borrow the framing of the Federal Reserve's SR 11-7: a model needs an owner, documentation, validation before use, and ongoing monitoring. For retrieval, validation is a test set of real member questions with the answers a supervisor would give, run before go-live and again every time the policy manual changes.

**What happens when it goes wrong?** Since September 2023, 12 CFR 748.1(c) requires a credit union to notify NCUA within 72 hours of a reportable cyber incident. The AI system sits inside the incident response plan like any other system. Its logs make the notification easier to write, not harder.

## What about an RIA?

The same design with a different manual, and two SEC rules that make the audit log worth having.

The Advisers Act compliance-program rule requires written policies and an annual review. A retrieval system over the compliance manual, Form ADV and client agreements gives every associate the same answer with the same citation. The books-and-records rule means the log of questions and answers is a record; keep it accordingly. The 2024 amendments to Regulation S-P require an incident response program and customer notification within 30 days of a breach involving sensitive customer information, with compliance dates in December 2025 for larger advisers and June 2026 for smaller ones. An AI system that touches client data has to sit inside that program from the start.

## What does the audit trail record?

Who asked, what they asked, which documents and versions were retrieved, what the model answered, and what the person did with it.

That is five fields, and the fifth is the one most vendors leave out. When a rep edits an answer before giving it to a member, or overrides it, the log should say so. That is the evidence that a human remained accountable. It is also the fastest way to find the policy passages that confuse people, which is useful to the compliance team on its own.

Version pinning matters as much as logging. If the loan policy changed on the fifteenth, an answer given on the tenth should be reproducible against the version in force on the tenth. The system stores document versions with effective dates and retrieves against the one that applied.

## What should the credit union measure?

Average handle time on policy questions and first-contact resolution, measured on the same call types before and after.

Both numbers already exist in most contact-centre reporting. A pilot that cannot move them has not earned a rollout. We agree the baseline in writing, run the pilot for four to six weeks on one department, and report the result plainly. We do not publish client numbers in these articles, and any range from a vendor should be labelled illustrative until measured on your calls.

## What has to be true before the pilot starts?

1. An approved, current policy library. If the manual has three versions on a shared drive, the Roadmap's first job is choosing one.
2. A named owner in compliance who will sign off on the test set and review flagged answers.
3. A decision to keep member PII out of the first pilot, which we recommend.
4. Vendor diligence files for the cloud and model providers, using the credit union's existing third-party process.
5. Baselines for handle time and first-contact resolution on the call types in scope.

## What does this look like in a branch?

A rep in Carlsbad types the member's question. The assistant returns a two-sentence answer, the policy section, the effective date, and a link. The rep reads it to the member, or corrects it and marks why. The log records all of it. When the examiner asks how you know the answer was right, you show the citation, the version, the test set, and the rep's name.

That is the whole system. It does not replace the rep. It replaces the binder search.
