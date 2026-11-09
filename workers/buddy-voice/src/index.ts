/**
 * Records a buddy's welcome line with a custom name ("Hi! I'm <name>…") and
 * returns it as WAV. Clips are cached in R2 under a hash of the text, so a name
 * any child already chose is served without calling Gemini again.
 *
 *   POST /v1/welcome  { buddy: 'mariam'|'anas', lang: 'en'|'ar', name, take?: 1-3 }
 *   headers: x-app-key, x-install-id
 *
 * Names are children's data: nothing here logs them, and the R2 key is a hash.
 */
import { audioFrom, cacheKey, geminiBody, parseRequest } from './lib.ts';

interface R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}
interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  VOICES: R2Bucket;
  INSTALL_LIMITER: RateLimiter;
  IP_LIMITER: RateLimiter;
  GEMINI_API_KEY: string;
  APP_KEY: string;
  GEMINI_TTS_MODEL?: string;
  /** Test seam; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_MODEL = 'gemini-3.8-flash-tts';
const INSTALL_ID = /^[A-Za-z0-9-]{8,64}$/;

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } });

const wav = (bytes: ArrayBuffer | Uint8Array<ArrayBuffer>, cache: 'hit' | 'miss') =>
  new Response(bytes, { headers: { 'content-type': 'audio/wav', 'x-cache': cache } });

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/v1/welcome') return json(404, 'not_found');
  if (request.method !== 'POST') return json(405, 'method');

  if (!env.APP_KEY || request.headers.get('x-app-key') !== env.APP_KEY) return json(401, 'app_key');
  const installId = request.headers.get('x-install-id') ?? '';
  if (!INSTALL_ID.test(installId)) return json(400, 'install_id');

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const [perInstall, perIp] = await Promise.all([
    env.INSTALL_LIMITER.limit({ key: installId }),
    env.IP_LIMITER.limit({ key: ip }),
  ]);
  if (!perInstall.success || !perIp.success) return json(429, 'rate_limited');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, 'body');
  }
  const req = parseRequest(body);
  if ('error' in req) return json(400, req.error);

  const key = await cacheKey(req);
  const cached = await env.VOICES.get(key);
  if (cached) return wav(await cached.arrayBuffer(), 'hit');

  const model = env.GEMINI_TTS_MODEL || DEFAULT_MODEL;
  const doFetch = env.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(geminiBody(req)),
    });
  } catch {
    return json(502, 'tts_unreachable');
  }
  if (!res.ok) return json(502, `tts_${res.status}`);
  const audio = audioFrom(await res.json().catch(() => null));
  if (!audio) return json(502, 'tts_no_audio');

  await env.VOICES.put(key, audio, { httpMetadata: { contentType: 'audio/wav' } });
  return wav(audio, 'miss');
}

export default { fetch: handle };
