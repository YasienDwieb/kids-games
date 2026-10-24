import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { clipKey, pickTake, slug } from '../core.mjs';
import { createStudioServer, listen, refreshCatalog } from '../studio.mjs';
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

test('state lists clips and games, hides the key', async (t) => {
  const before = process.env.GOOGLE_TTS_API_KEY;
  process.env.GOOGLE_TTS_API_KEY = 'secret-key-123';
  t.after(() => (before === undefined ? delete process.env.GOOGLE_TTS_API_KEY : (process.env.GOOGLE_TTS_API_KEY = before)));
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
  assert.equal(state.takes, 3); // from voice.config.json, for the page's copy and shortcuts
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
  assert.deepEqual(job.keys, [K1]); // a reloaded page knows which cards are recording
  assert.equal(job.takesDone, 3);
  assert.equal(job.takesTotal, 3);
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

/** A raw request, so the test controls Host/Origin like a hostile page would. */
function raw(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, { method, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('refuses cross-site requests: foreign Origin, non-JSON POST, foreign Host', async () => {
  const { root, url } = await studio();
  const body = JSON.stringify({ key: K1, note: 'injected' });
  assert.equal(await raw(`${url}/api/flag`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body }), 403);
  assert.equal(await raw(`${url}/api/flag`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body }), 403);
  assert.equal(await raw(`${url}/api/state`, { headers: { Host: 'evil.example:4317' } }), 403);
  assert.deepEqual(readJson(root, 'scripts/voice/flags.json'), {});
  // The page itself (same origin, JSON) still works.
  assert.equal(await raw(`${url}/api/flag`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url }, body }), 200);
});

test('a broken audio file does not take the server down', async () => {
  const { root, url } = await studio();
  const dir = join(root, 'scripts/voice/.takes', slug(K1), 'take-7.mp3');
  mkdirSync(dir); // a directory where a take should be: reading it fails
  assert.notEqual((await fetch(`${url}/audio/take/${slug(K1)}/7`).catch(() => ({ status: 0 }))).status, 200);
  assert.equal((await fetch(`${url}/api/job`)).status, 200);
});

test('listens on 127.0.0.1 only', async () => {
  const server = createStudioServer({ root: makeRoot({ lines: [] }), keyReady: false });
  servers.push(server);
  await listen(server, 0);
  assert.equal(server.address().address, '127.0.0.1');
});

test('an oversized body is refused and the server stays up', async () => {
  const { url } = await studio();
  const res = await post(`${url}/api/flag`, { key: K1, note: 'x'.repeat(70 * 1024) }).catch(() => ({ status: 0 }));
  assert.notEqual(res.status, 200);
  assert.equal((await fetch(`${url}/api/job`)).status, 200);
});

test('refreshCatalog: a failed run gives a warning with its output, and has a timeout', () => {
  let options;
  const warning = refreshCatalog((cmd, args, opts) => {
    options = opts;
    return { status: 1, stdout: 'writing rules: ة not هْ\n', stderr: '' };
  });
  assert.match(warning, /^The catalog refresh failed/);
  assert.match(warning, /writing rules: ة not هْ/);
  assert.equal(options.timeout, 120000);
  assert.equal(refreshCatalog(() => ({ status: 0, stdout: '', stderr: '' })), null);
});
