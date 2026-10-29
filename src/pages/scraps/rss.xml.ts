import type { APIRoute } from 'astro';
import site from '../../data/site.json';
import { getScraps } from '../../lib/board';
import { feed } from '../../lib/feed';

export const GET: APIRoute = async ({ site: url }) =>
  feed(url!, await getScraps(), { title: `${site.title}: Scraps`, description: 'The short ones: notes scribbled and pinned up.' });
