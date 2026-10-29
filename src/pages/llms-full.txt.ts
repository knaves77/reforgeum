// /llms-full.txt: every post's full text in one Markdown file, newest first.
import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { getEverything } from '../lib/board';
import { postMarkdown } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const posts = (await getEverything()).reverse();
  const body = [
    `# ${site.title}: full text`,
    '',
    `> ${site.tagline}. ${site.subtitle} Written by ${site.author}.`,
    '',
    ...posts.map((e) => `---\n\n${postMarkdown(e).replace(/^# /, '## ')}`),
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
