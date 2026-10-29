// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The public address, used for RSS, the sitemap, canonical URLs and social cards.
  site: 'https://reforgeum.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
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
