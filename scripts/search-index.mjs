// Builds the Pagefind search index (settings in pagefind.yml).
// Pagefind fails when there's nothing to index, so skip it until the first post exists.
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const posts = ['dist/dispatches', 'dist/scraps'].flatMap((dir) => {
  try {
    return readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.html'));
  } catch {
    return [];
  }
});

if (posts.length === 0) console.log('search-index: no posts yet, skipping');
else execFileSync('npx', ['pagefind'], { stdio: 'inherit' });
