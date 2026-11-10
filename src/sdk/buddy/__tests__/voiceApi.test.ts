const written: { name: string; bytes: Uint8Array }[] = [];

jest.mock('expo-file-system', () => {
  class Directory {
    uri = 'file:///doc/buddy-voice';
    exists = true;
    create() {}
    list() {
      return [];
    }
  }
  class File {
    uri: string;
    name: string;
    constructor(_dir: unknown, fileName: string) {
      this.name = fileName;
      this.uri = `file:///doc/buddy-voice/${fileName}`;
    }
    async write(bytes: Uint8Array) {
      written.push({ name: this.name, bytes });
    }
  }
  return { Directory, File, Paths: { document: {} } };
});

type Api = typeof import('../voiceApi');

function load(env: Record<string, string | undefined>): Api {
  Object.assign(process.env, env);
  let api!: Api;
  jest.isolateModules(() => {
    api = require('../voiceApi');
  });
  return api;
}

const reply = (status: number, body: BodyInit | null = new Uint8Array([82, 73, 70, 70])) =>
  jest.fn(async () => new Response(body, { status }));

beforeEach(() => {
  written.length = 0;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_VOICE_API_URL;
  delete process.env.EXPO_PUBLIC_VOICE_APP_KEY;
});

it('is off without a configured service', async () => {
  const api = load({});
  expect(api.voiceNamingAvailable).toBe(false);
  expect(await api.recordWelcome('mariam', 'en', 'Noor')).toEqual({ ok: false, error: 'server' });
});

it('posts the name and saves the clip on the device', async () => {
  const api = load({ EXPO_PUBLIC_VOICE_API_URL: 'https://voice.test/', EXPO_PUBLIC_VOICE_APP_KEY: 'k' });
  const fetchMock = reply(200);
  global.fetch = fetchMock as unknown as typeof fetch;

  const res = await api.recordWelcome('anas', 'ar', 'عمر', 2);
  expect(res.ok).toBe(true);
  expect(written).toHaveLength(1);
  expect(written[0].name).toMatch(/^anas-ar-\d+-2\.wav$/);

  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('https://voice.test/v1/welcome');
  expect(JSON.parse(String(init.body))).toEqual({ buddy: 'anas', lang: 'ar', name: 'عمر', take: 2 });
  const headers = init.headers as Record<string, string>;
  expect(headers['x-app-key']).toBe('k');
  expect(headers['x-install-id']).toMatch(/^[0-9a-f-]{36}$/);
});

it.each([
  [429, null, 'rate'],
  [400, JSON.stringify({ error: 'name:blocked' }), 'blocked'],
  [400, JSON.stringify({ error: 'name:chars' }), 'invalid'],
  [502, JSON.stringify({ error: 'tts_500' }), 'server'],
])('maps HTTP %i to %s', async (status, body, error) => {
  const api = load({ EXPO_PUBLIC_VOICE_API_URL: 'https://voice.test', EXPO_PUBLIC_VOICE_APP_KEY: 'k' });
  global.fetch = reply(status, body) as unknown as typeof fetch;
  expect(await api.recordWelcome('mariam', 'en', 'Noor')).toEqual({ ok: false, error });
  expect(written).toHaveLength(0);
});

it('reports a network failure', async () => {
  const api = load({ EXPO_PUBLIC_VOICE_API_URL: 'https://voice.test', EXPO_PUBLIC_VOICE_APP_KEY: 'k' });
  global.fetch = jest.fn(async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  expect(await api.recordWelcome('mariam', 'en', 'Noor')).toEqual({ ok: false, error: 'network' });
});
