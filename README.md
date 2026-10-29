# Reforgeum

A bulletin board of pinned pamphlets. It's built with Astro and edited through Pages CMS.

## Run locally

```bash
npm install
npm run dev
```

Search only works on the built site: run `npm run build && npm run preview`.

## What's where

- `/` shows the 12 latest notices, `/archive/` lists every notice with full-text search (Pagefind), and `/about/` is the About page. `/rss.xml` is a full-content feed of the latest 50.
- `npm run build` builds the site with Astro, then `scripts/optimize-dist.mjs` shrinks uploaded images to 1600px and adds their sizes, then Pagefind builds the search index.
- Every post gets its own social card at `/og/<post>.jpg`: its notice pinned to the lamplit board, in its own paper style. The site has a card too, at `/og/site.jpg`. The cards are drawn at build time in `src/lib/og.ts` and cached in `node_modules/.cache/og`, so only new or edited posts get redrawn.
- `public/_headers` sets the cache rules on Cloudflare Pages and Netlify.
- `extras/themes/` holds the Wheatpaste and Red String looks. They aren't used, but they're kept in case he wants them back.

## Hosting

The site is a Cloudflare Worker serving static files (`wrangler.jsonc`) at https://reforgeum.com. It lives in Sushanth's Cloudflare account. Workers Builds is connected to this GitHub repo, so every push to `main`, including Pages CMS saves, rebuilds and deploys the site. To deploy by hand, run `npm run deploy`.

Pages CMS: open https://app.pagescms.org, pick this repo, and invite writers by email under Collaborators.

## Writing (for your friend)

Open Pages CMS and go to **Pamphlets**, then **Add an entry**. Write the post, pick a paper style (or leave it empty), then save. The post appears on the board about a minute later.

Under **About page**, he can edit the About text. Under **Board settings**, he can change the name, tagline and sticky note.

Paper styles: newsprint, xerox (photocopy), index card, carbon copy, protest poster, kraft paper.
