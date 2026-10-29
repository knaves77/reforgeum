import type { APIRoute, GetStaticPaths } from 'astro';
import { getScraps, type Scrap } from '../../../lib/board';
import { renderScrapCard } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const scraps = await getScraps();
  return scraps.map(({ post, issue }) => ({ params: { id: post.id }, props: { post, issue } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post, issue } = props as { post: Scrap; issue: number };
  const body = await renderScrapCard(post, issue);
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/jpeg' } });
};
