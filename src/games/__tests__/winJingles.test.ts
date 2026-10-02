import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ASSETS } from '@/sdk/assets/manifest';

// Read configs as text: importing them would pull in every game component.
const GAMES_DIR = join(__dirname, '..');
const registered = [...readFileSync(join(GAMES_DIR, 'index.ts'), 'utf8').matchAll(/import '\.\/([\w-]+)\/config'/g)].map(
  (m) => m[1],
);

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
    const jingles = registered.map(winJingle);
    for (const [i, j] of jingles.entries()) {
      expect([registered[i], j && j in ASSETS]).toEqual([registered[i], true]);
    }
    expect(new Set(jingles).size).toBe(jingles.length);
  });
});
