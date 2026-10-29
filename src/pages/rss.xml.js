import rss from '@astrojs/rss';
import site from '../data/site.json';
import { getIssues } from '../lib/board';

const LIMIT = 50;

export async function GET(context) {
  const issues = (await getIssues()).reverse().slice(0, LIMIT);
  // Feed readers need absolute links for images and internal links.
  const absolute = (html = '') => html.replace(/(src|href)="\/(?!\/)/g, `$1="${new URL('/', context.site)}`);

  return rss({
    title: site.title,
    description: site.subtitle,
    site: context.site,
    stylesheet: '/rss.xsl',
    trailingSlash: true,
    items: issues.map(({ post }) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.dek,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
      author: site.author,
      content: absolute(post.rendered?.html),
    })),
    customData: '<language>en</language>',
  });
}
