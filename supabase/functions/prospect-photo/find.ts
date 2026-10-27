// Finds a headshot for a prospect from public sources: Gravatar for their
// email, then the leadership, team and bio pages of their company website.
// Returns the image URL as found (the app hotlinks it with no referrer) and the
// page it came from, or null. No LinkedIn: automated access breaks its terms.
//
// Matching is deliberately conservative. An image counts only when its alt,
// title or file name carries the person's name, or when it is the one image
// sitting next to their name on the page. It must then load, be a raster image
// and be shaped like a portrait, so banners, logos and stock heroes drop out.
import { parseHTML } from 'npm:linkedom@0.18';
import { imageSize } from 'npm:image-size@1.2.1';

export interface Found {
  url: string;
  page: string; // where it was found: a page URL, or 'gravatar'
}

const UA = 'Mozilla/5.0 (compatible; Tenorworth/1.0; +https://tenorworth.com)';
// Some hosts hold non-browser connections for ~10s before answering, so a
// single request gets room, and the whole crawl gets a budget.
const FETCH_MS = 12_000;
const CRAWL_MS = 45_000;
const MAX_PAGES = 9;
const MAX_IMAGE_BYTES = 8_000_000;

// ── Names ───────────────────────────────────────────────────────────────────

/** Lowercase ASCII words: "Kathleen O’Connell-Ruiz" → "kathleen oconnell ruiz". */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

const NOT_NAMES = new Set([
  'mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'ii', 'iii', 'iv', 'esq', 'cpa', 'mba', 'phd', 'md', 'jd', 'cfp', 'cfa',
]);

// Short forms people go by on LinkedIn while the website uses the full name,
// or the other way round. Each group is matched as one first name.
const NICKNAMES = [
  ['william', 'bill', 'will', 'billy'], ['robert', 'bob', 'rob', 'bobby'], ['richard', 'rick', 'rich', 'dick'],
  ['michael', 'mike'], ['james', 'jim', 'jimmy'], ['joseph', 'joe'], ['thomas', 'tom'], ['david', 'dave'],
  ['daniel', 'dan', 'danny'], ['christopher', 'chris'], ['christine', 'chris', 'christina', 'tina'],
  ['katherine', 'kathy', 'kate', 'katie', 'kathryn', 'catherine', 'cathy'], ['kathleen', 'kathy', 'kate'],
  ['susan', 'sue', 'suzie', 'susie', 'suzanne'], ['elizabeth', 'liz', 'beth', 'betsy', 'lisa'],
  ['stephen', 'steve', 'steven'], ['anthony', 'tony'], ['edward', 'ed', 'eddie'], ['gregory', 'greg'],
  ['jeffrey', 'jeff'], ['kenneth', 'ken'], ['lawrence', 'larry'], ['matthew', 'matt'], ['patrick', 'pat'],
  ['patricia', 'pat', 'patty', 'trish'], ['ronald', 'ron'], ['samuel', 'sam'], ['timothy', 'tim'],
  ['andrew', 'andy', 'drew'], ['alexander', 'alex'], ['benjamin', 'ben'], ['charles', 'charlie', 'chuck'],
  ['jennifer', 'jen', 'jenny'], ['jessica', 'jess'], ['kimberly', 'kim'], ['deborah', 'debbie', 'deb'],
  ['cynthia', 'cindy'], ['theresa', 'terry', 'teresa', 'terri'], ['margaret', 'maggie', 'peggy', 'meg'],
  ['nicholas', 'nick'], ['jonathan', 'jon'], ['donald', 'don'], ['douglas', 'doug'], ['raymond', 'ray'],
  ['gerald', 'jerry'], ['frederick', 'fred'], ['victoria', 'vicki', 'vicky'], ['rebecca', 'becky'],
  ['judith', 'judy'], ['barbara', 'barb'], ['pamela', 'pam'], ['jacqueline', 'jackie'],
];

export interface NameParts {
  firsts: string[]; // the first name and its nickname group
  last: string;     // may hold spaces after norm(): "smith jones"
}

export function nameParts(name: string): NameParts | null {
  const words = norm(name.replace(/\(.*?\)/g, ' ').replace(/,.*$/, ''))
    .split(' ')
    .filter((w) => w.length > 1 && !NOT_NAMES.has(w));
  if (words.length < 2) return null;
  const first = words[0];
  const group = NICKNAMES.find((g) => g.includes(first));
  return { firsts: group ?? [first], last: words[words.length - 1] };
}

/** Matches "first [middle…] last" in norm()ed text. */
export function nameRegex(n: NameParts): RegExp {
  return new RegExp(`\\b(?:${n.firsts.join('|')})(?: [a-z]+){0,2} ${n.last}\\b`);
}

// ── Fetching ────────────────────────────────────────────────────────────────

async function get(url: string, accept: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function getHtml(url: string): Promise<{ url: string; html: string } | null> {
  const res = await get(url, 'text/html,application/xhtml+xml');
  if (!res || !(res.headers.get('content-type') ?? '').includes('html')) return null;
  const html = await res.text();
  return { url: res.url || url, html: html.slice(0, 3_000_000) };
}

// ── Gravatar ────────────────────────────────────────────────────────────────

async function gravatar(email: string): Promise<Found | null> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // d=404 makes Gravatar answer 404 instead of a generic silhouette, both now
  // and later in the browser, where the app then falls back to initials.
  const url = `https://gravatar.com/avatar/${hash}?s=256&d=404`;
  return (await get(url, 'image/*')) ? { url, page: 'gravatar' } : null;
}

// ── Site crawl ──────────────────────────────────────────────────────────────

// Pages worth opening, best first. Bio pages (a URL with the person's name in
// it) outrank everything and are scored separately.
// Whole words only: "wealth-management" and "annual-meeting" are not people.
const PAGE_HINTS: [RegExp, number][] = [
  [/leader|executive|\bteam\b|\bstaff\b|\bpeople\b|\bofficers\b|\bmeet\b/, 4],
  [/\battorneys?\b|\blawyers?\b|\bprofessionals\b|\bbios?\b/, 4],
  [/\bboard\b|\bdirectors\b|\bgovernance\b|\bvolunteers\b/, 2],
  [/\babout\b|who-we-are|our-story/, 1],
];
const HINT_WORDS = new RegExp(PAGE_HINTS.map(([re]) => re.source).join('|'), 'i');

// Link text like "Greg Shaver": someone else's bio page, not worth a request.
const PERSON_LINK = /^[A-Z][a-z'’.-]+(?: [A-Z][a-z'’.-]*){1,3}$/;

const COMMON_PATHS = ['/about-us', '/about', '/leadership', '/about-us/leadership', '/our-team'];

const host = (u: URL) => u.hostname.replace(/^www\./, '');

function pageScore(url: URL, text: string, n: NameParts): number {
  const path = norm(decodeURIComponent(url.pathname));
  if (n.firsts.some((f) => path.includes(f)) && path.includes(n.last)) return 10;
  const hay = `${url.pathname.toLowerCase()} ${text.toLowerCase()}`;
  for (const [re, score] of PAGE_HINTS) if (re.test(hay)) return score;
  return 0;
}

const SKIP_PAGES = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?)$|\/(wp-content|login|sign-?in|apply|rates|calculators?|blog|news|careers|jobs)\b/i;

function pageLinks(doc: Document, base: string, site: string, n: NameParts): [string, number][] {
  const out: [string, number][] = [];
  for (const a of doc.querySelectorAll('a[href]')) {
    let u: URL;
    try {
      u = new URL(a.getAttribute('href') ?? '', base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol) || host(u) !== site || SKIP_PAGES.test(u.pathname)) continue;
    u.hash = '';
    const text = (a.textContent ?? '').trim();
    const score = pageScore(u, text, n);
    if (score < 10 && PERSON_LINK.test(text) && !HINT_WORDS.test(text)) continue;
    if (score > 0) out.push([u.href, score]);
  }
  return out;
}

async function sitemapLinks(origin: string, site: string, n: NameParts): Promise<[string, number][]> {
  const locs = async (url: string) => {
    const res = await get(url, 'application/xml,text/xml');
    if (!res) return [];
    const xml = (await res.text()).slice(0, 2_000_000);
    return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  };
  let urls = await locs(`${origin}/sitemap.xml`);
  // A sitemap index lists more sitemaps; the page sitemaps are the useful ones.
  const children = urls.filter((u) => /\.xml(\?|$)/.test(u));
  if (children.length) {
    const pick = [...children.filter((u) => /page/i.test(u)), ...children.filter((u) => !/page/i.test(u))].slice(0, 2);
    urls = (await Promise.all(pick.map(locs))).flat();
  }
  const out: [string, number][] = [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (host(u) !== site || SKIP_PAGES.test(u.pathname)) continue;
      const score = pageScore(u, '', n);
      if (score > 0) out.push([u.href, score]);
    } catch { /* skip */ }
  }
  return out;
}

// ── Images on a page ────────────────────────────────────────────────────────

const IMAGE_ELEMENTS = 'img, picture source, [style*="url("], [data-bg], [data-background-image]';
const SKIP_IMAGES = /logo|icon|sprite|favicon|placeholder|spacer|blank|pixel|badge|banner|hero|seal|award|certif|cdfi|ncua|equal-?housing|linkedin|twitter|facebook|instagram|youtube|\/themes?\/|\.svg(\?|$)/i;

// An avatar needs little: take the smallest srcset entry at least 240px wide,
// or the largest when none is.
function fromSrcset(srcset: string): string | null {
  const entries = srcset.split(',').map((part) => {
    const [url, size = '1x'] = part.trim().split(/\s+/);
    return { url, w: size.endsWith('w') ? parseFloat(size) : parseFloat(size) * 300 };
  }).filter((e) => e.url && e.w > 0).sort((a, b) => a.w - b.w);
  return (entries.find((e) => e.w >= 240) ?? entries[entries.length - 1])?.url ?? null;
}

function imageUrl(el: Element, base: string): string | null {
  const attr = (k: string) => el.getAttribute(k)?.trim() || null;
  const raw =
    attr('data-src') ?? attr('data-lazy-src') ?? attr('data-original') ??
    (attr('data-srcset') && fromSrcset(attr('data-srcset')!)) ??
    (attr('srcset') && fromSrcset(attr('srcset')!)) ??
    attr('src') ?? attr('data-bg') ?? attr('data-background-image') ??
    attr('style')?.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1] ?? null;
  if (!raw || raw.startsWith('data:')) return null;
  for (const k of ['width', 'height']) {
    const v = Number(attr(k));
    if (v && v < 60) return null;
  }
  try {
    const u = new URL(raw, base);
    if (!/^https?:$/.test(u.protocol) || SKIP_IMAGES.test(u.pathname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

interface PageImage { url: string; alt: string }

function imagesIn(root: Element, base: string): PageImage[] {
  const found = new Map<string, PageImage>();
  const all = root.matches?.(IMAGE_ELEMENTS) ? [root, ...root.querySelectorAll(IMAGE_ELEMENTS)] : root.querySelectorAll(IMAGE_ELEMENTS);
  for (const el of all) {
    const url = imageUrl(el, base);
    const key = url?.replace(/-\d+x\d+(\.\w+)$/, '$1'); // WordPress size variants are one image
    if (url && key && !found.has(key)) found.set(key, { url, alt: el.getAttribute('alt') ?? '' });
  }
  return [...found.values()];
}

// An image next to the name whose alt text describes something else
// ("Executive Team", "Newsweek.png") is not their photo. No alt is fine.
function altFits(alt: string, n: NameParts): boolean {
  const words = norm(alt);
  return !words || words.includes(n.last) || n.firsts.some((f) => words.includes(f)) ||
    /\b(head ?shot|portrait|photo|picture|profile)\b/.test(words);
}

interface Candidate { url: string; page: string; score: number }

function candidatesOn(doc: Document, page: string, n: NameParts): Candidate[] {
  const re = nameRegex(n);
  const out: Candidate[] = [];

  // The image itself names the person: alt, title or file name.
  for (const el of doc.querySelectorAll(IMAGE_ELEMENTS)) {
    const url = imageUrl(el, page);
    if (!url) continue;
    const file = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
    const label = norm(`${el.getAttribute('alt') ?? ''} ${el.getAttribute('title') ?? ''} ${el.getAttribute('aria-label') ?? ''}`);
    const fileWords = norm(file);
    if (re.test(label)) out.push({ url, page, score: 100 });
    else if (fileWords.includes(n.last) && n.firsts.some((f) => fileWords.includes(f))) out.push({ url, page, score: 90 });
  }

  // The one image next to a short block of text that names them: climb from
  // the name until a container holds an image, and give up once it holds more
  // than one, since that is a grid of several people. Most pages never mention
  // the person, so check the whole text once before walking every element.
  if (!re.test(norm(doc.body?.textContent ?? ''))) return out;
  for (const el of doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, strong, b, a, div, li, figcaption, td, dt, dd')) {
    const text = norm(el.textContent ?? '');
    if (text.length > 80 || !re.test(text)) continue;
    let node: Element | null = el;
    for (let level = 0; node && level <= 5; level++, node = node.parentElement) {
      const imgs = imagesIn(node, page);
      if (imgs.length === 1) {
        if (altFits(imgs[0].alt, n)) out.push({ url: imgs[0].url, page, score: 60 - level * 6 });
        break;
      }
      if (imgs.length > 1) break;
    }
  }
  return out;
}

// ── Checking the image ──────────────────────────────────────────────────────

/** The URL to keep if it loads over https as a portrait-shaped raster, else null. */
async function usable(url: string): Promise<string | null> {
  const https = url.replace(/^http:/, 'https:');
  const res = await get(https, 'image/avif,image/webp,image/png,image/jpeg,image/*');
  if (!res) return null;
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/') || type.includes('svg')) return null;
  if (Number(res.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) return null;
  try {
    const { width = 0, height = 0 } = imageSize(bytes);
    if (Math.min(width, height) < 80) return null;
    const ratio = width / height;
    // Landscape images are group shots and banners, even when the file is
    // named after the person ("Jane-Doe-Staff-Photos.jpg").
    if (ratio < 0.5 || ratio > 1.34) return null;
  } catch {
    return null;
  }
  return res.url || https;
}

// ── Entry point ─────────────────────────────────────────────────────────────

export async function findPhoto(p: { name: string; email: string | null; website: string | null }): Promise<Found | null> {
  if (p.email) {
    const g = await gravatar(p.email);
    if (g) return g;
  }

  const n = nameParts(p.name);
  if (!n || !p.website || !/^https?:\/\//i.test(p.website)) return null;

  const started = Date.now();
  const home = await getHtml(p.website);
  if (!home) return null;
  const origin = new URL(home.url).origin;
  const site = host(new URL(home.url));

  const queue = new Map<string, number>(); // url → score
  const seen = new Set<string>(); // requested or read, so never queued again
  const enqueue = (links: [string, number][]) => {
    for (const [u, s] of links) if (!seen.has(u) && (queue.get(u) ?? 0) < s) queue.set(u, s);
  };

  const candidates: Candidate[] = [];
  const done = new Set<string>(); // pages read, by final URL after redirects
  const read = (url: string, html: string) => {
    if (done.has(url)) return;
    done.add(url);
    seen.add(url);
    const { document } = parseHTML(html);
    candidates.push(...candidatesOn(document, url, n));
    enqueue(pageLinks(document, url, site, n));
  };

  read(home.url, home.html);
  enqueue(await sitemapLinks(origin, site, n));
  enqueue(COMMON_PATHS.map((path) => [`${origin}${path}`, 0.5]));

  // Open the most promising pages a few at a time; stop at the first page that
  // gives a confident match.
  let opened = 1;
  while (
    queue.size && opened < MAX_PAGES && Date.now() - started < CRAWL_MS &&
    !candidates.some((c) => c.score >= 60)
  ) {
    const batch = [...queue.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([u]) => u);
    batch.forEach((u) => { queue.delete(u); seen.add(u); });
    opened += batch.length;
    const pages = await Promise.all(batch.map(getHtml));
    for (const page of pages) if (page) read(page.url, page.html);
  }

  const tried = new Set<string>();
  const ranked = candidates.sort((a, b) => b.score - a.score).filter((c) => !tried.has(c.url) && tried.add(c.url));
  for (const c of ranked.slice(0, 4)) {
    const url = await usable(c.url);
    if (url) return { url, page: c.page };
  }
  return null;
}
