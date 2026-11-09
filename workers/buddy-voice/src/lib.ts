/** Pure helpers for the buddy-voice worker: what a buddy says, how names are checked, cache keys. */

export const LANGS = ['en', 'ar'] as const;
export type Lang = (typeof LANGS)[number];

export const BUDDIES = ['mariam', 'anas'] as const;
export type Buddy = (typeof BUDDIES)[number];

export const MAX_TAKE = 3;
export const MAX_NAME = 20;

/**
 * Bump when a voice, style or line changes: old cached clips stop matching
 * and are re-recorded on the next request.
 */
export const VOICE_VERSION = 'v1';

/** Same voices and direction as the bundled welcome clips (see CREDITS.md). */
export const VOICES: Record<Buddy, { voice: string; style: string }> = {
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

export function welcomeLine(lang: Lang, name: string): string {
  return lang === 'ar'
    ? `مَرْحَبًا! أنا ${name}. هَيّا نَلْعَبُ ونَتَعَلَّمُ مَعًا!`
    : `Hi! I'm ${name}. Let's play and learn together!`;
}

const TATWEEL = /ـ/g;

/** One spelling per name: NFC, trimmed, single spaces, no tatweel. */
export function normalizeName(raw: string): string {
  return raw.normalize('NFC').replace(TATWEEL, '').replace(/\s+/g, ' ').trim();
}

// Latin or Arabic letters (with their marks), spaces, hyphens and apostrophes.
const NAME_RE = /^[\p{Script=Latin}\p{Script=Arabic}\p{M} '’-]+$/u;

/** A short list on purpose; extend it as reports come in. Matched as whole words. */
const BLOCKED = new Set([
  'ass', 'bitch', 'cock', 'cunt', 'dick', 'fuck', 'nigger', 'penis', 'porn', 'pussy', 'sex', 'shit', 'slut', 'whore',
  'زب', 'كس', 'شرموطة', 'شرموط', 'عرص', 'منيوك', 'قحبة', 'خول', 'طيز', 'نيك',
]);

export type NameCheck = { ok: true; name: string } | { ok: false; reason: 'empty' | 'long' | 'chars' | 'blocked' };

export function checkName(raw: unknown): NameCheck {
  if (typeof raw !== 'string') return { ok: false, reason: 'empty' };
  const name = normalizeName(raw);
  if (!name) return { ok: false, reason: 'empty' };
  if ([...name.replace(/\p{M}/gu, '')].length > MAX_NAME) return { ok: false, reason: 'long' };
  if (!NAME_RE.test(name)) return { ok: false, reason: 'chars' };
  const words = name.toLowerCase().replace(/\p{M}/gu, '').split(/[\s'’-]+/);
  if (words.some((w) => BLOCKED.has(w))) return { ok: false, reason: 'blocked' };
  return { ok: true, name };
}

export type WelcomeRequest = { buddy: Buddy; lang: Lang; name: string; take: number };

export function parseRequest(body: unknown): WelcomeRequest | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'body' };
  const b = body as Record<string, unknown>;
  if (!BUDDIES.includes(b.buddy as Buddy)) return { error: 'buddy' };
  if (!LANGS.includes(b.lang as Lang)) return { error: 'lang' };
  const take = b.take === undefined ? 1 : b.take;
  if (typeof take !== 'number' || !Number.isInteger(take) || take < 1 || take > MAX_TAKE) return { error: 'take' };
  const name = checkName(b.name);
  if (!name.ok) return { error: `name:${name.reason}` };
  return { buddy: b.buddy as Buddy, lang: b.lang as Lang, name: name.name, take };
}

/**
 * Hashed so a bucket listing never shows a child's name. Case-folded: "Sara" and
 * "sara" sound the same and share one clip.
 */
export async function cacheKey(req: WelcomeRequest): Promise<string> {
  const text = [VOICE_VERSION, req.buddy, req.lang, req.name.toLowerCase(), req.take].join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `welcome/${hex}.wav`;
}

export function geminiBody(req: WelcomeRequest) {
  const { voice, style } = VOICES[req.buddy];
  return {
    contents: [{ role: 'user', parts: [{ text: welcomeLine(req.lang, req.name), speech_metadata: { style } }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      responseFormat: { audio: { mimeType: 'AUDIO_WAV', sampleRate: 24000 } },
      speechConfig: { voiceConfig: { voice } },
    },
  };
}

/** The WAV bytes in a Gemini response, or null when there are none. */
export function audioFrom(json: unknown): Uint8Array<ArrayBuffer> | null {
  const data = (json as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] })
    ?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!data) return null;
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const riff = bytes.length > 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF';
  return riff ? bytes : null;
}
