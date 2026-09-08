import type { APIRoute } from 'astro';
import { SITE, ROUTES } from '../config/site';
import { INDUSTRY_LIST } from '../config/industries';
import { getPosts } from '../lib/posts';

const day = (d: Date) => d.toISOString().split('T')[0];

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const today = day(new Date());
  const latestByIndustry = new Map<string, string>();
  for (const p of posts) {
    const d = day(p.data.updatedDate ?? p.data.publishDate);
    const cur = latestByIndustry.get(p.data.industry);
    if (!cur || d > cur) latestByIndustry.set(p.data.industry, d);
  }

  const entries: { loc: string; lastmod: string; priority?: string }[] = [
    ...ROUTES.map((r) => ({ loc: `${SITE.url}/${r}`, lastmod: today })),
    ...INDUSTRY_LIST.map((i) => ({ loc: `${SITE.url}/insights/industry/${i.id}`, lastmod: latestByIndustry.get(i.id) ?? today })),
    ...posts.map((p) => ({ loc: `${SITE.url}/insights/${p.id}`, lastmod: day(p.data.updatedDate ?? p.data.publishDate), priority: '0.8' })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `  <url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod>${e.priority ? `<priority>${e.priority}</priority>` : ''}</url>`)
      .join('\n') +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
