import type { APIRoute, GetStaticPaths } from 'astro';
import { getDispatches, type Entry } from '../../lib/board';
import { postMarkdown, markdownResponse } from '../../lib/markdown';

export const getStaticPaths = (async () =>
  (await getDispatches()).map((entry) => ({ params: { id: entry.post.id }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(postMarkdown((props as { entry: Entry }).entry));
