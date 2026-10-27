# LinkedIn posts, batch 2

Twelve posts for Arka's personal profile, Tuesday to Thursday at 8:00 a.m. Pacific, 10 Nov to
8 Dec 2026. Weighted to credit unions, which is the sector the outbound work is in. Every post
draws on a published Insights article or on something that actually happened; no client
results, no invented anecdotes. Regulatory facts are as cited in the articles' `sources`.

Same mechanics as batch 1: link as the last line (test the first comment on posts 3 and 7 and
compare impressions), zero to three hashtags, reply to every comment in the first hour, repost
from the company page the next morning. Links carry `utm_campaign=batch-2`.

CU article: `https://tenorworth.com/insights/policy-retrieval-credit-unions-orange-county-ncua-audit?utm_source=linkedin&utm_medium=social&utm_campaign=batch-2`
Law article: `https://tenorworth.com/insights/generative-ai-law-firms-los-angeles-state-bar-guidance?utm_source=linkedin&utm_medium=social&utm_campaign=batch-2`

| Post | Slot |
| --- | --- |
| 1. The pilot that needs no member data | Tue 10 Nov |
| 2. Five lawyers, one worry | Wed 11 Nov |
| 3. Three documents, one question | Thu 12 Nov |
| 4. The log an RIA already needs | Tue 17 Nov |
| 5. A chatbot is not retrieval | Wed 18 Nov |
| 6. Diligencing an AI vendor | Thu 19 Nov |
| 7. Validation is a test set | Tue 24 Nov |
| 8. The data boundary in one paragraph | Wed 25 Nov |
| 9. What the teller should not see | Tue 1 Dec |
| 10. Seventy-two hours | Wed 2 Dec |
| 11. The State Bar guidance for a five-lawyer firm | Thu 3 Dec |
| 12. Two founding clients | Tue 8 Dec, only once the terms are decided |

---

## 1. The pilot that needs no member data

```text
The first AI pilot at a credit union does not need a single member record.

Policy retrieval works on your procedures, not on your members. The loan policy, the fee schedule, the skip-a-payment memo from March. A rep asks a question, the system answers from those documents only, and shows the section and the effective date.

Keeping member PII out of the first pilot does three things:

1. It keeps the system out of the highest-risk tier under Part 748.
2. It makes the third-party diligence file short.
3. It lets compliance judge the design on policy questions before anyone argues about data.

Handle time and first-contact resolution on policy questions are already in your contact-centre reporting. That is the measure. If the pilot cannot move them, it has not earned a rollout.

Start where the examiner's questions are easiest to answer.

[CU article link]

#CreditUnions #NCUA #Compliance
```

---

## 2. Five lawyers, one worry

```text
At a bar association mixer in North County last month I spoke with five lawyers from small firms. All five wanted AI that keeps client documents private. All five had the same objection.

Not whether it works. What it costs up front, per case, before the firm knows it will pay back.

That is a fair objection, and it is mostly a scoping problem. A matter-scoped tool, inside the firm's own environment, does not have to be a platform purchase. It can be one workflow, one practice area, one measure, for a fixed fee, with the confidentiality and billing duties from the State Bar's guidance built into the design rather than added by memo.

The guidance is a specification, not a warning. Read that way, it tells you what to build.

[Law article link]

#LawFirms #LegalEthics #GenerativeAI
```

---

## 3. Three documents, one question

```text
A member asks whether skip-a-payment applies to a loan that was modified last year.

The rep opens the loan policy. Then the modification procedure. Then the memo that changed the procedure. The member waits. The answer is right, probably.

That is where handle time goes in a credit union contact centre. Not the hard calls. The ordinary ones that live in three documents.

A retrieval assistant over the approved policy library answers that question in two sentences, with the section, the version and a link. The rep reads it out, or corrects it and marks why. The binder search is gone. The rep is not.

The measure is average handle time and first-contact resolution on the same call types, before and after. Both numbers already exist.

[CU article link]

#CreditUnions #MemberExperience #ContactCenter
```

---

## 4. The log an RIA already needs

```text
For a registered investment adviser, the audit log of an AI assistant is not a nice-to-have. It is a record.

Three rules make that so:

1. The Advisers Act compliance-program rule requires written policies and an annual review. A retrieval system over the compliance manual, Form ADV and client agreements gives every associate the same answer with the same citation.
2. The books-and-records rule means the log of questions and answers is a record. Keep it accordingly.
3. The 2024 amendments to Regulation S-P require an incident response program and customer notification within 30 days of a breach involving sensitive customer information. Compliance dates were December 2025 for larger advisers and June 2026 for smaller ones.

An AI system that touches client data sits inside that program from the first day, or it does not go in.

[CU article link]

#RIA #Compliance #RegulationSP
```

---

## 5. A chatbot is not retrieval

```text
The word "AI" covers two different machines, and only one of them belongs in a regulated workflow.

A chatbot answers from whatever it learned in training. Ask it about your loan modification policy and it will produce something fluent and plausible. It has never seen your policy.

Retrieval hands the model the relevant passages from your own approved documents and instructs it to answer only from those, citing the source. If the documents do not contain an answer, it says so and routes the question to a supervisor. It does not improvise.

The second machine is examinable. Every answer traces to a document a committee approved on a date.

When a vendor says "AI", ask which machine.

[CU article link]

#CreditUnions #AIGovernance
```

---

## 6. Diligencing an AI vendor

```text
NCUA's Letter 07-CU-13 on third-party relationships is from 2007. It still frames how examiners look at an AI vendor: planning, due diligence, contract terms, ongoing monitoring.

The AI model provider and the cloud provider both go through it. The contract has to answer, in writing:

1. What the vendor may do with your data. No training on it is the floor.
2. Where the data is processed and stored, and that it stays in your tenant.
3. Breach notice terms that let you meet your own 72-hour obligation.
4. Access: who at the vendor can see what, and the log of it.
5. Exit: how you get your documents, your logs and your test set back.
6. Subprocessors, named, with notice of changes.

Your existing third-party process can run this. It does not need a new committee. It needs the file.

[CU article link]

#CreditUnions #VendorManagement #NCUA
```

---

## 7. Validation is a test set

```text
"How do you know the answers are right?" is the examiner question that stops most AI projects. The answer is not a benchmark. It is a test set.

NCUA has no model-risk rule of its own. Examiners tend to borrow the framing of the Federal Reserve's SR 11-7: a model needs an owner, documentation, validation before use, and ongoing monitoring.

For a policy assistant, validation looks like this. Take two hundred real member questions. Have a supervisor write the answer each should get, with the policy section. Run the system against them before go-live. Run them again every time the policy manual changes.

The pass rate is a number your compliance officer can sign. The failures are a list of policy passages that confuse people, which is useful on its own.

Validation is not a phase. It is a file that gets re-run.

[CU article link]

#CreditUnions #ModelRisk #SR117
```

---

## 8. The data boundary in one paragraph

```text
Where does the data live, and who can reach it? Part 748's Appendix A asks that of every system that touches member information. Here is the answer for a retrieval assistant, in one paragraph.

The documents stay inside the credit union's own cloud tenant. The model vendor does not train on any of it. Access is by role: the teller's view is not the compliance officer's view. Each answer records which document and which version it used. When member records are added later, they enter under the same controls, and the pilot that came first never needed them.

If a vendor cannot give you that paragraph in writing, you have your answer.

[CU article link]

#CreditUnions #Part748 #DataGovernance
```

---

## 9. What the teller should not see

```text
Role-based access is the least discussed control in an AI assistant and the one that decides whether it passes review.

A policy library has layers. Public disclosures. Internal procedures. The BSA escalation playbook. The fraud thresholds that nobody wants read aloud at a branch window.

A retrieval system enforces that structure in the access model, not in a memo asking people to be careful. The teller asks about skip-a-payment and gets the member-facing procedure. The compliance analyst asks the same question and sees the escalation notes underneath. The log records which view answered.

The same principle, in a law firm, is called a matter wall. In a clinic, minimum necessary. The design is the same: the system can only answer from what the person asking is allowed to read.

[CU article link]

#CreditUnions #AccessControl #Compliance
```

---

## 10. Seventy-two hours

```text
Since September 2023, a federally insured credit union has 72 hours to notify NCUA of a reportable cyber incident. An AI assistant does not change that clock. It should make the notification easier to write.

The system sits inside the incident response plan like any other system: an owner, a contact at the vendor, a kill switch, and logs that say who asked what, which documents were retrieved, and when.

When something goes wrong, those logs are the first paragraph of the notice. Without them, the first 24 of the 72 hours go to reconstruction.

That is the fourth of the four examiner questions. The other three are in the article.

[CU article link]

#CreditUnions #IncidentResponse #NCUA
```

---

## 11. The State Bar guidance for a five-lawyer firm

```text
The State Bar of California's generative AI guidance is written for every lawyer in the state. Read it as a five-lawyer firm and it comes down to four design requirements.

1. Confidentiality. No confidential client information goes into a tool that can retain or train on it. Read the terms; keep the documents in the firm's own environment.
2. Supervision. Review the output the way you would a junior's work. The tool drafts; a lawyer signs.
3. Billing. Charge for the time actually spent, including prompting and reviewing. Not for the time saved.
4. Disclosure. Consider it in every matter; make it where the engagement terms or the client's instructions call for it.

A matter-scoped tool, which can only see the documents of the matter in front of the lawyer, satisfies the first two by construction. The third and fourth are a paragraph in the engagement letter.

[Law article link]

#LawFirms #LegalEthics #StateBar
```

---

## 12. Two founding clients

Post only once the founding rate and the condition are decided (see gtm/README.md).

```text
I am taking on two founding credit-union clients in Southern California this quarter.

The engagement is the two-week AI Readiness Roadmap: interviews with operations and compliance, an inventory of the policies and systems an assistant would touch, a ranked list of workflows with an estimated return for each, the governance gaps, and a written plan for a first pilot with scope, metric and price.

Founding terms: a founding rate, in exchange for a reference I can name once the work is done. And a condition in writing. If the Roadmap does not give you a pilot you would fund, you do not pay for it.

The Roadmap exists for the credit union that is being asked about AI by its board and wants an answer it can defend to its examiner.

If that is you, or someone you work with: https://tenorworth.com/book?source=linkedin_founding&utm_source=linkedin&utm_medium=social&utm_campaign=batch-2

#CreditUnions #NCUA
```
