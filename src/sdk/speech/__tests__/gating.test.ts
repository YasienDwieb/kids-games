import { DEFAULT_SETTINGS, type Settings } from '@/sdk/settings/store';

/**
 * The listen-and-find games (letter-land, numbers-land, animal-safari) ask
 * their question out loud, so the spoken prompt is content, not decoration.
 * Muting sound effects must never silence it — that would leave those games
 * showing "which letter is this?" with nothing to hear.
 */
describe('voice is independent of sound effects', () => {
  it('ships enabled by default', () => {
    expect(DEFAULT_SETTINGS.voiceEnabled).toBe(true);
  });

  it('stays on when sound effects are muted', () => {
    const muted: Settings = { ...DEFAULT_SETTINGS, soundEnabled: false };
    expect(muted.voiceEnabled).toBe(true);
  });

  it('can be turned off without muting sound effects', () => {
    const quiet: Settings = { ...DEFAULT_SETTINGS, voiceEnabled: false };
    expect(quiet.soundEnabled).toBe(true);
  });
});
