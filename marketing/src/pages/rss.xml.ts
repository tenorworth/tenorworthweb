import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config/site';
import { INDUSTRIES } from '../config/industries';
import { getPosts } from '../lib/posts';

export async function GET(_ctx: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.name} Insights`,
    description: 'Plain-spoken writing on deploying AI inside regulated and operations-heavy businesses in Southern California.',
    site: SITE.url,
    // Astro's build.format = 'file' serves /insights/slug, never /insights/slug/.
    trailingSlash: false,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishDate,
      link: `/insights/${p.id}`,
      categories: [INDUSTRIES[p.data.industry].name, ...p.data.keywords],
      author: 'hello@tenorworth.com (Arka Bala)',
    })),
    customData: '<language>en-us</language>',
  });
}
