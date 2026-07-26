import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_SETTINGS } from '@/sdk/settings/store';

/**
 * Spoken prompts are game CONTENT, not decoration.
 *
 * In the listen-and-find games (letter-land, numbers-land, animal-safari) the
 * voice asks the question — "which letter is this?" is unanswerable with the
 * audio off. So speech must never be gated by a sound setting, and there must
 * be no toggle that lets a parent silently break those three games.
 *
 * Mirrors the source-inspection style of shape-detective's pattern-rtl test.
 */
describe('speech is never muted by settings', () => {
  const source = readFileSync(join(__dirname, '..', 'useSpeech.ts'), 'utf8');
  const code = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
    .join('\n');

  it('does not gate speaking on soundEnabled', () => {
    expect(code).not.toMatch(/soundEnabled/);
  });

  it('has no separate voice toggle to get wrong', () => {
    expect(code).not.toMatch(/voiceEnabled/);
    expect('voiceEnabled' in DEFAULT_SETTINGS).toBe(false);
  });

  it('still exposes the sound-effects setting, which speech ignores', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
  });
});
