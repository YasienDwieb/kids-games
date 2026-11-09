import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cacheKey, checkName, normalizeName, parseRequest, welcomeLine } from '../src/lib.ts';
import { handle, type Env } from '../src/index.ts';

const WAV = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat(Array(40).fill(0)));
const b64 = Buffer.from(WAV).toString('base64');

function makeEnv(overrides: Partial<Env> = {}) {
  const store = new Map<string, Uint8Array>();
  const calls: unknown[] = [];
  const env: Env = {
    VOICES: {
      get: async (k) => (store.has(k) ? { arrayBuffer: async () => store.get(k)!.buffer as ArrayBuffer } : null),
      put: async (k, v) => void store.set(k, v),
    },
    INSTALL_LIMITER: { limit: async () => ({ success: true }) },
    IP_LIMITER: { limit: async () => ({ success: true }) },
    GEMINI_API_KEY: 'gk',
    APP_KEY: 'app',
    fetchImpl: (async (_url: string, init: RequestInit) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: b64 } }] } }] }));
    }) as typeof fetch,
    ...overrides,
  };
  return { env, store, calls };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://voice.example/v1/welcome', {
    method: 'POST',
    headers: { 'x-app-key': 'app', 'x-install-id': 'install-1234', ...headers },
    body: JSON.stringify(body),
  });

test('normalizes spacing, tatweel and unicode form', () => {
  assert.equal(normalizeName('  Sa   ra '), 'Sa ra');
  assert.equal(normalizeName('سـارة'), 'سارة');
});

test('accepts Latin and Arabic names with marks, rejects the rest', () => {
  assert.deepEqual(checkName('Noor'), { ok: true, name: 'Noor' });
  assert.equal(checkName('يُوسُف').ok, true);
  assert.equal(checkName("O'Brien-Lee").ok, true);
  assert.deepEqual(checkName(''), { ok: false, reason: 'empty' });
  assert.deepEqual(checkName('a'.repeat(21)), { ok: false, reason: 'long' });
  assert.deepEqual(checkName('Sara2'), { ok: false, reason: 'chars' });
  assert.deepEqual(checkName('<b>'), { ok: false, reason: 'chars' });
  assert.deepEqual(checkName('Shit'), { ok: false, reason: 'blocked' });
});

test('diacritics do not count toward the length limit', () => {
  assert.equal(checkName('مُحَمَّد عَبْدُ الرَّحْمَن').ok, true);
});

test('validates the request shape', () => {
  assert.deepEqual(parseRequest({ buddy: 'anas', lang: 'en', name: 'Omar' }), { buddy: 'anas', lang: 'en', name: 'Omar', take: 1 });
  assert.deepEqual(parseRequest({ buddy: 'lulu', lang: 'en', name: 'Omar' }), { error: 'buddy' });
  assert.deepEqual(parseRequest({ buddy: 'anas', lang: 'fr', name: 'Omar' }), { error: 'lang' });
  assert.deepEqual(parseRequest({ buddy: 'anas', lang: 'en', name: 'Omar', take: 4 }), { error: 'take' });
});

test('the cache key hides the name and folds case', async () => {
  const a = await cacheKey({ buddy: 'mariam', lang: 'en', name: 'Sara', take: 1 });
  assert.match(a, /^welcome\/[0-9a-f]{64}\.wav$/);
  assert.equal(a, await cacheKey({ buddy: 'mariam', lang: 'en', name: 'sara', take: 1 }));
  assert.notEqual(a, await cacheKey({ buddy: 'mariam', lang: 'en', name: 'Sara', take: 2 }));
  assert.notEqual(a, await cacheKey({ buddy: 'anas', lang: 'en', name: 'Sara', take: 1 }));
});

test('welcome lines carry the name', () => {
  assert.equal(welcomeLine('en', 'Noor'), "Hi! I'm Noor. Let's play and learn together!");
  assert.ok(welcomeLine('ar', 'نور').includes('أنا نور.'));
});

test('records once, then serves the same name from R2', async () => {
  const { env, calls, store } = makeEnv();
  const first = await handle(post({ buddy: 'mariam', lang: 'en', name: 'Noor' }), env);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('x-cache'), 'miss');
  assert.equal(first.headers.get('content-type'), 'audio/wav');
  assert.equal(calls.length, 1);
  assert.equal(store.size, 1);

  const second = await handle(post({ buddy: 'mariam', lang: 'en', name: 'noor' }, { 'x-install-id': 'other-install' }), env);
  assert.equal(second.headers.get('x-cache'), 'hit');
  assert.equal(calls.length, 1);
  assert.deepEqual(new Uint8Array(await second.arrayBuffer()), WAV);
});

test('sends the buddy voice and style to Gemini', async () => {
  const { env, calls } = makeEnv();
  await handle(post({ buddy: 'anas', lang: 'ar', name: 'عمر' }), env);
  const body = calls[0] as { contents: { parts: { text: string }[] }[]; generationConfig: { speechConfig: { voiceConfig: { voice: string } } } };
  assert.equal(body.generationConfig.speechConfig.voiceConfig.voice, 'Zephyr');
  assert.ok(body.contents[0].parts[0].text.includes('عمر'));
});

test('rejects bad keys, bad install ids, bad names and rate-limited callers', async () => {
  const { env, calls } = makeEnv();
  assert.equal((await handle(post({ buddy: 'mariam', lang: 'en', name: 'Noor' }, { 'x-app-key': 'nope' }), env)).status, 401);
  assert.equal((await handle(post({ buddy: 'mariam', lang: 'en', name: 'Noor' }, { 'x-install-id': '!' }), env)).status, 400);
  assert.equal((await handle(post({ buddy: 'mariam', lang: 'en', name: 'Shit' }), env)).status, 400);
  const limited = makeEnv({ INSTALL_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal((await handle(post({ buddy: 'mariam', lang: 'en', name: 'Noor' }), limited.env)).status, 429);
  assert.equal(calls.length, 0);
});

test('does not cache when Gemini fails', async () => {
  const { env, store } = makeEnv({ fetchImpl: (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch });
  assert.equal((await handle(post({ buddy: 'mariam', lang: 'en', name: 'Noor' }), env)).status, 502);
  assert.equal(store.size, 0);
});
