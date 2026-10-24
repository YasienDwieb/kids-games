import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { clipKey, pickTake, slug } from '../core.mjs';
import { LISTEN_HOST, createStudioServer } from '../studio.mjs';
import { fakeSynth, line, makeRoot, readJson, tone } from './fixtures.mjs';

const K1 = clipKey('en', 'one');
const servers = [];
after(() => servers.forEach((s) => s.close()));

function seedTakes(root, key) {
  const dir = join(root, 'scripts/voice/.takes', slug(key));
  mkdirSync(dir, { recursive: true });
  for (const n of [1, 2, 3]) writeFileSync(join(dir, `take-${n}.mp3`), tone(1 + n / 10));
}

/** A studio over a fixture root with one phrase that has a clip; returns its base URL. */
async function studio(options = {}) {
  const root = makeRoot({ lines: [line('en', 'one')] });
  seedTakes(root, K1);
  pickTake({ root }, K1, 1);
  const server = createStudioServer({ root, keyReady: true, warning: null, ...options, root });
  servers.push(server);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { root, url: `http://127.0.0.1:${server.address().port}` };
}
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('state lists clips and games, hides the key', async () => {
  process.env.GOOGLE_TTS_API_KEY = 'secret-key-123';
  const { url } = await studio();
  const res = await fetch(`${url}/api/state`);
  const text = await res.text();
  const state = JSON.parse(text);
  assert.equal(state.clips.length, 1);
  assert.equal(state.clips[0].key, K1);
  assert.equal(state.games[0].id, 'numbers-land');
  assert.equal(state.keyReady, true);
  assert.equal(text.includes('secret-key-123'), false);
  assert.equal(text.includes('/scripts/voice/.takes'), false); // no absolute paths leak to the page
});

test('state carries the catalog warning', async () => {
  const { url } = await studio({ warning: 'Arabic writing rules failed' });
  assert.equal((await (await fetch(`${url}/api/state`)).json()).warning, 'Arabic writing rules failed');
});

test('serves clip and take audio; rejects traversal', async () => {
  const { root, url } = await studio();
  const file = readJson(root, 'src/sdk/speech/clips.lock.json')[K1].file;
  const clip = await fetch(`${url}/audio/clip/${file}`);
  assert.equal(clip.status, 200);
  assert.equal(clip.headers.get('content-type'), 'audio/mp4');
  const take = await fetch(`${url}/audio/take/${slug(K1)}/2`);
  assert.equal(take.status, 200);
  assert.equal(take.headers.get('content-type'), 'audio/mpeg');
  assert.equal((await fetch(`${url}/audio/clip/..%2F..%2F..%2Fpackage.json`)).status, 404);
  assert.equal((await fetch(`${url}/audio/take/${slug(K1)}/..%2F..%2Fx`)).status, 404);
});

test('pick via POST updates the lock', async () => {
  const { root, url } = await studio();
  const res = await post(`${url}/api/pick`, { key: K1, n: 3 });
  assert.equal(res.status, 200);
  assert.equal(readJson(root, 'src/sdk/speech/clips.lock.json')[K1].take, 3);
  assert.equal((await post(`${url}/api/pick`, { key: K1, n: 9 })).status, 400);
});

test('record runs one job at a time', async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const synth = fakeSynth();
  const { url } = await studio({ synthesize: async (...a) => (await gate, synth(...a)) });
  assert.equal((await post(`${url}/api/record`, { keys: [K1] })).status, 202);
  assert.equal((await post(`${url}/api/record`, { keys: [K1] })).status, 409);
  release();
  let job;
  for (let i = 0; i < 100; i++) {
    job = await (await fetch(`${url}/api/job`)).json();
    if (!job.running) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(job.running, false);
  assert.deepEqual(job.written, [K1]);
  assert.equal(job.total, 1);
});

test('record is refused without a key', async () => {
  const { url } = await studio({ keyReady: false });
  assert.equal((await post(`${url}/api/record`, { keys: [K1] })).status, 400);
});

test('flag via POST writes flags.json', async () => {
  const { root, url } = await studio();
  assert.equal((await post(`${url}/api/flag`, { key: K1, note: 'too fast' })).status, 200);
  assert.equal(readJson(root, 'scripts/voice/flags.json')[K1].note, 'too fast');
  await post(`${url}/api/flag`, { key: K1, note: null });
  assert.deepEqual(readJson(root, 'scripts/voice/flags.json'), {});
});

test('listens on 127.0.0.1 only', () => {
  assert.equal(LISTEN_HOST, '127.0.0.1');
});
