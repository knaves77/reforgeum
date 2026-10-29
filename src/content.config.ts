import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const PAPER_STYLES = ['newsprint', 'xerox', 'index', 'carbon', 'poster', 'kraft'] as const;

// The CMS can save an untouched optional field as "" or null; treat that as "not set".
const optional = <T extends z.ZodTypeAny>(type: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), type.optional());

// Dispatches: long essays and ramblings, each a pinned pamphlet.
const dispatches = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dispatches' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    dek: optional(z.string()),
    style: optional(z.enum(PAPER_STYLES)),
    stamp: optional(z.string()),
    cover: optional(z.string()),
    tags: z.preprocess((v) => (Array.isArray(v) ? v.filter(Boolean) : []), z.array(z.string())),
    draft: z.preprocess((v) => v === true, z.boolean()),
  }),
});

// Scraps: short notes, read right on the board.
const scraps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/scraps' }),
  schema: z.object({
    title: optional(z.string()),
    date: z.coerce.date(),
    tags: z.preprocess((v) => (Array.isArray(v) ? v.filter(Boolean) : []), z.array(z.string())),
    draft: z.preprocess((v) => v === true, z.boolean()),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    dek: optional(z.string()),
  }),
});

export const collections = { dispatches, scraps, pages };
