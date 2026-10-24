import assert from 'node:assert/strict';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { clipKey, pickTake, prune, readState, recordTakes, replyFlag, setFlag, slug, status } from '../core.mjs';
import { fakeSynth, line, makeRoot, readJson, readText, tone } from './fixtures.mjs';

const LOCK = 'src/sdk/speech/clips.lock.json';
const ONE = line('en', 'one');
const TWO = line('en', 'two');
const K1 = clipKey('en', 'one');
const K2 = clipKey('en', 'two');

/** Writes takes 1..n (or the given numbers) for a key, like a past recording. */
function seedTakes(root, key, numbers = [1, 2, 3]) {
  const dir = join(root, 'scripts/voice/.takes', slug(key));
  mkdirSync(dir, { recursive: true });
  for (const n of numbers) writeFileSync(join(dir, `take-${n}.mp3`), tone(1 + n / 10));
}

test('pickTake installs the take and updates lock + map', () => {
  const root = makeRoot({ lines: [ONE] });
  seedTakes(root, K1);
  pickTake({ root }, K1, 2);
  const entry = readJson(root, LOCK)[K1];
  assert.equal(entry.take, 2);
  assert.ok(existsSync(join(root, 'src/sdk/assets/audio/speech', entry.file)));
  assert.match(readText(root, 'src/sdk/speech/clips.generated.ts'), new RegExp(`"en:one": require\\('../assets/audio/speech/${entry.file}'\\)`));
});

test('pickTake of a missing take throws and leaves the lock alone', () => {
  const root = makeRoot({ lines: [ONE] });
  seedTakes(root, K1, [1, 3]);
  assert.throws(() => pickTake({ root }, K1, 2), /no take 2/);
  assert.deepEqual(readJson(root, LOCK), {});
});

test('pickTake keeps entries another process wrote meanwhile', () => {
  const root = makeRoot({ lines: [ONE, TWO] });
  seedTakes(root, K1);
  readState({ root });
  writeFileSync(join(root, LOCK), JSON.stringify({ [K2]: { file: 'x.m4a', voice: 'v', take: 1, durationS: 1, generatedAt: '2026-10-24' } }));
  pickTake({ root }, K1, 1);
  assert.deepEqual(Object.keys(readJson(root, LOCK)).sort(), [K1, K2]);
});

test('recordTakes: a full set replaces a clip; median take picked', async () => {
  const root = makeRoot({ lines: [ONE] });
  seedTakes(root, K1);
  pickTake({ root }, K1, 1);
  const res = await recordTakes({ root, synthesize: fakeSynth({ lengths: [2, 1, 1.5] }) }, [K1]);
  assert.deepEqual(res, { written: [K1], failed: [] });
  assert.equal(readJson(root, LOCK)[K1].take, 3); // 1.5 s is the median
});

test('recordTakes: partial takes keep an existing clip and report it', async () => {
  const root = makeRoot({ lines: [ONE] });
  seedTakes(root, K1);
  pickTake({ root }, K1, 2);
  const before = readJson(root, LOCK)[K1];
  const res = await recordTakes({ root, synthesize: fakeSynth({ fail: (_t, n) => n > 0 }) }, [K1]);
  assert.deepEqual(res.written, []);
  assert.ok(res.failed.some((f) => f.includes('kept the current clip')));
  assert.deepEqual(readJson(root, LOCK)[K1], before);
});

test('recordTakes: a new phrase accepts partial takes', async () => {
  const root = makeRoot({ lines: [ONE] });
  const res = await recordTakes({ root, synthesize: fakeSynth({ fail: (_t, n) => n > 0 }) }, [K1]);
  assert.deepEqual(res.written, [K1]);
  assert.equal(readJson(root, LOCK)[K1].take, 1);
});

test("recordTakes: one failing phrase doesn't stop the others", async () => {
  const root = makeRoot({ lines: [ONE, TWO] });
  const res = await recordTakes({ root, synthesize: fakeSynth({ fail: new Set(['two']) }) }, [K1, K2]);
  assert.deepEqual(res.written, [K1]);
  assert.ok(res.failed.some((f) => f.startsWith(K2)));
});

test('recordTakes: duplicate keys are recorded once', async () => {
  const root = makeRoot({ lines: [ONE] });
  const synth = fakeSynth();
  const res = await recordTakes({ root, synthesize: synth }, [K1, K1]);
  assert.deepEqual(res, { written: [K1], failed: [] });
  assert.equal(synth.calls.get('one'), 3);
});

test('recordTakes reports progress per take, then per phrase', async () => {
  const root = makeRoot({ lines: [ONE, TWO] });
  const seen = [];
  await recordTakes({ root, synthesize: fakeSynth() }, [K1, K2, 'en:nope'], (p) => seen.push(p));
  const takes = seen.filter((p) => p.phase === 'takes');
  assert.deepEqual(takes.map((p) => p.done), [1, 2, 3, 4, 5, 6]);
  assert.ok(takes.every((p) => p.total === 6));
  const last = seen.at(-1);
  assert.deepEqual({ phase: last.phase, done: last.done, total: last.total }, { phase: 'phrases', done: 3, total: 3 });
});

test('status marks missing and stale clips', () => {
  const root = makeRoot({ lines: [ONE, TWO] });
  seedTakes(root, K1);
  pickTake({ root }, K1, 1);
  const lock = readJson(root, LOCK);
  lock[K1].voice = 'en-US-Old';
  writeFileSync(join(root, LOCK), JSON.stringify(lock));
  const byKey = Object.fromEntries(status({ root }).map((c) => [c.key, c]));
  assert.equal(byKey[K1].state, 'stale');
  assert.equal(byKey[K2].state, 'missing');
  assert.equal(byKey[K2].clip, null);
  assert.equal(byKey[K1].chars, 'one'.length * 3);
  assert.deepEqual(byKey[K1].takes.map((t) => t.n), [1, 2, 3]);
  assert.deepEqual(byKey[K1].uses, ONE.uses);
});

test('prune removes only keys that left the catalog, with their flags', () => {
  const root = makeRoot({ lines: [ONE, TWO] });
  seedTakes(root, K1);
  seedTakes(root, K2);
  pickTake({ root }, K1, 1);
  pickTake({ root }, K2, 1);
  setFlag({ root }, K2, 'gone soon');
  const file = readJson(root, LOCK)[K2].file;
  writeFileSync(join(root, 'scripts/voice/catalog.json'), JSON.stringify({ games: [], lines: [ONE] }));
  assert.deepEqual(prune({ root }), [K2]);
  assert.deepEqual(Object.keys(readJson(root, LOCK)), [K1]);
  assert.equal(existsSync(join(root, 'src/sdk/assets/audio/speech', file)), false);
  assert.deepEqual(readJson(root, 'scripts/voice/flags.json'), {});
});

test('flags: set, reply, unflag; pick/record never clear a flag', async () => {
  const root = makeRoot({ lines: [ONE] });
  seedTakes(root, K1);
  setFlag({ root }, K1, 'stress sounds wrong');
  replyFlag({ root }, K1, 're-rolled, picked 2');
  pickTake({ root }, K1, 2);
  await recordTakes({ root, synthesize: fakeSynth() }, [K1]);
  const flag = readJson(root, 'scripts/voice/flags.json')[K1];
  assert.equal(flag.note, 'stress sounds wrong');
  assert.equal(flag.reply, 're-rolled, picked 2');
  assert.match(flag.at, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(flag.repliedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(status({ root })[0].flag.note, 'stress sounds wrong');
  setFlag({ root }, K1, null);
  assert.deepEqual(readJson(root, 'scripts/voice/flags.json'), {});
});
