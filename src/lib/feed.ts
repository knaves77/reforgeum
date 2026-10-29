import rss from '@astrojs/rss';
import site from '../data/site.json';
import { hrefFor, titleFor, excerpt, type Entry } from './board';

const LIMIT = 50;

/** A full-content RSS feed of the given entries, newest first. */
export function feed(siteUrl: URL, entries: Entry[], { title, description }: { title: string; description: string }) {
  // Feed readers need absolute links for images and internal links.
  const absolute = (html = '') => html.replace(/(src|href)="\/(?!\/)/g, `$1="${new URL('/', siteUrl)}`);

  return rss({
    title,
    description,
    site: siteUrl,
    stylesheet: '/rss.xsl',
    trailingSlash: true,
    items: [...entries]
      .reverse()
      .slice(0, LIMIT)
      .map((e) => ({
        title: titleFor(e),
        pubDate: e.post.data.date,
        description: e.kind === 'dispatch' ? e.post.data.dek : excerpt(e.post.body, 200),
        link: hrefFor(e),
        categories: [e.kind === 'dispatch' ? 'Dispatch' : 'Scrap', ...e.post.data.tags],
        author: site.author,
        content: absolute(e.post.rendered?.html),
      })),
    customData: '<language>en</language>',
  });
}
