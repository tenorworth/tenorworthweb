import type { APIRoute } from 'astro';
import { SITE, ROUTES } from '../config/site';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().split('T')[0];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ROUTES.map((r) => `  <url><loc>${SITE.url}/${r}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
