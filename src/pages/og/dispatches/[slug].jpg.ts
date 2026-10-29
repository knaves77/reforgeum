import type { APIRoute, GetStaticPaths } from 'astro';
import { getDispatches, type Dispatch } from '../../../lib/board';
import { renderDispatchCard } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const dispatches = await getDispatches();
  return dispatches.map(({ post, issue, slug }) => ({ params: { slug }, props: { post, issue } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post, issue } = props as { post: Dispatch; issue: number };
  const body = await renderDispatchCard(post, issue);
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/jpeg' } });
};
