import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { getEverything } from '../lib/board';
import { feed } from '../lib/feed';

export const GET: APIRoute = async ({ site: url }) =>
  feed(url!, await getEverything(), { title: site.title, description: `${site.subtitle} Every dispatch and scrap.` });
