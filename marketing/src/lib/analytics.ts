// Client-side helper for custom Google Analytics events. gtag is only present
// when PUBLIC_GA_MEASUREMENT_ID was set at build, so every call is a no-op
// otherwise. Parameter values are clipped to GA4's 100-character limit.
//
// Event names and parameters are catalogued in marketing/ANALYTICS.md. New
// parameters must also be registered as custom dimensions in GA, or reports
// never show them.

type Gtag = (...args: unknown[]) => void;
type Params = Record<string, string | number | boolean | undefined>;

export function track(name: string, params: Params = {}): void {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) return;
  const clean: Params = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    clean[k] = typeof v === 'string' ? v.slice(0, 100) : v;
  }
  try {
    gtag('event', name, clean);
  } catch {
    /* analytics must never break the page */
  }
}
