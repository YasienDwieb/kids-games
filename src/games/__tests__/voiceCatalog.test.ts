import { writeFileSync } from 'fs';
import '@/games'; // side-effect: registers every game's translations
import { voiceCatalog } from '@/games/voiceCatalog';

// Every phrase the games speak, and the writing rules in docs/VOICE.md.
// `npm run voice:catalog` runs this file with VOICE_CATALOG_OUT set to export
// the catalog for scripts/voice/generate.mjs.
const lines = voiceCatalog();
const keys = lines.map((l) => `${l.lang}:${l.text}`);

it('includes the agreed letter patterns', () => {
  expect(keys).toContain('en:Q! Queen');
  expect(keys).toContain('ar:كَاف. كُرَة');
});

it('covers every speaking game in both languages', () => {
  expect(keys).toContain('en:three'); // numbers-land
  expect(keys).toContain('ar:ثَلاثة');
  expect(keys).toContain('en:Lion'); // animal-safari
  expect(keys).toContain('en:Make this color: Green'); // color-mixer
  expect(keys).toContain('en:a zigzag'); // trace-it warm-up
  expect(keys).toContain('en:zero'); // trace-it digit
});

it('has no duplicates or blanks', () => {
  expect(new Set(keys).size).toBe(keys.length);
  lines.forEach((l) => expect(l.text.trim()).not.toBe(''));
});

it('follows the Arabic writing rules', () => {
  const ar = lines.filter((l) => l.lang === 'ar').map((l) => l.text);
  expect(ar.filter((t) => /هْ(?=$|[ .،!؟:])/.test(t))).toEqual([]); // ة, not هْ
  // No TTS-only sukun closing a phrase; a real one («اِصنعْ») or a pausal ةْ («مَوْجَةْ») is fine.
  expect(ar.filter((t) => /(?<!ة)ْ(?=$|[.،!؟:])/.test(t))).toEqual([]);
  expect(ar.filter((t) => /^[ء-ي]\./.test(t))).toEqual([]); // letter name, not bare glyph
});

it('writes catalog.json when VOICE_CATALOG_OUT is set', () => {
  const out = process.env.VOICE_CATALOG_OUT;
  if (out) writeFileSync(out, JSON.stringify(lines, null, 1) + '\n');
});
