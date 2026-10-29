// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// The sitemap reads each built page: forwarding pages are left out, and posts get
// their publish date as <lastmod>.
const builtPage = (url) => {
  try {
    return readFileSync(`dist${new URL(url).pathname}index.html`, 'utf8');
  } catch {
    return '';
  }
};
const isForward = (url) => builtPage(url).includes('http-equiv="refresh"');
const publishedOn = (url) => builtPage(url).match(/property="article:published_time" content="([^"]+)"/)?.[1];

export default defineConfig({
  // The public address, used for RSS, the sitemap, canonical URLs and social cards.
  site: 'https://reforgeum.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (url) => !isForward(url),
      serialize(item) {
        const lastmod = publishedOn(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  build: {
    // The CSS is small, so ship it inside each page: no render-blocking request.
    inlineStylesheets: 'always',
  },
  // Start fetching a page as soon as a reader hovers or taps its link.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
