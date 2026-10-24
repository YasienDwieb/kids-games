import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterClips, groupClips, sectionFor } from '../studio/sections.mjs';

const GAMES = [
  { id: 'trace-it', name: 'Trace It' },
  { id: 'numbers-land', name: 'Numbers Land' },
];
const clip = (key, uses, state = 'ok', extra = {}) => ({ key, lang: key.slice(0, 2), text: key.slice(3), state, uses, flag: null, ...extra });
const SHARED = clip('ar:ثَلاثة', [
  { game: 'numbers-land', where: 'Listen & find' },
  { game: 'trace-it', where: 'Numbers tab' },
]);
const WAVE = clip('en:a wave', [{ game: 'trace-it', where: 'Warm-up' }]);
const NEW = clip('en:Lion', [{ game: 'numbers-land', where: 'Listen & find' }], 'missing');
const STALE = clip('en:two', [{ game: 'numbers-land', where: 'Listen & find' }], 'stale');

test('a clip in two games lands only in its first game', () => {
  assert.equal(sectionFor(SHARED), 'numbers-land');
});

test('missing and stale clips land in "new"', () => {
  assert.equal(sectionFor(NEW), 'new');
  assert.equal(sectionFor(STALE), 'new');
});

test('groupClips: new first, then games in order, every clip once', () => {
  const groups = groupClips([SHARED, WAVE, NEW, STALE], GAMES);
  assert.deepEqual(groups.map((g) => g.id), ['new', 'trace-it', 'numbers-land']);
  assert.equal(groups[0].title, 'New / missing');
  assert.deepEqual(groups.flatMap((g) => g.clips.map((c) => c.key)).sort(), [SHARED, WAVE, NEW, STALE].map((c) => c.key).sort());
});

test('groupClips drops empty sections', () => {
  assert.deepEqual(groupClips([WAVE], GAMES).map((g) => g.id), ['trace-it']);
});

test('filterClips: game matches any use; lang, flagged and search narrow', () => {
  const all = [SHARED, WAVE, NEW, clip('en:one', [{ game: 'numbers-land', where: 'x' }], 'ok', { flag: { note: 'fast' } })];
  assert.deepEqual(filterClips(all, { game: 'trace-it' }).map((c) => c.key), ['ar:ثَلاثة', 'en:a wave']);
  assert.deepEqual(filterClips(all, { lang: 'ar' }).map((c) => c.key), ['ar:ثَلاثة']);
  assert.deepEqual(filterClips(all, { flaggedOnly: true }).map((c) => c.key), ['en:one']);
  assert.deepEqual(filterClips(all, { q: 'WAV' }).map((c) => c.key), ['en:a wave']);
  assert.equal(filterClips(all, {}).length, 4);
});
