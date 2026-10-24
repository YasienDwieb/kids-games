// Dev tool: GLYPH_SHEET=<dir> npx jest glyphSheet  -> writes trace-glyphs-<set>.svg per glyph set.
import * as fs from 'fs';
import * as pathMod from 'path';
import { ALL_SETS } from '../glyphs';
import { WARMUPS, warmupFor } from '../glyphs/warmup';
import { EMOJI, spotsFor } from '../components/Travellers';
import { TRACK_WIDTH } from '../constants';
import { prepareGlyph } from '../utils/resample';
import type { Glyph } from '../types';

const OUT = process.env.GLYPH_SHEET;
const CELL = 120;
const COLS = 8;

function cellSvg(g: Glyph, x: number, y: number): string {
  const parts: string[] = [
    `<g transform="translate(${x},${y})">`,
    `<rect x="0" y="0" width="${CELL}" height="${CELL}" fill="none" stroke="#ddd"/>`,
    `<g transform="translate(10,10)">`,
    `<rect x="0" y="0" width="100" height="100" fill="#fafafa" stroke="#eee"/>`,
  ];
  let n = 1;
  for (const s of g.strokes) {
    if (s.kind !== 'path' || s.points.length < 2) continue;
    const pts = s.points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="#888" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    const [sx, sy] = s.points[0];
    const i = Math.min(s.points.length - 2, Math.floor((s.points.length - 1) * 0.3));
    const a = s.points[i];
    const b = s.points[i + 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    parts.push(
      `<polygon points="5,0 -4,-4 -4,4" fill="#d33" transform="translate(${a[0].toFixed(1)},${a[1].toFixed(1)}) rotate(${ang.toFixed(1)})"/>`,
      `<circle cx="${sx}" cy="${sy}" r="5" fill="#2a2"/>`,
      `<text x="${sx}" y="${sy + 2.5}" font-size="7" text-anchor="middle" fill="#fff" font-family="sans-serif">${n}</text>`,
    );
    n++;
  }
  for (const s of g.strokes) {
    if (s.kind !== 'dot') continue;
    parts.push(
      `<circle cx="${s.at[0]}" cy="${s.at[1]}" r="5" fill="none" stroke="#2a2" stroke-width="1.5"/>`,
      `<text x="${s.at[0]}" y="${s.at[1] + 2.5}" font-size="7" text-anchor="middle" fill="#2a2" font-family="sans-serif">${n}</text>`,
    );
    n++;
  }
  parts.push(`</g>`, `<text x="4" y="10" font-size="9" font-family="sans-serif" fill="#333">${g.id}</text>`, `</g>`);
  return parts.join('');
}

// Warm-up story at true size: the road as drawn, both emoji spots and the board edge.
function storySvg(g: Glyph, from: string, to: string, x: number, y: number): string {
  const pad = TRACK_WIDTH / 2;
  const prepared = prepareGlyph(g);
  const { from: a, to: b, road } = spotsFor(prepared);
  const pts = road.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const emoji = (c: readonly [number, number], e: string) =>
    `<circle cx="${c[0]}" cy="${c[1]}" r="${EMOJI / 2}" fill="#fde7a8" stroke="#c90"/>` +
    `<text x="${c[0]}" y="${c[1] + 5}" font-size="13" text-anchor="middle">${e}</text>`;
  return [
    `<g transform="translate(${x + pad + 6},${y + pad + 6})">`,
    `<rect x="${-pad}" y="${-pad}" width="${100 + 2 * pad}" height="${100 + 2 * pad}" fill="#fffaf0" stroke="#bbb"/>`,
    `<polyline points="${pts}" fill="none" stroke="#333" stroke-width="${TRACK_WIDTH + 2}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<polyline points="${pts}" fill="none" stroke="#f4c7c3" stroke-width="${TRACK_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`,
    emoji(a, from),
    emoji(b, to),
    `<text x="${-pad + 2}" y="${-pad + 8}" font-size="7" font-family="sans-serif">${g.id}</text>`,
    `</g>`,
  ].join('');
}

(OUT ? describe : describe.skip)('glyph sheet', () => {
  it('writes the warm-up story sheet (LTR row, then RTL)', () => {
    fs.mkdirSync(OUT as string, { recursive: true });
    const cell = 100 + TRACK_WIDTH + 12;
    const cells = [false, true].flatMap((rtl, row) =>
      WARMUPS.map((w, i) => storySvg(warmupFor(w.id, rtl), w.from, w.to, i * cell, row * cell)),
    );
    const [w, h] = [WARMUPS.length * cell, 2 * cell];
    fs.writeFileSync(
      pathMod.join(OUT as string, 'trace-warmup-story.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/>${cells.join('')}</svg>`,
    );
  });

  it('writes one SVG per glyph set', () => {
    fs.mkdirSync(OUT as string, { recursive: true });
    for (const [name, glyphs] of Object.entries(ALL_SETS)) {
      const rows = Math.ceil(glyphs.length / COLS);
      const cells = glyphs.map((g, i) => cellSvg(g, (i % COLS) * CELL, Math.floor(i / COLS) * CELL));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CELL}" height="${rows * CELL}" viewBox="0 0 ${COLS * CELL} ${rows * CELL}"><rect width="100%" height="100%" fill="#fff"/>${cells.join('')}</svg>`;
      fs.writeFileSync(pathMod.join(OUT as string, `trace-glyphs-${name}.svg`), svg);
    }
  });
});
