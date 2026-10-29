import { getCollection, type CollectionEntry } from 'astro:content';
import { PAPER_STYLES } from '../content.config';

export type Dispatch = CollectionEntry<'dispatches'>;
export type Scrap = CollectionEntry<'scraps'>;

export type Entry =
  | { kind: 'dispatch'; post: Dispatch; issue: number; slug: string }
  | { kind: 'scrap'; post: Scrap; issue: number; slug: string };

const published = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

// Oldest first; filenames carry the time, so same-day scraps keep their order.
const byDate = (a: Dispatch | Scrap, b: Dispatch | Scrap) =>
  a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id);

/** Lower-case, hyphenated, accent-free, at most ~60 characters, cut at a word. */
export const slugify = (text: string) => {
  const slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length <= 60 ? slug : slug.slice(0, 60).replace(/-[^-]*$/, '');
};

// URL names come from the title (or, for an untitled scrap, its first words).
// They're handed out oldest first, so a repeated title gets "-2", "-3"… and
// earlier posts keep their address when a newer one shares the name.
function withSlugs<T extends { post: Dispatch | Scrap }>(entries: T[], fallback: string) {
  const taken = new Set<string>();
  return entries.map((e) => {
    const words = e.post.data.title ?? plainText(e.post.body).split(' ').slice(0, 7).join(' ');
    const base = slugify(words) || fallback;
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    return { ...e, slug };
  });
}

/** Published dispatches, oldest first, each with its issue number. */
export async function getDispatches() {
  const posts = (await getCollection('dispatches', published)).sort(byDate);
  return withSlugs(posts.map((post, i) => ({ kind: 'dispatch' as const, post, issue: i + 1 })), 'dispatch');
}

/** Published scraps, oldest first, each with its own number. */
export async function getScraps() {
  const posts = (await getCollection('scraps', published)).sort(byDate);
  return withSlugs(posts.map((post, i) => ({ kind: 'scrap' as const, post, issue: i + 1 })), 'scrap');
}

/** Dispatches and scraps together, oldest first. */
export async function getEverything(): Promise<Entry[]> {
  const all: Entry[] = [...(await getDispatches()), ...(await getScraps())];
  return all.sort((a, b) => byDate(a.post, b.post));
}

export const KINDS = {
  dispatch: { label: 'Dispatch', plural: 'Dispatches', path: 'dispatches' },
  scrap: { label: 'Scrap', plural: 'Scraps', path: 'scraps' },
} as const;

export const hrefFor = (e: Entry) => `/${KINDS[e.kind].path}/${e.slug}/`;

/** Plain text of a post's Markdown, for excerpts and untitled scraps. */
export const plainText = (md = '') =>
  md
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const excerpt = (md: string | undefined, max: number) => {
  const text = plainText(md);
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
};

/** A scrap's title, or the start of its text when it has none. */
export const titleFor = (e: Entry) => e.post.data.title ?? excerpt(e.post.body, 60);

// Small stable hash so every notice keeps the same tilt/pin between builds.
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const PINS = ['#c8372d', '#d9a22b', '#2f6db3', '#3d8b5a', '#b5793a', '#26221e'];

function placement(id: string) {
  const h = hash(id);
  return {
    h,
    tilt: ((h >> 3) % 70) / 10 - 3.5, // -3.5deg .. 3.5deg
    pin: PINS[(h >> 7) % PINS.length],
    taped: (h >> 11) % 4 === 0,
    tornTab: (h >> 13) % 6,
    drop: (h >> 17) % 26, // px: notices aren't pinned in a perfect grid
    nudge: ((h >> 21) % 17) - 8,
  };
}

export function paperFor(post: Dispatch) {
  const p = placement(post.id);
  return { ...p, style: post.data.style ?? PAPER_STYLES[p.h % PAPER_STYLES.length] };
}

export const SCRAP_STOCKS = ['yellow', 'pink', 'blue', 'index'] as const;

export function scrapFor(post: Scrap) {
  const p = placement(post.id);
  return { ...p, stock: SCRAP_STOCKS[p.h % SCRAP_STOCKS.length], taped: (p.h >> 11) % 3 !== 0 };
}

export const issueNo = (n: number) => `No. ${String(n).padStart(3, '0')}`;

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
