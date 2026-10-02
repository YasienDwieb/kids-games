import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ASSETS } from '@/sdk/assets/manifest';

// Read configs as text: importing them would pull in every game component.
const GAMES_DIR = join(__dirname, '..');
const registered = [...readFileSync(join(GAMES_DIR, 'index.ts'), 'utf8').matchAll(/import '\.\/([\w-]+)\/config'/g)].map(
  (m) => m[1],
);
// Endless games that never play 'win' (they only play 'success'), so a jingle would be dead config.
const NO_WIN_SOUND = ['count-and-pop'];
const withWin = registered.filter((g) => !NO_WIN_SOUND.includes(g));

function winJingle(game: string): string | undefined {
  const src = readFileSync(join(GAMES_DIR, game, 'config.ts'), 'utf8');
  return src.match(/'sfx\.win':\s*'([\w.-]+)'/)?.[1];
}

describe('per-game win jingles', () => {
  it('finds the registered games', () => {
    expect(registered.length).toBeGreaterThan(0);
    for (const g of registered) expect(existsSync(join(GAMES_DIR, g, 'config.ts'))).toBe(true);
  });

  it('gives every registered game its own jingle', () => {
    const jingles = withWin.map(winJingle);
    for (const [i, j] of jingles.entries()) {
      expect([withWin[i], j && j in ASSETS]).toEqual([withWin[i], true]);
    }
    expect(new Set(jingles).size).toBe(jingles.length);
  });

  it('keeps games that never play a win sound free of a dead override', () => {
    for (const g of NO_WIN_SOUND) expect([g, winJingle(g)]).toEqual([g, undefined]);
  });
});
