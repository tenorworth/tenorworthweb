// Outreach templates for the account pages: the credit-union three-touch sequence and the
// referral-partner sequence, as functions of the person and the account. The wording mirrors
// gtm/outreach-templates.md (kept out of the repo); change both together.
//
// Every message needs a specific line about the organisation. The account's `opening_line`
// supplies it; when it is empty the template leaves a visible placeholder so a generic note
// cannot be sent by accident.

import type { TouchChannel } from './accounts';

export type Audience = 'exec' | 'risk' | 'tech';
export type PartnerPersona = 'msp' | 'cpa' | 'compliance' | 'cfo' | 'cuso';

export const PARTNER_PERSONAS: { id: PartnerPersona; label: string }[] = [
  { id: 'msp', label: 'Managed IT provider' },
  { id: 'cpa', label: 'CPA or audit firm' },
  { id: 'compliance', label: 'Compliance consultant' },
  { id: 'cfo', label: 'Fractional CFO' },
  { id: 'cuso', label: 'CUSO or League partner' },
];

export interface Draft {
  channel: TouchChannel;
  step: 1 | 2 | 3 | 4;
  title: string;         // what the step is, for the UI
  subject: string | null;
  body: string;
  limit?: number;        // LinkedIn connection notes are capped at 300 characters
}

export interface Context {
  firstName: string;
  orgName: string;
  specificLine: string | null;
  sector: string | null;
  foundingRate: string;  // $7,500 as decided 2026-10-27; the composer lets it be edited
}

export const PLACEHOLDER = '[specific line about them]';
export const SHORT_PLACEHOLDER = '[specific line, eight to twelve words]';

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

const SIGNATURE = `Arka Bala
Principal AI Architect, Tenorworth
tenorworth.com · +1 (650) 701-7881`;

const CU_SIGNATURE = `Arka Bala
Principal AI Architect, Tenorworth
Seventeen years building data and AI platforms inside JPMorgan Chase, Scotiabank, KPMG and a specialty insurer.
tenorworth.com · +1 (650) 701-7881`;

const BOOK = 'https://tenorworth.com/book';

const ARTICLES: Record<string, string> = {
  'credit-unions': 'policy-retrieval-credit-unions-orange-county-ncua-audit',
  'community-healthcare': 'ai-referral-prior-auth-community-clinics-los-angeles',
  'law-firms': 'generative-ai-law-firms-los-angeles-state-bar-guidance',
  'life-sciences': 'validated-ai-retrieval-sops-deviations-san-diego-biotech',
  hospitality: 'night-audit-reconciliation-automation-palm-springs-hotels',
  insurance: 'ai-claim-file-california-fair-claims-settlement-practices',
};

export function articleUrl(sector: string | null, campaign: string): string {
  const slug = ARTICLES[sector ?? ''] ?? ARTICLES['credit-unions'];
  return `https://tenorworth.com/insights/${slug}?utm_source=email&utm_medium=outreach&utm_campaign=${campaign}`;
}

const line = (ctx: Context, short = false) => ctx.specificLine?.trim() || (short ? SHORT_PLACEHOLDER : PLACEHOLDER);

// ── Credit unions ───────────────────────────────────────────────────────────

export function cuDraft(step: 1 | 2 | 3 | 4, ctx: Context, audience: Audience = 'exec'): Draft {
  const article = articleUrl(ctx.sector, 'credit-unions');
  switch (step) {
    case 1:
      return {
        channel: 'linkedin_note', step, title: 'Touch 1: LinkedIn connection note', subject: null, limit: 300,
        body: audience === 'risk'
          ? `${ctx.firstName}, I work on AI systems credit unions can put in front of an examiner: answers only from approved policies, citations, a five-field audit log. ${line(ctx, true)} Your side of that design is the part most vendors skip. Would value the connection. Arka Bala`
          : audience === 'tech'
            ? `${ctx.firstName}, I build retrieval systems inside a credit union's own tenant: no training on member data, role-based access, version pinning. ${line(ctx, true)} Connecting as a peer first; the architecture notes are on tenorworth.com. Arka Bala, San Diego`
            : `${ctx.firstName}, I write about AI and NCUA exam expectations for Southern California credit unions. ${line(ctx, true)} Connecting so you can see the work before I ask for any of your time. Arka Bala, San Diego`,
      };
    case 2: {
      const intro = audience === 'risk'
        ? `I am writing to you as well as your chief executive because the design decisions that matter are yours: what the assistant may answer from, who can see what, and what the log must contain.`
        : `I run Tenorworth, an AI implementation practice in San Diego for credit unions and other regulated businesses.`;
      return {
        channel: 'email', step, title: 'Touch 2: email, the examiner’s four questions',
        subject: `${ctx.orgName}: the examiner's four questions about AI`,
        body: `${ctx.firstName},

${line(ctx)}

That is where most credit unions feel AI first. A rep opens the loan policy, then the modification procedure, then the memo that changed it, to answer one member question. The answer is right, probably. Months later the examiner asks how anyone knows.

${intro} The system I build is a retrieval assistant over your own approved policies. It answers only from those documents, shows the section and version with every answer, and logs who asked, what was retrieved, what was answered and what the rep did with it. The first pilot needs no member data at all.

It is designed around the four questions an NCUA examiner asks about any system that touches operations: where the data lives and who can reach it (Part 748), how the vendor was diligenced (07-CU-13), how you know the answers are right (the SR 11-7 framing), and what happens when it goes wrong (the 72-hour rule). I wrote them up here, with sources:
${article}

Would half an hour be worth it to see whether this fits ${ctx.orgName}? Pick a time here: ${BOOK}?source=cu_email. If it is not a fit, I will say so on the call.

${CU_SIGNATURE}`,
      };
    }
    case 3:
      return {
        channel: 'email', step, title: 'Touch 3: email, the founding-client offer',
        subject: `Re: ${ctx.orgName}: the examiner's four questions about AI`,
        body: `${ctx.firstName}, one more note and then I will leave it with you.

I am taking on two founding credit-union clients in Southern California this quarter for the two-week AI Readiness Roadmap, at a founding rate of ${ctx.foundingRate}, in exchange for a reference I can name when the work is done. The Roadmap ends in a written plan for a first pilot with scope, metric and price. If it does not give you a pilot you would fund, you do not pay for it.

Half an hour here if that is of interest: ${BOOK}?source=cu_email
If the timing is wrong, "not now" is a welcome reply and I will not follow up again.

Arka`,
      };
    case 4:
      return {
        channel: 'email', step, title: 'Touch 4: close',
        subject: `Re: ${ctx.orgName}: the examiner's four questions about AI`,
        body: `${ctx.firstName}, closing the loop. If a member-service or compliance workflow becomes a priority in 2027, I am in San Diego and easy to find. Thank you for reading.

Arka`,
      };
  }
}

// ── Referral partners ───────────────────────────────────────────────────────

const PERSONA_WORDS: Record<PartnerPersona, { advises: string; notA: string; keeps: string; firstCall: string; swap: string }> = {
  msp: {
    advises: 'IT', notA: 'an MSP', keeps: 'infrastructure', firstCall: 'IT',
    swap: 'The account, the tenant and the infrastructure stay yours. I build inside the Microsoft or Google environment you already manage, and the logging I add is the kind your security reviews want anyway.',
  },
  cpa: {
    advises: 'audit', notA: 'an accounting firm', keeps: 'audit', firstCall: 'accounting',
    swap: 'Your audit relationship stays yours. What I add is the model-risk and vendor-diligence paper an examiner asks for, which your audit team will see before the examiner does.',
  },
  compliance: {
    advises: 'compliance', notA: 'a compliance consultancy', keeps: 'compliance program', firstCall: 'compliance',
    swap: 'Your compliance program stays the authority. I build the system so that it answers only from the policies you maintain, with citations and a log that fits your review cycle.',
  },
  cfo: {
    advises: 'finance', notA: 'an accounting firm', keeps: 'numbers', firstCall: 'accounting',
    swap: 'You own the client’s numbers. A pilot comes with a before-and-after measure in hours and dollars that you can put in the monthly pack.',
  },
  cuso: {
    advises: 'operations', notA: 'a core vendor', keeps: 'vendor relationships', firstCall: 'integration',
    swap: 'Your members keep their vendor relationships. I fill the gap between what the core offers and what the examiner asks.',
  },
};

export function partnerDraft(step: 1 | 2 | 3 | 4, ctx: Context, persona: PartnerPersona): Draft {
  const w = PERSONA_WORDS[persona];
  const sectorWord = ctx.sector === 'credit-unions' ? 'credit union' : ctx.sector === 'community-healthcare' ? 'clinic' : ctx.sector === 'law-firms' ? 'law firm' : ctx.sector === 'insurance' ? 'broker' : 'regulated';
  switch (step) {
    case 1:
      return {
        channel: 'linkedin_note', step, title: 'Touch 1: LinkedIn connection note', subject: null, limit: 300,
        body: `${ctx.firstName}, I run an AI implementation practice in San Diego for credit unions, clinics and law firms. Your firm advises the same businesses on ${w.advises}. I would like to compare notes on what clients are asking you about AI. No pitch. Arka`,
      };
    case 2:
      return {
        channel: 'email', step, title: 'Email 1: the partner offer',
        subject: `your ${sectorWord} clients and the AI question`,
        body: `${ctx.firstName},

${line(ctx)}

I run Tenorworth, an AI implementation practice in San Diego for regulated businesses: credit unions and RIAs, community clinics, law firms, insurance brokers. The work is fixed-scope: a two-week readiness roadmap, a four-to-six-week pilot on the client's own documents, and a fractional architect retainer. Before this I spent seventeen years building data and AI platforms inside JPMorgan Chase, Scotiabank, KPMG and a specialty insurer, mostly on the governance and audit side.

I am not ${w.notA} and do not intend to become one. When a client of yours asks what to do about AI, I can scope and deliver the part that touches their policies, their documents and their examiner. ${w.swap}

Would twenty minutes next week be worth it? I would bring three things: a referral or white-label arrangement in writing, a 45-minute session I can run for your clients on what an auditor asks about AI, and first call on any ${w.firstCall} work that comes out of my roadmaps.

${SIGNATURE}`,
      };
    case 3:
      return {
        channel: 'email', step, title: 'Email 2: the piece to hand a client',
        subject: `Re: your ${sectorWord} clients and the AI question`,
        body: `${ctx.firstName}, one piece rather than a follow-up.

This is what I would hand a client of yours who asks whether an examiner will accept an AI assistant over their policies. Four questions, with the regulations cited:
${articleUrl(ctx.sector, 'partners')}

If it is useful for one of them, I am glad to walk them through it with you on the line.

Arka`,
      };
    case 4:
      return {
        channel: 'email', step, title: 'Email 3: the client session, then close',
        subject: `Re: your ${sectorWord} clients and the AI question`,
        body: `${ctx.firstName}, I am holding two Thursday lunch slots next month for client sessions titled "What the examiner asks about AI." Forty-five minutes, no pitch, you host. If you would like one for your clients, tell me which Thursday and I will send a one-paragraph description you can forward.

If not, I will stop here. My door is open: tenorworth.com/card has my details. Thank you for reading.

Arka`,
      };
  }
}

// ── Links ───────────────────────────────────────────────────────────────────

export function mailto(to: string | null, subject: string | null, body: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  params.set('body', body.replace(/\n/g, '\r\n'));
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${to ?? ''}?${params.toString().replace(/\+/g, '%20')}`;
}

export function linkedinSearch(name: string, company: string | null): string {
  const q = [name, company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}
