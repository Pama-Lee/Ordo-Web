import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Ordo Team'),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    lang: z.enum(['zh-CN', 'en', 'zh-TW']).default('zh-CN'),
    draft: z.boolean().default(false),
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/changelog' }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    title: z.string(),
    lang: z.enum(['zh-CN', 'en', 'zh-TW']).default('zh-CN'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, changelog };
