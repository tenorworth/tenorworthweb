// Site-wide constants. Copy lives in the pages; identity lives here.
export const SITE = {
  name: 'Tenorworth',
  legalEntity: 'TravAlarm, Inc.',
  tagline: 'AI, deployed with care.',
  description:
    'Tenorworth is an AI implementation consultancy that puts working AI systems inside regulated and operations-heavy businesses — safely, on a fixed scope, with a measured return.',
  url: 'https://tenorworth.com',
  // Primary contact channel. "Book a call" CTAs go to bookingUrl (our own
  // /book flow, backed by Supabase Edge Functions + Google Calendar) and fall
  // back to email when it is empty.
  email: 'hello@tenorworth.com',
  // Google Voice line. E.164 for tel: links and the vCard; display form for copy.
  phone: '+16507017881',
  phoneDisplay: '+1 (650) 701-7881',
  bookingUrl: '/book',
  // Supabase project URL (no credentials; the Edge Functions are public
  // endpoints with their own validation). Override with PUBLIC_SUPABASE_URL.
  supabaseUrl: 'https://rpvwacqgwuthmnvzqdgs.supabase.co',
  // Cloudflare Turnstile site key for the /book and /card forms. Public by
  // design: it ships in the built HTML. The matching secret key lives in
  // `supabase secrets`. Override with PUBLIC_TURNSTILE_SITE_KEY; set that to an
  // empty string to build without the challenge.
  turnstileSiteKey: '0x4AAAAAAEvbIaLy-oF4NOKu',
  region: 'Southern California',
  linkedin: 'https://www.linkedin.com/in/arkajitbala',
} as const;

// `source` names the CTA (header, home_hero, ...) so the lead row records
// where the visitor came from. Ignored for the mailto fallback.
export function contactHref(source?: string): string {
  if (!SITE.bookingUrl) return `mailto:${SITE.email}`;
  return source ? `${SITE.bookingUrl}?source=${encodeURIComponent(source)}` : SITE.bookingUrl;
}

export function functionsUrl(): string {
  const base = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) || SITE.supabaseUrl;
  return `${base.replace(/\/$/, '')}/functions/v1`;
}

export const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/insights', label: 'Insights' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

// Static route list for the sitemap. Insights posts and hub pages are added
// from the content collection in sitemap.xml.ts. Keep in sync when pages are added.
// /card is deliberately absent: it is the in-person contact page behind the QR
// code and NFC tag (noindex), not a page for search.
export const ROUTES = ['', 'services', 'insights', 'about', 'contact', 'book', 'privacy'] as const;

// In-person contact card (/card) and the vCard it offers (/arka-bala.vcf).
// The QR code and NFC tag both point at /card; `?s=qr` / `?s=nfc` tell the
// lead row how the person arrived. Phone comes from SITE; leave it empty there
// and the card page and vCard simply omit it.
export const CARD = {
  path: '/card',
  vcardPath: '/arka-bala.vcf',
  phone: SITE.phone,
  phoneDisplay: SITE.phoneDisplay,
  city: 'San Diego',
  region: 'CA',
  country: 'USA',
} as const;

// Author entity for Insights posts. One person, one profile, referenced from
// every article's structured data so search and answer engines can tie the
// writing to a real practitioner.
export const AUTHOR = {
  name: 'Arka Bala',
  title: 'Principal AI Architect',
  url: `${SITE.url}/about`,
  sameAs: [SITE.linkedin],
} as const;
