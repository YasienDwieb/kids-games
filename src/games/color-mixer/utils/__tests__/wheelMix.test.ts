import { COLORS } from '../../constants';
import { MIX_CAP, PIGMENT_IDS, addDrop, mixHex, removeDrop, tally } from '../wheelMix';
import type { PigmentId } from '../../types';

const log = (...drops: PigmentId[]): PigmentId[] => drops;

describe('wheelMix — pigment model', () => {
  describe('a single drop renders as its own palette swatch', () => {
    // The core invariant: if a child drops one blue and the pot does not show the blue
    // they picked up, nothing downstream can feel trustworthy.
    it.each(PIGMENT_IDS)('%s', (id) => {
      expect(mixHex(log(id))?.toLowerCase()).toBe(COLORS[id].hex.toLowerCase());
    });
  });

  describe('two primaries land exactly on the authored secondary', () => {
    it('red + yellow = orange', () => {
      expect(mixHex(log('red', 'yellow'))?.toLowerCase()).toBe('#f57c00');
    });

    it('yellow + blue = green (a real green, not a sage gray)', () => {
      expect(mixHex(log('yellow', 'blue'))?.toLowerCase()).toBe('#43a047');
    });

    it('red + blue = purple', () => {
      expect(mixHex(log('red', 'blue'))?.toLowerCase()).toBe('#8e24aa');
    });
  });

  it('all three primaries make a genuine brown, not a gray', () => {
    const brown = mixHex(log('red', 'yellow', 'blue'))!;
    expect(brown.toLowerCase()).toBe('#916146');

    // A gray has all three channels within a few points of each other; brown must not.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(brown.slice(i, i + 2), 16));
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(40);
  });

  it('white tints and black shades', () => {
    expect(mixHex(log('red', 'white'))?.toLowerCase()).toBe('#f09a98');
    expect(mixHex(log('blue', 'white'))?.toLowerCase()).toBe('#8cc1f0');

    // More white keeps moving toward white, never past it.
    const oneWhite = mixHex(log('red', 'white'))!;
    const threeWhite = mixHex(log('red', 'white', 'white', 'white'))!;
    expect(parseInt(threeWhite.slice(3, 5), 16)).toBeGreaterThan(parseInt(oneWhite.slice(3, 5), 16));
  });

  it('is order independent — the same drops give the same color', () => {
    expect(mixHex(log('red', 'yellow', 'blue'))).toBe(mixHex(log('blue', 'red', 'yellow')));
    expect(mixHex(log('red', 'red', 'blue'))).toBe(mixHex(log('blue', 'red', 'red')));
  });

  it('is proportional — more red moves the mix toward red', () => {
    const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const distance = (a: string, b: string) =>
      Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));

    const pureRed = COLORS.red.hex;
    const evenMix = mixHex(log('red', 'yellow'))!;
    const redHeavy = mixHex(log('red', 'red', 'yellow'))!;

    expect(redHeavy).not.toBe(evenMix);
    // 2:1 sits strictly between 1:1 and pure red — the whole point of a drop log is that
    // ratios in between are reachable, not just the endpoints.
    expect(distance(redHeavy, pureRed)).toBeLessThan(distance(evenMix, pureRed));
    expect(distance(redHeavy, pureRed)).toBeGreaterThan(0);
  });

  it('an empty log has no color', () => {
    expect(mixHex([])).toBeNull();
  });

  it('never emits a malformed hex, for any reachable log', () => {
    const seen: string[] = [];
    for (const a of PIGMENT_IDS) {
      for (const b of PIGMENT_IDS) {
        for (const c of PIGMENT_IDS) seen.push(mixHex(log(a, b, c))!);
      }
    }
    for (const hex of seen) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  describe('the pot is capped', () => {
    it(`holds at most ${MIX_CAP} drops`, () => {
      let pot: PigmentId[] = [];
      for (let i = 0; i < MIX_CAP + 6; i++) pot = addDrop(pot, 'red');
      expect(pot).toHaveLength(MIX_CAP);
    });

    it('is always recoverable — undo frees room for a different pigment', () => {
      // A full pot silently refusing every drop is what a child experiences as the game
      // breaking. The cap must be a wall you can step back from, not a dead end.
      let pot: PigmentId[] = [];
      for (let i = 0; i < MIX_CAP; i++) pot = addDrop(pot, 'blue');
      expect(addDrop(pot, 'yellow')).toHaveLength(MIX_CAP);

      const afterUndo = removeDrop(pot);
      const steered = addDrop(afterUndo, 'yellow');
      expect(steered).toHaveLength(MIX_CAP);
      expect(mixHex(steered)).not.toBe(mixHex(pot));
    });

    it('a drop past the cap changes nothing at all', () => {
      let pot: PigmentId[] = [];
      for (let i = 0; i < MIX_CAP; i++) pot = addDrop(pot, 'blue');
      const before = mixHex(pot);
      const after = mixHex(addDrop(pot, 'red'));
      expect(after).toBe(before);
    });
  });

  it('tallies a log into per-pigment counts', () => {
    expect(tally(log('red', 'blue', 'red'))).toMatchObject({ red: 2, blue: 1, yellow: 0 });
  });
});
