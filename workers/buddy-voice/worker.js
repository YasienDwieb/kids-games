// buddy-voice: records a buddy's welcome line with a custom name, cached in R2.
// Paste into the Cloudflare dashboard. Bindings: VOICES (R2 bucket), LIMITER
// (rate limiting, optional). Secrets: GEMINI_API_KEY, APP_KEY.
//
//   POST /v1/welcome  { buddy: 'mariam'|'anas', lang: 'en'|'ar', name, take?: 1-3 }
//   headers: x-app-key, x-install-id  →  audio/wav
//
// Names are children's data: never log them; R2 keys are hashes.

const MODEL = 'gemini-3.8-flash-tts';
// Bump when a voice, style or line changes so old cached clips stop matching.
const VERSION = 'v1';

const VOICES = {
  mariam: {
    voice: 'Leda',
    style:
      'A cheerful, playful little girl about 6 years old greeting a new friend: bright, warm, smiling voice, bouncy and excited, natural pace, not rushed.',
  },
  anas: {
    voice: 'Zephyr',
    style:
      'Voice a real 5-year-old little boy, like a cartoon kid character: small, high, light childlike voice, playful and giggly, full of excitement, natural child pace.',
  },
};

const LINES = {
  en: (name) => `Hi! I'm ${name}. Let's play and learn together!`,
  ar: (name) => `مَرْحَبًا! أنا ${name}. هَيّا نَلْعَبُ ونَتَعَلَّمُ مَعًا!`,
};

const NAME_RE = /^[\p{Script=Latin}\p{Script=Arabic}\p{M} '’-]{1,40}$/u;
const BLOCKED = new Set([
  'ass', 'bitch', 'cock', 'cunt', 'dick', 'fuck', 'penis', 'porn', 'pussy', 'sex', 'shit', 'slut', 'whore',
  'زب', 'كس', 'شرموطة', 'شرموط', 'عرص', 'منيوك', 'قحبة', 'طيز', 'نيك',
]);

const error = (status, code) => Response.json({ error: code }, { status });
const wav = (body, cache) => new Response(body, { headers: { 'content-type': 'audio/wav', 'x-cache': cache } });

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').replace(/ـ/g, '').replace(/\s+/g, ' ').trim();
  const letters = [...name.replace(/\p{M}/gu, '')].length;
  if (!letters || letters > 20 || !NAME_RE.test(name)) return null;
  return name;
}

const isBlocked = (name) => name.toLowerCase().replace(/\p{M}/gu, '').split(/[\s'’-]+/).some((w) => BLOCKED.has(w));

async function cacheKey(buddy, lang, name, take) {
  const text = [VERSION, buddy, lang, name.toLowerCase(), take].join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return `welcome/${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}.wav`;
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/v1/welcome') return error(404, 'not_found');
    if (request.method !== 'POST') return error(405, 'method');
    if (!env.APP_KEY || request.headers.get('x-app-key') !== env.APP_KEY) return error(401, 'app_key');

    const installId = request.headers.get('x-install-id') ?? '';
    if (!/^[A-Za-z0-9-]{8,64}$/.test(installId)) return error(400, 'install_id');
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: installId });
      if (!success) return error(429, 'rate_limited');
    }

    const body = await request.json().catch(() => null);
    const buddy = body?.buddy;
    const lang = body?.lang;
    const take = body?.take ?? 1;
    if (!VOICES[buddy]) return error(400, 'buddy');
    if (!LINES[lang]) return error(400, 'lang');
    if (![1, 2, 3].includes(take)) return error(400, 'take');
    const name = cleanName(body?.name);
    if (!name) return error(400, 'name:invalid');
    if (isBlocked(name)) return error(400, 'name:blocked');

    const key = await cacheKey(buddy, lang, name, take);
    const cached = await env.VOICES.get(key);
    if (cached) return wav(cached.body, 'hit');

    const { voice, style } = VOICES[buddy];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: LINES[lang](name), speech_metadata: { style } }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice } } },
      }),
    }).catch(() => null);
    if (!res?.ok) return error(502, `tts_${res?.status ?? 'unreachable'}`);

    const data = (await res.json().catch(() => null))?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
      ?.inlineData?.data;
    if (!data) return error(502, 'tts_no_audio');
    const audio = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

    await env.VOICES.put(key, audio, { httpMetadata: { contentType: 'audio/wav' } });
    return wav(audio, 'miss');
  },
};
