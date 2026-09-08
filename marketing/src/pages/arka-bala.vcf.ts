import type { APIRoute } from 'astro';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { SITE, AUTHOR, CARD } from '../config/site';

// The contact card behind "Save contact" on /card. Built once at build time
// from the identity in config/site.ts, so nothing here needs editing when a
// title or address changes. nginx serves *.vcf as text/vcard (deploy/nginx);
// iOS and Android then open it straight into the contacts app.

// vCard 3.0 text escaping (RFC 2426 §2.4.2) and 75-octet line folding (§2.6).
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
const fold = (line: string) => line.match(/.{1,74}/g)?.join('\r\n ') ?? line;

const [last, ...restReversed] = AUTHOR.name.split(' ').reverse();
const first = restReversed.reverse().join(' ');

// Contact photo: the Principal's portrait (same file the About page uses),
// squared and shrunk so the card stays small. Falls back to the brand icon
// while the portrait is missing.
// Paths resolve from the project root (where `astro build` runs), not from
// this file: Astro bundles endpoints into dist/ before running them.
async function photoLine(): Promise<string> {
  const portrait = path.join(process.cwd(), 'src/assets/arka-bala.jpg');
  if (existsSync(portrait)) {
    const jpeg = await sharp(readFileSync(portrait))
      .rotate()
      .resize(320, 320, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return `PHOTO;ENCODING=b;TYPE=JPEG:${jpeg.toString('base64')}`;
  }
  const icon = readFileSync(path.join(process.cwd(), 'public/icon-192.png'));
  return `PHOTO;ENCODING=b;TYPE=PNG:${icon.toString('base64')}`;
}

const lines = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${esc(last)};${esc(first)};;;`,
  `FN:${esc(AUTHOR.name)}`,
  `ORG:${esc(SITE.name)}`,
  `TITLE:${esc(AUTHOR.title)}`,
  `EMAIL;TYPE=INTERNET,WORK,PREF:${SITE.email}`,
  CARD.phone ? `TEL;TYPE=CELL,VOICE:${CARD.phone}` : null,
  `URL;TYPE=WORK:${SITE.url}`,
  SITE.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${SITE.linkedin}` : null,
  `ADR;TYPE=WORK:;;;${esc(CARD.city)};${esc(CARD.region)};;${esc(CARD.country)}`,
  `NOTE:${esc(`${SITE.tagline} ${SITE.name} is the AI implementation practice of ${SITE.legalEntity}`)}`,
  `REV:${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
].filter((l): l is string => l !== null);

export const GET: APIRoute = async () => {
  const body = [...lines, await photoLine(), 'END:VCARD'].map(fold).join('\r\n') + '\r\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="${CARD.vcardPath.slice(1)}"`,
    },
  });
};
