// Structured data (schema.org JSON-LD) so search engines and AI assistants can tell
// what each page is: who writes it, when it was published, and how pages relate.
import site from '../data/site.json';
import { hrefFor, titleFor, excerpt, plainText, KINDS, type Entry } from './board';

export const SITE_URL = 'https://reforgeum.com';
const abs = (path: string) => new URL(path, SITE_URL).href;

export const author = {
  '@type': 'Person',
  '@id': abs('/about/#author'),
  name: site.author,
  url: abs('/about/'),
  description: site.subtitle,
};

export const website = {
  '@type': 'WebSite',
  '@id': abs('/#website'),
  name: site.title,
  alternateName: site.tagline,
  url: abs('/'),
  description: site.subtitle,
  inLanguage: 'en',
  author: { '@id': author['@id'] },
  publisher: { '@id': author['@id'] },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: abs('/archive/?q={search_term_string}') },
    'query-input': 'required name=search_term_string',
  },
};

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });

/** A dispatch is a blog post; a scrap is a short social-style post. */
export function postSchema(e: Entry) {
  const url = abs(hrefFor(e));
  const text = plainText(e.post.body);
  const description = e.kind === 'dispatch' ? (e.post.data.dek ?? excerpt(e.post.body, 160)) : excerpt(e.post.body, 160);
  return graph(website, author, {
    '@type': e.kind === 'dispatch' ? 'BlogPosting' : 'SocialMediaPosting',
    '@id': `${url}#post`,
    headline: titleFor(e).slice(0, 110),
    description,
    url,
    mainEntityOfPage: url,
    datePublished: e.post.data.date.toISOString(),
    dateModified: e.post.data.date.toISOString(),
    author: { '@id': author['@id'] },
    publisher: { '@id': author['@id'] },
    isPartOf: { '@id': website['@id'] },
    image: abs(`/og/${KINDS[e.kind].path}/${e.slug}.jpg`),
    articleSection: KINDS[e.kind].plural,
    keywords: e.post.data.tags.join(', ') || undefined,
    wordCount: text ? text.split(' ').length : 0,
    inLanguage: 'en',
    ...(e.kind === 'scrap' ? { articleBody: text } : {}),
  }, {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.title, item: abs('/') },
      { '@type': 'ListItem', position: 2, name: KINDS[e.kind].plural, item: abs(`/archive/?kind=${e.kind}`) },
      { '@type': 'ListItem', position: 3, name: titleFor(e).slice(0, 110), item: url },
    ],
  });
}
