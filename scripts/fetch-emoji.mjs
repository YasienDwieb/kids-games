// Fetch Google Noto 128px emoji PNGs for the given glyphs.
//
// Usage: node scripts/fetch-emoji.mjs 🍎 🐼 ⚽ …
//
// Downloads each glyph's 128px PNG into src/sdk/assets/emoji/png/<CODE>.png
// (CODE = uppercase, hyphen-joined codepoints with the FE0F variation selector
// stripped — matching the images.ts key/filename convention) and prints the
// images.ts require() line to paste. Misses are reported on stderr so the word
// can be swapped for one Noto has art for.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const PNG_DIR = path.join('src', 'sdk', 'assets', 'emoji', 'png');
const BASE = 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128';

/** Codepoints of a glyph, uppercase hex, FE0F stripped, hyphen-joined. */
const codeOf = (g) =>
  [...g]
    .map((c) => c.codePointAt(0).toString(16).toUpperCase())
    .filter((h) => h !== 'FE0F')
    .join('-');

const glyphs = process.argv.slice(2);
await mkdir(PNG_DIR, { recursive: true });

let ok = 0;
const misses = [];
for (const g of glyphs) {
  const code = codeOf(g);
  const noto = 'emoji_u' + code.toLowerCase().replace(/-/g, '_') + '.png';
  const res = await fetch(`${BASE}/${noto}`);
  if (!res.ok) {
    misses.push(`${g} (${code})`);
    continue;
  }
  await writeFile(path.join(PNG_DIR, `${code}.png`), Buffer.from(await res.arrayBuffer()));
  // Key is FE0F-stripped to match images.ts (getEmojiImage normalizes lookups).
  const key = g.replace(/️/g, '');
  console.log(`  "${key}": require("./png/${code}.png"),`);
  ok++;
}

console.error(`\n[fetch-emoji] ${ok} fetched, ${misses.length} missed`);
if (misses.length) console.error('[fetch-emoji] MISSES: ' + misses.join(', '));
