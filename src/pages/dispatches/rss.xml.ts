import type { APIRoute } from 'astro';
import site from '../../data/site.json';
import { getDispatches } from '../../lib/board';
import { feed } from '../../lib/feed';

export const GET: APIRoute = async ({ site: url }) =>
  feed(url!, await getDispatches(), { title: `${site.title}: Dispatches`, description: 'The long ones: essays and ramblings.' });
