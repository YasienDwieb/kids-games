// A throwaway repo root for the voice tools: config, catalog, and ffmpeg-made audio.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CONFIG = {
  provider: 'google',
  voices: { en: 'en-US-Chirp3-HD-Leda', ar: 'ar-XA-Chirp3-HD-Leda' },
  takes: 3,
  loudness: { rmsDb: -25, peakDb: -6 },
  format: { sampleRate: 24000, codec: 'aac', bitrate: '64k' },
};

export const GAMES = [{ id: 'numbers-land', name: 'Numbers Land', icon: '🔢', accent: { base: '#FFA51F', deep: '#E58600', tint: '#FFEFCF' } }];

export const line = (lang, text, game = 'numbers-land', where = 'Listen & find') => ({ lang, text, uses: [{ game, where }] });

const toneCache = new Map();
/** MP3 bytes of a sine tone lasting `seconds`. */
export function tone(seconds) {
  if (!toneCache.has(seconds)) {
    const dir = mkdtempSync(join(tmpdir(), 'tone-'));
    const out = join(dir, 'tone.mp3');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`, '-ac', '1', '-ar', '24000', out]);
    toneCache.set(seconds, readFileSync(out));
  }
  return toneCache.get(seconds);
}

/** A temp root holding the voice tools' files. */
export function makeRoot({ lines, lock = {}, flags = {}, config = CONFIG } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'voice-'));
  for (const d of ['scripts/voice/.takes', 'src/sdk/speech', 'src/sdk/assets/audio/speech']) mkdirSync(join(root, d), { recursive: true });
  writeFileSync(join(root, 'scripts/voice/voice.config.json'), JSON.stringify(config));
  writeFileSync(join(root, 'scripts/voice/catalog.json'), JSON.stringify({ games: GAMES, lines }));
  writeFileSync(join(root, 'scripts/voice/flags.json'), JSON.stringify(flags));
  writeFileSync(join(root, 'src/sdk/speech/clips.lock.json'), JSON.stringify(lock));
  return root;
}

export const readJson = (root, rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));
export const readText = (root, rel) => readFileSync(join(root, rel), 'utf8');

/** A fake Google: per text, the n-th call returns a tone of `lengths[n]` seconds; `fail` texts reject. */
export function fakeSynth({ lengths = [2, 1, 1.5], fail = new Set() } = {}) {
  const calls = new Map();
  const synth = async (lang, text) => {
    const n = calls.get(text) ?? 0;
    calls.set(text, n + 1);
    if (typeof fail === 'function' ? fail(text, n) : fail.has(text)) throw new Error('HTTP 500: boom');
    return tone(lengths[n % lengths.length]);
  };
  synth.calls = calls;
  return synth;
}
