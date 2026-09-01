import { COLORS, DISCOVERY_DELTA_E, STARS_TO_COMPLETE } from '../../constants';
import { colorDistance, nearestFamous, closeness, starsFor, isChallengeMet, FAMOUS_IDS } from '../match';
import { PIGMENT_IDS, mixHex } from '../wheelMix';
import type { ColorId, PigmentId } from '../../types';

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

describe('starsFor', () => {
  it('gives 3 stars for an exact match', () => {
    expect(starsFor(COLORS.green.hex, COLORS.green.hex)).toBe(3);
  });

  it('gives no stars for a visibly different color', () => {
    expect(starsFor(COLORS.red.hex, COLORS.blue.hex)).toBe(0);
  });

  it('gives nothing for an empty pot', () => {
    expect(starsFor(null, COLORS.green.hex)).toBe(0);
  });

  it('degrades monotonically as the mix drifts from the target', () => {
    const target = COLORS.green.hex;
    const drift = ['#43A047', '#47A44B', '#55AE5A', '#7FC184', '#E53935'];
    const scores = drift.map((hex) => starsFor(hex, target));
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
  });

  it('does not complete a challenge on 1 star — that is feedback, not success', () => {
    const target = COLORS.green.hex;
    const onePoint = drifted(target, 9); // ΔE00 well inside 1 star, outside 2
    expect(starsFor(onePoint, target)).toBe(1);
    expect(isChallengeMet(onePoint, target)).toBe(false);
    expect(STARS_TO_COMPLETE).toBe(2);
  });
});

/** Nudge a hex until it sits at roughly the requested ΔE00 from the original. */
function drifted(hex: string, targetDelta: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let best = hex;
  let bestErr = Infinity;
  for (let step = 0; step <= 120; step++) {
    const candidate =
      '#' +
      [r + step, g - step, b + step]
        .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
        .join('');
    const err = Math.abs(colorDistance(hex, candidate) - targetDelta);
    if (err < bestErr) {
      bestErr = err;
      best = candidate;
    }
  }
  return best;
}

/**
 * Calibration guard: every famous color must be reachable from a short pot of primaries.
 *
 * Enumerates multisets, not sequences. Mixing is order independent, so sequences are
 * redundant — and enumerating them explodes (5^n) badly enough to hang CI.
 */
describe('famous-color reachability', () => {
  const MAX_DROPS = 4;

  function multisets(size: number): PigmentId[][] {
    const out: PigmentId[][] = [];
    const walk = (start: number, pot: PigmentId[]) => {
      if (pot.length === size) {
        out.push([...pot]);
        return;
      }
      for (let i = start; i < PIGMENT_IDS.length; i++) {
        pot.push(PIGMENT_IDS[i]);
        walk(i, pot);
        pot.pop();
      }
    };
    walk(0, []);
    return out;
  }

  const reachable: string[] = [];
  for (let n = 1; n <= MAX_DROPS; n++) {
    for (const pot of multisets(n)) reachable.push(mixHex(pot)!);
  }

  it.each(FAMOUS_IDS)('%s is reachable, and lands on it exactly', (id: ColorId) => {
    const target = COLORS[id].hex;
    const best = Math.min(...reachable.map((hex) => colorDistance(hex, target)));
    // Not merely "within the discovery threshold" — the authored wheel passes through
    // every famous color exactly, so a child who finds the recipe gets the real color.
    expect(best).toBeLessThan(1);
    expect(best).toBeLessThan(DISCOVERY_DELTA_E);
  });

  it('no two famous colors are close enough to satisfy each other', () => {
    // The bug this guards: green and brown used to sit 57.3 apart in RGB under a
    // threshold of 60, so a green mix completed the brown challenge.
    for (const a of FAMOUS_IDS) {
      for (const b of FAMOUS_IDS) {
        if (a === b) continue;
        expect(isChallengeMet(COLORS[a].hex, COLORS[b].hex)).toBe(false);
        expect(colorDistance(COLORS[a].hex, COLORS[b].hex)).toBeGreaterThan(DISCOVERY_DELTA_E);
      }
    }
  });
});
