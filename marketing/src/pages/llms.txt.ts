import type { APIRoute } from 'astro';
import { SITE, AUTHOR } from '../config/site';
import { INDUSTRY_LIST, INDUSTRIES } from '../config/industries';
import { getPosts } from '../lib/posts';

// llms.txt: a plain-text map of the site for answer engines and AI crawlers.
// Spec: https://llmstxt.org/
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} is the AI implementation practice of ${SITE.legalEntity}, based in ${SITE.region}. It serves community healthcare, credit unions and RIAs, law firms, life sciences, and hospitality operators. Engagements are fixed-scope: a two-week AI Readiness Roadmap, a four-to-six-week Pilot on the client's own data, and a Fractional AI Architect retainer. Principal: ${AUTHOR.name}, ${AUTHOR.title}. Contact: ${SITE.email}.`,
    '',
    '## Practice',
    '',
    `- [Services](${SITE.url}/services): the three engagements, what each delivers, and the outcome`,
    `- [About](${SITE.url}/about): the practice, the principal, and seventeen years in regulated environments`,
    `- [Contact](${SITE.url}/contact): how to book a conversation`,
    '',
    '## Sectors',
    '',
    ...INDUSTRY_LIST.map((i) => `- [${i.name} in ${i.region}](${SITE.url}/insights/industry/${i.id}): ${i.problem}`),
    '',
    '## Insights',
    '',
    ...posts.map((p) => `- [${p.data.title}](${SITE.url}/insights/${p.id}): ${p.data.description} (${INDUSTRIES[p.data.industry].name}, ${p.data.region})`),
    '',
    '## Optional',
    '',
    `- [RSS feed](${SITE.url}/rss.xml)`,
    `- [Privacy](${SITE.url}/privacy)`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
