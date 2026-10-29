// Splits each web font into a small "core" file (English text and typographic
// punctuation) and an "extra" file (Latin-1 accents). Browsers fetch the extra file
// only when a page uses one of its characters. Run after changing font packages:
//   node scripts/subset-fonts.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import subsetFont from 'subset-font';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('');
const CORE = range(0x20, 0x7e) + '‘’“”–—…·•→←′″€™';
const EXTRA = range(0xa0, 0xff);

// [file name, @fontsource package, source file]
const FONTS = [
  ['anton-400', 'anton', 'anton-latin-400-normal'],
  ['caveat-700', 'caveat', 'caveat-latin-700-normal'],
  ['courier-prime-400', 'courier-prime', 'courier-prime-latin-400-normal'],
  ['courier-prime-700', 'courier-prime', 'courier-prime-latin-700-normal'],
  ['newsreader-400', 'newsreader', 'newsreader-latin-400-normal'],
  ['newsreader-400-italic', 'newsreader', 'newsreader-latin-400-italic'],
  ['newsreader-600', 'newsreader', 'newsreader-latin-600-normal'],
  ['special-elite-400', 'special-elite', 'special-elite-latin-400-normal'],
  ['stardos-stencil-700', 'stardos-stencil', 'stardos-stencil-latin-700-normal'],
];

mkdirSync('src/assets/fonts', { recursive: true });
for (const [name, pkg, file] of FONTS) {
  const src = readFileSync(`node_modules/@fontsource/${pkg}/files/${file}.woff2`);
  for (const [part, chars] of [['core', CORE], ['extra', EXTRA]]) {
    const out = await subsetFont(src, chars, { targetFormat: 'woff2' });
    writeFileSync(`src/assets/fonts/${name}-${part}.woff2`, out);
  }
  console.log(name);
}
