import { getCollection, type CollectionEntry } from 'astro:content';
import { PAPER_STYLES } from '../content.config';

export type Post = CollectionEntry<'posts'>;

/** Published posts, oldest first, each with its issue number. */
export async function getIssues() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  posts.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  return posts.map((post, i) => ({ post, issue: i + 1 }));
}

// Small stable hash so every pamphlet keeps the same tilt/pin between builds.
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const PINS = ['#c8372d', '#d9a22b', '#2f6db3', '#3d8b5a', '#b5793a', '#26221e'];

export function paperFor(post: Post) {
  const h = hash(post.id);
  return {
    style: post.data.style ?? PAPER_STYLES[h % PAPER_STYLES.length],
    tilt: ((h >> 3) % 70) / 10 - 3.5, // -3.5deg .. 3.5deg
    pin: PINS[(h >> 7) % PINS.length],
    taped: (h >> 11) % 4 === 0,
    tornTab: (h >> 13) % 6,
    drop: (h >> 17) % 26, // px: notices aren't pinned in a perfect grid
    nudge: ((h >> 21) % 17) - 8,
  };
}

export const issueNo = (n: number) => `No. ${String(n).padStart(3, '0')}`;

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
