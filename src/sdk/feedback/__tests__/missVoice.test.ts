import { readFileSync } from 'fs';
import { join } from 'path';
import { i18n } from '@/sdk/i18n';
import { clipKey } from '@/sdk/speech/clipKey';
import { MISS_HOLD_MS, missPhrase, shouldSpeakMiss } from '../missVoice';

const lock = JSON.parse(readFileSync(join(__dirname, '../../speech/clips.lock.json'), 'utf8')) as Record<
  string,
  { durationS: number }
>;

beforeAll(() => i18n.isInitialized || i18n.init());

it('leaves the first miss to the sound', () => {
  expect(shouldSpeakMiss(1)).toBe(false);
  expect(shouldSpeakMiss(2)).toBe(true);
  expect(shouldSpeakMiss(7)).toBe(true);
});

it.each(['en', 'ar'] as const)('holds the voice for the whole %s cue', (lang) => {
  expect(lock[clipKey(lang, missPhrase(lang))].durationS * 1000).toBeLessThan(MISS_HOLD_MS[lang]);
});
