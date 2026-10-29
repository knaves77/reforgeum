// Open Graph cards: the lamplit board with the post's notice pinned to it.
// Rendered at build time: Satori lays out the card, resvg rasterises it, sharp compresses it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import site from '../data/site.json';
import { paperFor, issueNo, fmtDate, type Post } from './board';

const W = 1200;
const H = 630;
const CACHE = join(process.cwd(), 'node_modules/.cache/og');
// Editing this file changes the design, so it's part of every card's cache key.
const DESIGN = createHash('sha1').update(readFileSync(join(process.cwd(), 'src/lib/og.ts'))).digest('hex');

/* ─── Fonts (Satori reads woff, not woff2) ─── */

const FONT_FILES: [name: string, pkg: string, file: string, weight: 400 | 700, style: 'normal' | 'italic'][] = [
  ['Anton', 'anton', 'anton-latin-400-normal', 400, 'normal'],
  ['Newsreader', 'newsreader', 'newsreader-latin-400-normal', 400, 'normal'],
  ['Newsreader', 'newsreader', 'newsreader-latin-400-italic', 400, 'italic'],
  ['Courier Prime', 'courier-prime', 'courier-prime-latin-400-normal', 400, 'normal'],
  ['Courier Prime', 'courier-prime', 'courier-prime-latin-700-normal', 700, 'normal'],
  ['Special Elite', 'special-elite', 'special-elite-latin-400-normal', 400, 'normal'],
  ['Caveat', 'caveat', 'caveat-latin-700-normal', 700, 'normal'],
  ['Stardos Stencil', 'stardos-stencil', 'stardos-stencil-latin-700-normal', 700, 'normal'],
];

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(
    FONT_FILES.map(async ([name, pkg, file, weight, style]) => ({
      name,
      weight,
      style,
      data: await readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', `${file}.woff`)),
    })),
  ));

/* ─── Tiny element helper for Satori ─── */

type El = { type: string; props: Record<string, unknown> };
type Style = Record<string, string | number>;
const h = (type: string, style: Style, ...children: (El | string | false | undefined)[]): El => {
  const kids = children.filter((c) => c !== false && c !== undefined);
  return { type, props: { style, children: kids.length === 1 ? kids[0] : kids } };
};
const img = (src: string, style: Style): El => ({ type: 'img', props: { src, style } });
const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// SVG noise filters are slow to render, so draw each texture once and reuse the PNG.
const rasters = new Map<string, string>();
const raster = (svg: string) => {
  let url = rasters.get(svg);
  if (!url) {
    url = `data:image/png;base64,${Buffer.from(new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng()).toString('base64')}`;
    rasters.set(svg, url);
  }
  return url;
};

/* ─── Textures ─── */

const grain = (w: number, h: number, alpha = 0.22) =>
  raster(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${alpha} 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );

const corkGrain = () => raster(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><filter id="c"><feTurbulence type="turbulence" baseFrequency=".42" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .14 0 0 0 0 .05 0 0 0 1.4 -.55"/></filter><rect width="100%" height="100%" filter="url(#c)"/></svg>`,
);

// Two swags of string lights with soft glows, as on the site.
const lights = () => {
  const SAG = 46;
  let wire = '';
  let bulbs = '';
  for (let s = 0; s < 2; s++) {
    const x0 = (s * W) / 2;
    const x1 = ((s + 1) * W) / 2;
    wire += `M${x0},6 Q${(x0 + x1) / 2},${6 + SAG * 2} ${x1},6 `;
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const x = x0 + (x1 - x0) * t;
      const y = 6 + SAG * 4 * t * (1 - t);
      bulbs += `<circle cx="${x}" cy="${y + 9}" r="34" fill="url(#halo)"/><rect x="${x - 3}" y="${y}" width="6" height="6" rx="1" fill="#1a120c"/><ellipse cx="${x}" cy="${y + 13}" rx="5.5" ry="7.5" fill="url(#bulb)"/>`;
    }
  }
  return raster(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="140"><defs><radialGradient id="halo"><stop offset="0" stop-color="#ffb35c" stop-opacity=".55"/><stop offset=".35" stop-color="#ff9a2e" stop-opacity=".18"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient><radialGradient id="bulb" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#fff6dc"/><stop offset=".55" stop-color="#ffcf8a"/><stop offset="1" stop-color="#e08a2e"/></radialGradient></defs><path d="${wire}" fill="none" stroke="#0d0805" stroke-width="2"/>${bulbs}</svg>`,
  );
};

const ruledLines = (w: number, h: number, top: number) => {
  let lines = `<rect x="0" y="${top - 2}" width="${w}" height="2.5" fill="#e07a7a"/>`;
  for (let y = top + 52; y < h; y += 52) lines += `<rect x="0" y="${y}" width="${w}" height="1.5" fill="#b3cbe2"/>`;
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lines}</svg>`);
};

/* ─── Paper stocks ─── */

type Paper = {
  bg: string;
  ink: string;
  head: string;
  weight?: number;
  upper: boolean;
  lineHeight: number;
  dek: string;
  dekStyle?: 'italic' | 'normal';
  dekColor?: string;
  lines?: boolean;
};

const PAPERS: Record<string, Paper> = {
  newsprint: { bg: '#e4d9bf', ink: '#1c1a17', head: 'Anton', upper: true, lineHeight: 1.02, dek: 'Newsreader', dekStyle: 'italic' },
  xerox: { bg: '#e9e6dc', ink: '#161514', head: 'Special Elite', upper: true, lineHeight: 1.12, dek: 'Special Elite' },
  index: { bg: '#f8f3e4', ink: '#1c1a17', head: 'Caveat', weight: 700, upper: false, lineHeight: 1.0, dek: 'Caveat', dekColor: '#2a3550', lines: true },
  carbon: { bg: '#d3dbe2', ink: '#1f2f6b', head: 'Courier Prime', weight: 700, upper: true, lineHeight: 1.12, dek: 'Courier Prime' },
  poster: { bg: '#d6552c', ink: '#1c1a17', head: 'Anton', upper: true, lineHeight: 0.98, dek: 'Newsreader' },
  kraft: { bg: '#c3a06f', ink: '#1c1a17', head: 'Stardos Stencil', weight: 700, upper: true, lineHeight: 1.05, dek: 'Special Elite' },
};

// Rough average glyph widths (in em) for fitting text without measuring it.
const CHAR_W: Record<string, number> = {
  Anton: 0.44,
  'Stardos Stencil': 0.7,
  'Special Elite': 0.64,
  'Courier Prime': 0.6,
  Newsreader: 0.46,
  Caveat: 0.4,
};

const countLines = (text: string, perLine: number) => {
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const need = used ? used + 1 + word.length : word.length;
    if (need > perLine && used) {
      lines++;
      used = word.length;
    } else used = need;
  }
  return lines;
};

const TEXT_W = 656; // paper width minus padding
const TEXT_H = 366;

/** Largest headline size at which the headline, one-liner and stamp all fit on the paper. */
function fitHeadline(title: string, paper: Paper, dek: string, stamp: boolean) {
  const dekSize = 27;
  const dekLines = dek ? countLines(dek, Math.floor(TEXT_W / (dekSize * (CHAR_W[paper.dek] ?? 0.5)))) : 0;
  const fixed = 49 + 18 + dekLines * dekSize * 1.38 + (stamp ? 70 : 0);
  for (let size = 112; size > 44; size -= 4) {
    const lines = countLines(title, Math.floor(TEXT_W / (size * CHAR_W[paper.head])));
    if (lines <= 3 && lines * size * paper.lineHeight + fixed <= TEXT_H) return size;
  }
  return 44;
}

const clip = (text = '', max = 150) => {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
};

/* ─── Shared pieces ─── */

const fill: Style = { position: 'absolute', left: 0, top: 0, width: W, height: H };

const cork = (...children: El[]) =>
  h(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#2c1c10',
      backgroundImage: 'radial-gradient(ellipse 75% 70% at 45% 40%, #6b4426 0%, #3b2616 55%, #1a0f08 100%)',
    },
    img(corkGrain(), { ...fill, opacity: 0.9 }),
    ...children,
  );

// The lamp's vignette, the string lights and the frame go over everything.
const overlays = (): El[] => [
  h('div', { ...fill, backgroundImage: 'radial-gradient(ellipse 80% 85% at 45% 42%, rgba(0,0,0,0) 45%, rgba(8,4,2,0.75) 100%)' }),
  img(lights(), { position: 'absolute', left: 0, top: 0, width: W, height: 140 }),
  h('div', { ...fill, border: '14px solid #140c07' }),
];

const board = (...children: El[]) => cork(...children, ...overlays());

// Top layer for post cards: the overlays plus a fine film grain that also textures the paper.
const topLayer = () =>
  h('div', { width: W, height: H, display: 'flex', position: 'relative' }, ...overlays());

// A small film-grain tile, repeated over the whole card by sharp (one big noise texture bands).
let grainTile: Buffer | undefined;
const filmGrain = () =>
  (grainTile ??= Buffer.from(
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
      { font: { loadSystemFonts: false } },
    )
      .render()
      .asPng(),
  ));

const neonSign = (size: number) =>
  h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 18px 4px',
      borderTop: '3px solid #ffb45e',
      borderBottom: '3px solid #ffb45e',
      boxShadow: '0 0 18px rgba(255,170,70,0.45)',
    },
    ...site.title.split(/\s+(?=\S+$)/).map((line) =>
      h(
        'div',
        {
          fontFamily: 'Anton',
          fontSize: size,
          lineHeight: 0.98,
          color: '#fff3dc',
          textTransform: 'uppercase',
          textShadow: '0 0 6px #ffd9a0, 0 0 18px #ffb050, 0 0 40px #ff8a1e',
        },
        line,
      ),
    ),
  );

const pinHead = (color: string) =>
  h('div', {
    position: 'absolute',
    top: -16,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundImage: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 3px, ${color} 7px, #1a0f0a 100%)`,
  });

/* ─── Cards ─── */

// Just the notice, on a transparent canvas; it's composited between the backdrop and the top layer.
function postCard(post: Post, issue: number): El {
  const { title, date, dek, stamp } = post.data;
  const meta = paperFor(post);
  const paper = PAPERS[meta.style] ?? PAPERS.newsprint;
  // Index cards write on the ruled lines: one 52px rule per line of text.
  const shortDek = clip(dek, 110);
  const size = paper.lines ? (title.length <= 30 ? 64 : 56) : fitHeadline(title, paper, shortDek, !!stamp);
  const PW = 760;
  const PH = 450;
  const top = 94; // where the index card's red margin line sits, just under the kicker

  return h(
    'div',
    { width: W, height: H, display: 'flex', position: 'relative', overflow: 'hidden' },
    h(
      'div',
      {
        position: 'absolute',
        left: 64,
        top: 128,
        width: PW - 104, // Satori sizes the content box, so subtract the padding
        height: PH - 84,
        display: 'flex',
        flexDirection: 'column',
        padding: '44px 52px 40px',
        backgroundColor: paper.bg,
        color: paper.ink,
        transform: `rotate(${(meta.tilt / 2.5).toFixed(2)}deg)`,
      },
      paper.lines && img(ruledLines(PW, PH, top), { position: 'absolute', left: 0, top: 0, width: PW, height: PH }),
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Courier Prime',
          fontSize: 19,
          letterSpacing: 2,
          textTransform: 'uppercase',
          paddingBottom: 10,
          marginBottom: 18,
          borderBottom: meta.style === 'newsprint' ? `4px solid ${paper.ink}` : '0px solid transparent',
        },
        h('div', {}, `${site.title} · ${issueNo(issue)}`),
        h('div', {}, fmtDate(date)),
      ),
      h(
        'div',
        {
          fontFamily: paper.head,
          fontWeight: paper.weight ?? 400,
          fontSize: size,
          lineHeight: paper.lines ? 52 / size : paper.lineHeight,
          textTransform: paper.upper ? 'uppercase' : 'none',
          letterSpacing: paper.head === 'Anton' ? 0.5 : 0,
          marginBottom: paper.lines ? 0 : 18,
        },
        title,
      ),
      dek &&
        h(
          'div',
          {
            fontFamily: paper.dek,
            fontWeight: paper.dek === 'Caveat' ? 700 : 400,
            fontStyle: paper.dekStyle ?? 'normal',
            fontSize: paper.dek === 'Caveat' ? 36 : 27,
            lineHeight: paper.lines ? 52 / 36 : 1.38,
            color: paper.dekColor ?? paper.ink,
            opacity: 0.88,
          },
          shortDek,
        ),
      stamp &&
        h(
          'div',
          {
            alignSelf: 'flex-start',
            marginTop: 22,
            padding: '6px 16px 4px',
            fontFamily: 'Stardos Stencil',
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: meta.style === 'poster' ? '#1c1a17' : '#b3261e',
            border: `4px solid ${meta.style === 'poster' ? '#1c1a17' : '#b3261e'}`,
            borderRadius: 6,
            transform: 'rotate(-6deg)',
            opacity: 0.85,
          },
          stamp,
        ),
      pinHead(meta.pin),
    ),
  );
}

// Everything on a post card that doesn't change between posts: the cork and the neon sign.
function postBackdrop(): El {
  return cork(
    h(
      'div',
      {
        position: 'absolute',
        left: 848,
        top: 150,
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      h(
        'div',
        {
          fontFamily: 'Courier Prime',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#ff7aa8',
          textAlign: 'center',
          marginBottom: 18,
          textShadow: '0 0 8px rgba(255,90,150,0.9)',
        },
        site.tagline,
      ),
      neonSign(76),
      h(
        'div',
        {
          marginTop: 34,
          padding: '18px 18px 16px',
          width: 220,
          backgroundColor: '#e9cd55',
          fontFamily: 'Caveat',
          fontWeight: 700,
          fontSize: 27,
          lineHeight: 1.08,
          color: '#1c1a17',
          textAlign: 'center',
          transform: 'rotate(4deg)',
          boxShadow: '0 24px 30px -12px rgba(0,0,0,0.85)',
        },
        site.boardNote,
      ),
    ),
  );
}

function siteCard(): El {
  return board(
    h(
      'div',
      {
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
      },
      h(
        'div',
        {
          fontFamily: 'Courier Prime',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: '#ff7aa8',
          marginBottom: 22,
          textShadow: '0 0 8px rgba(255,90,150,0.9)',
        },
        site.tagline,
      ),
      h(
        'div',
        {
          fontFamily: 'Anton',
          fontSize: 150,
          lineHeight: 1,
          padding: '14px 40px 6px',
          color: '#fff3dc',
          textTransform: 'uppercase',
          borderTop: '4px solid #ffb45e',
          borderBottom: '4px solid #ffb45e',
          boxShadow: '0 0 22px rgba(255,170,70,0.45)',
          textShadow: '0 0 6px #ffd9a0, 0 0 22px #ffb050, 0 0 50px #ff8a1e',
        },
        site.title,
      ),
      h(
        'div',
        {
          marginTop: 28,
          maxWidth: 760,
          fontFamily: 'Newsreader',
          fontStyle: 'italic',
          fontSize: 32,
          lineHeight: 1.35,
          color: '#f2dcb8',
          textAlign: 'center',
        },
        site.subtitle,
      ),
    ),
    h(
      'div',
      {
        position: 'absolute',
        left: 0,
        bottom: 46,
        width: W,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'Caveat',
        fontWeight: 700,
        fontSize: 34,
        color: '#ffcf8a',
        textShadow: '0 0 12px rgba(255,170,70,0.6)',
      },
      site.boardNote,
    ),
  );
}

/* ─── Rendering, with a disk cache so unchanged cards aren't redrawn on every build ─── */

const draw = async (el: El) => {
  const svg = await satori(el as Parameters<typeof satori>[0], { width: W, height: H, fonts: await loadFonts() });
  // Satori already turned the text into outlines, so skip resvg's slow system-font scan.
  return new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: false } }).render().asPng();
};

// Layers shared by every post card are drawn once per build.
let layers: Promise<[Buffer, Buffer]> | undefined;
const sharedLayers = () => (layers ??= Promise.all([draw(postBackdrop()), draw(topLayer())]));

async function render(key: unknown, makePng: () => Promise<Buffer>): Promise<Buffer> {
  const hash = createHash('sha1').update(JSON.stringify({ DESIGN, site, key })).digest('hex');
  const file = join(CACHE, `${hash}.jpg`);
  try {
    return await readFile(file);
  } catch {
    // not cached yet
  }
  const jpg = await sharp(await makePng())
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, jpg);
  return jpg;
}

// A drop shadow cast from the notice's silhouette. (Satori's SVG shadows are ~10× slower to render.)
async function shadow(notice: Buffer, { dx, dy, blur, opacity }: { dx: number; dy: number; blur: number; opacity: number }) {
  // shift the silhouette by (dx, dy), then blur it (sharp runs extract before extend, so two passes)
  const moved = await sharp(notice).extractChannel(3).extend({ top: dy, left: dx, background: '#000' }).raw().toBuffer();
  const alpha = await sharp(moved, { raw: { width: W + dx, height: H + dy, channels: 1 } })
    .extract({ left: 0, top: 0, width: W, height: H })
    .blur(blur)
    .linear(opacity, 0)
    .extractChannel(0) // sharp hands back a single-channel raw image as 3 channels
    .raw({ depth: 'uchar' })
    .toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: '#080402' } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .png()
    .toBuffer();
}

export const renderPostCard = (post: Post, issue: number) =>
  render({ id: post.id, data: post.data, issue, paper: paperFor(post) }, async () => {
    const [base, top] = await sharedLayers();
    const notice = Buffer.from(await draw(postCard(post, issue)));
    const [wide, tight] = await Promise.all([
      shadow(notice, { dx: 6, dy: 30, blur: 22, opacity: 0.8 }),
      shadow(notice, { dx: 2, dy: 3, blur: 2.5, opacity: 0.45 }),
    ]);
    return sharp(base)
      .composite([
        { input: wide },
        { input: tight },
        { input: notice },
        { input: filmGrain(), tile: true },
        { input: Buffer.from(top) },
      ])
      .png()
      .toBuffer();
  });

export const renderSiteCard = () => render('site', async () => Buffer.from(await draw(siteCard())));

export const OG_SIZE = { width: W, height: H };
