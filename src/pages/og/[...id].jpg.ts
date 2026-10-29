import type { APIRoute, GetStaticPaths } from 'astro';
import { getIssues, type Post } from '../../lib/board';
import { renderPostCard } from '../../lib/og';

export const getStaticPaths = (async () => {
  const issues = await getIssues();
  return issues.map(({ post, issue }) => ({ params: { id: post.id }, props: { post, issue } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post, issue } = props as { post: Post; issue: number };
  const body = await renderPostCard(post, issue);
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/jpeg' } });
};
