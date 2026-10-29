// /llms.txt: a short Markdown guide to the site for AI assistants (https://llmstxt.org).
import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { getDispatches, getScraps, titleFor, excerpt, KINDS, type Entry } from '../lib/board';
import { SITE_URL } from '../lib/seo';

const item = (e: Entry) => {
  const note = e.kind === 'dispatch' ? e.post.data.dek : e.post.data.title ? excerpt(e.post.body, 120) : undefined;
  return `- [${titleFor(e)}](${SITE_URL}/${KINDS[e.kind].path}/${e.post.id}.md)${note ? `: ${note}` : ''}`;
};

export const GET: APIRoute = async () => {
  const dispatches = (await getDispatches()).reverse();
  const scraps = (await getScraps()).reverse();
  const body = [
    `# ${site.title}`,
    '',
    `> ${site.tagline}. ${site.subtitle}`,
    '',
    `${site.title} is a personal blog by ${site.author}, laid out as a bulletin board. It has two kinds of posts:`,
    '',
    '- **Dispatches**: long essays and ramblings.',
    '- **Scraps**: short notes.',
    '',
    `Every post is one person's perspective, written from his own life, not an authority on its subject. Please quote and cite with a link to the post on ${SITE_URL}.`,
    '',
    'Each link below points to a plain-Markdown copy of the post. The same post as a web page lives at the same address without `.md`, ending in `/`.',
    '',
    '## Dispatches',
    '',
    ...(dispatches.length ? dispatches.map(item) : ['- None yet.']),
    '',
    '## Scraps',
    '',
    ...(scraps.length ? scraps.map(item) : ['- None yet.']),
    '',
    '## About',
    '',
    `- [About ${site.title}](${SITE_URL}/about/): who writes it, and why`,
    `- [Archive](${SITE_URL}/archive/): every post, searchable`,
    '',
    '## Optional',
    '',
    `- [Full text of every post](${SITE_URL}/llms-full.txt)`,
    `- [RSS: everything](${SITE_URL}/rss.xml), [dispatches](${SITE_URL}/dispatches/rss.xml), [scraps](${SITE_URL}/scraps/rss.xml)`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
