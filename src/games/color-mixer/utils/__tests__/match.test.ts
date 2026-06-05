import { COLORS, MATCH_THRESHOLD } from '../../constants';
import { addColorToMix } from '../colorMath';
import { colorDistance, nearestFamous, closeness, FAMOUS_IDS } from '../match';
import type { ColorId } from '../../types';

describe('colorDistance', () => {
  it('is 0 for identical colors', () => {
    expect(colorDistance('#FF9800', '#FF9800')).toBe(0);
  });
  it('is symmetric and positive for different colors', () => {
    const d1 = colorDistance('#000000', '#FFFFFF');
    const d2 = colorDistance('#FFFFFF', '#000000');
    expect(d1).toBe(d2);
    expect(d1).toBeGreaterThan(0);
  });
});

describe('nearestFamous', () => {
  it('returns the famous id when within threshold', () => {
    expect(nearestFamous(COLORS.orange.hex)).toBe('orange');
  });
  it('returns null for a far-off color (a primary stays unmatched)', () => {
    expect(nearestFamous('#000000')).toBeNull();
  });
});

describe('closeness', () => {
  it('is 1 for an exact match and lower as distance grows', () => {
    expect(closeness('#FF9800', '#FF9800')).toBe(1);
    expect(closeness('#000000', '#FFFFFF')).toBeLessThan(0.2);
  });
});

// Calibration guard: every famous color must be reachable from a short
// continuous mix of primaries (≤3 drops), within MATCH_THRESHOLD.
describe('famous-color reachability', () => {
  const MIXABLE: ColorId[] = ['red', 'yellow', 'blue', 'white', 'black'];

  function reachableMixes(): string[] {
    const out: string[] = [];
    const hex = (id: ColorId) => COLORS[id].hex;
    for (const a of MIXABLE)
      for (const b of MIXABLE) {
        const m2 = addColorToMix(hex(a), hex(b));
        out.push(m2);
        for (const c of MIXABLE) out.push(addColorToMix(m2, hex(c)));
      }
    return out;
  }

  it.each(FAMOUS_IDS)('%s is reachable within threshold', (id) => {
    const target = COLORS[id].hex;
    const best = Math.min(...reachableMixes().map((h) => colorDistance(h, target)));
    expect(best).toBeLessThan(MATCH_THRESHOLD);
  });
});
