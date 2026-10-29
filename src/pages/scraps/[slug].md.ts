import type { APIRoute, GetStaticPaths } from 'astro';
import { getScraps, type Entry } from '../../lib/board';
import { postMarkdown, markdownResponse } from '../../lib/markdown';

export const getStaticPaths = (async () =>
  (await getScraps()).map((entry) => ({ params: { slug: entry.slug }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(postMarkdown((props as { entry: Entry }).entry));
