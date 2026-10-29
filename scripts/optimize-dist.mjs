// Runs after `astro build`. Uploaded images come straight from the CMS, so here we:
//  1. resize and recompress them in place (same URLs), and
//  2. give every <img> pointing at them a width/height (no layout jump) and lazy loading.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const DIST = 'dist';
const MAX_WIDTH = 1600;
const encoders = {
  '.jpg': (s) => s.jpeg({ quality: 78, mozjpeg: true }),
  '.jpeg': (s) => s.jpeg({ quality: 78, mozjpeg: true }),
  '.png': (s) => s.png({ compressionLevel: 9, palette: true, quality: 85 }),
  '.webp': (s) => s.webp({ quality: 78 }),
};

const list = (dir) => readdir(dir, { recursive: true }).catch(() => []);

// 1. Shrink uploads
const sizes = new Map();
let saved = 0;
for (const name of await list(join(DIST, 'uploads'))) {
  const encode = encoders[extname(name).toLowerCase()];
  if (!encode) continue;
  const path = join(DIST, 'uploads', name);
  const input = await readFile(path);
  const output = await encode(sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })).toBuffer();
  const best = output.length < input.length ? output : input;
  if (best === output) {
    await writeFile(path, output);
    saved += input.length - output.length;
  }
  const { width, height } = await sharp(best).metadata();
  sizes.set(`/uploads/${name.split('\\').join('/')}`, { width, height });
}

// 2. Annotate <img> tags in the built pages
let tagged = 0;
for (const name of await list(DIST)) {
  if (!name.endsWith('.html')) continue;
  const path = join(DIST, name);
  const html = await readFile(path, 'utf8');
  const out = html.replace(/<img\b[^>]*>/g, (tag) => {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    const size = src && sizes.get(decodeURI(src));
    if (!size) return tag;
    let attrs = '';
    if (!/\swidth=/.test(tag)) attrs += ` width="${size.width}" height="${size.height}"`;
    if (!/\s(loading|fetchpriority)=/.test(tag)) attrs += ' loading="lazy"';
    if (!/\sdecoding=/.test(tag)) attrs += ' decoding="async"';
    if (!attrs) return tag;
    tagged++;
    return tag.replace(/^<img/, `<img${attrs}`);
  });
  if (out !== html) await writeFile(path, out);
}

console.log(`optimize-dist: ${sizes.size} uploads, saved ${(saved / 1024).toFixed(0)} KB, sized ${tagged} <img> tags`);
