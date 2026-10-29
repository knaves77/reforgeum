// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Post dates for the sitemap's <lastmod>, read from each post's front matter.
const postDates = new Map();
for (const kind of ['dispatches', 'scraps']) {
  for (const file of readdirSync(`src/content/${kind}`).filter((f) => f.endsWith('.md'))) {
    const date = readFileSync(`src/content/${kind}/${file}`, 'utf8').match(/^date:\s*["']?([\d-]+)/m)?.[1];
    if (date) postDates.set(`/${kind}/${file.replace(/\.md$/, '')}/`, new Date(date).toISOString());
  }
}
const newest = [...postDates.values()].sort().at(-1);

export default defineConfig({
  // The public address, used for RSS, the sitemap, canonical URLs and social cards.
  site: 'https://reforgeum.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const lastmod = postDates.get(path) ?? (['/', '/archive/'].includes(path) ? newest : undefined);
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
