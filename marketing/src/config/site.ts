// Site-wide constants. Copy lives in the pages; identity lives here.
export const SITE = {
  name: 'Tenorworth',
  legalEntity: 'TravAlarm, Inc.',
  tagline: 'AI, deployed with care.',
  description:
    'Tenorworth is an AI implementation consultancy that puts working AI systems inside regulated and operations-heavy businesses — safely, on a fixed scope, with a measured return.',
  url: 'https://tenorworth.com',
  // Primary contact channel. Swap for a booking link (Calendly, Cal.com) by
  // setting bookingUrl; every "Book a call" CTA falls back to email when empty.
  email: 'hello@tenorworth.com',
  bookingUrl: '',
  region: 'Southern California',
  linkedin: 'https://www.linkedin.com/in/arkajitbala',
} as const;

export function contactHref(): string {
  return SITE.bookingUrl || `mailto:${SITE.email}`;
}

export const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

// Route list for the sitemap. Keep in sync when pages are added.
export const ROUTES = ['', 'services', 'about', 'contact', 'privacy'] as const;
