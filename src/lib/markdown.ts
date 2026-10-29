// Plain-Markdown versions of posts, for /llms.txt, /llms-full.txt and the per-post .md copies.
import site from '../data/site.json';
import { hrefFor, titleFor, issueNo, fmtDate, KINDS, type Entry } from './board';
import { SITE_URL } from './seo';

const absolute = (md = '') => md.replace(/(\]\(|src=")\/(?!\/)/g, `$1${SITE_URL}/`);

export function postMarkdown(e: Entry) {
  const url = SITE_URL + hrefFor(e);
  const { date, tags } = e.post.data;
  const lines = [`# ${titleFor(e)}`, ''];
  if (e.kind === 'dispatch' && e.post.data.dek) lines.push(`> ${e.post.data.dek}`, '');
  lines.push(`${KINDS[e.kind].label} ${issueNo(e.issue)} · ${fmtDate(date)} · by ${site.author} · ${url}`);
  if (tags.length) lines.push(`Tags: ${tags.join(', ')}`);
  lines.push('', absolute(e.post.body).trim(), '');
  return lines.join('\n');
}

export const markdownResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
