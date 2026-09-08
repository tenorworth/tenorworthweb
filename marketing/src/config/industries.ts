// The five sectors the practice serves, with the copy the Insights hub pages
// use. Keep the problem / deployed / measure lines in step with
// brand/image-prompts.md section A.
export const INDUSTRY_IDS = [
  'community-healthcare',
  'credit-unions',
  'law-firms',
  'life-sciences',
  'hospitality',
] as const;

export type IndustryId = (typeof INDUSTRY_IDS)[number];

export interface Industry {
  id: IndustryId;
  name: string;
  // Lower-case form for mid-sentence use (keeps acronyms intact).
  lower: string;
  short: string;
  region: string;
  cities: string[];
  problem: string;
  deployed: string;
  measure: string;
  service: string;
}

export const INDUSTRIES: Record<IndustryId, Industry> = {
  'community-healthcare': {
    id: 'community-healthcare',
    name: 'Community healthcare',
    lower: 'community healthcare',
    short: 'Healthcare',
    region: 'Los Angeles and the Inland Empire',
    cities: ['Los Angeles', 'Long Beach', 'Riverside', 'San Bernardino'],
    problem: 'Referrals and prior-auth paperwork wait on one coordinator. Patients wait on hold.',
    deployed: 'Intake and referral triage agent with human review. Every action logged, PHI never leaves your tenant.',
    measure: 'Hours per week on referral paperwork, before vs. after.',
    service: '/services#pilot',
  },
  'credit-unions': {
    id: 'credit-unions',
    name: 'Credit unions and RIAs',
    lower: 'credit unions and RIAs',
    short: 'Financial',
    region: 'Orange County and San Diego',
    cities: ['Irvine', 'Santa Ana', 'San Diego', 'Carlsbad'],
    problem: 'Member-service reps search three policy binders to answer one question. Examiners ask how you know the answer was right.',
    deployed: 'Retrieval over your own policies and procedures, with citations, role-based access, and an audit trail NCUA can read.',
    measure: 'Average handle time and first-contact resolution.',
    service: '/services#roadmap',
  },
  'law-firms': {
    id: 'law-firms',
    name: 'Law firms',
    lower: 'law firms',
    short: 'Legal',
    region: 'Century City and downtown Los Angeles',
    cities: ['Century City', 'Downtown Los Angeles', 'Pasadena', 'Newport Beach'],
    problem: 'Document review and intake burn associate hours the client will not pay for.',
    deployed: 'Matter-scoped retrieval and drafting assistants. Privilege boundaries enforced per matter, not by policy memo.',
    measure: 'Review hours per matter, write-offs on intake.',
    service: '/services#pilot',
  },
  'life-sciences': {
    id: 'life-sciences',
    name: 'Life sciences',
    lower: 'life sciences',
    short: 'Life sciences',
    region: 'San Diego and Torrey Pines',
    cities: ['Torrey Pines', 'Sorrento Valley', 'Carlsbad', 'Thousand Oaks'],
    problem: 'Deviation write-ups and SOP lookups take days and still miss a reference.',
    deployed: 'Validated retrieval over controlled documents, with version pinning and an audit trail your QA lead signs off on.',
    measure: 'Days to close a deviation. Citations per answer.',
    service: '/services#roadmap',
  },
  hospitality: {
    id: 'hospitality',
    name: 'Hospitality operators',
    lower: 'hospitality operators',
    short: 'Hospitality',
    region: 'Palm Springs and the coast',
    cities: ['Palm Springs', 'Santa Barbara', 'Laguna Beach', 'La Jolla'],
    problem: 'Five properties, five reports, one controller reconciling them at midnight.',
    deployed: 'Nightly reconciliation and reporting automation; guest messaging drafted for a human to send.',
    measure: 'Hours to close the night. Errors caught before the owner’s report.',
    service: '/services#pilot',
  },
};

export const INDUSTRY_LIST = INDUSTRY_IDS.map((id) => INDUSTRIES[id]);
