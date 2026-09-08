import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { INDUSTRY_IDS } from './config/industries';

// Insights (blog). One Markdown file per post in src/content/blog/. The hero
// image is referenced relative to the post and processed by astro:assets, so
// it ships as responsive WebP with width/height set.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(90),
      description: z.string().max(170),
      industry: z.enum(INDUSTRY_IDS),
      region: z.string(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image(),
      heroAlt: z.string(),
      heroCaption: z.string().optional(),
      // Answer-first summary. Rendered under the H1 and used as the abstract
      // in structured data, so an engine can quote it whole.
      summary: z.string(),
      keywords: z.array(z.string()).default([]),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
