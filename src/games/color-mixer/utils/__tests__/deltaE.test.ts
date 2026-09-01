import { deltaE00, deltaE00Hex, labFromHex, type Lab } from '../deltaE';

/**
 * Reference pairs from Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference
 * Formula: Implementation Notes...". These are the standard vectors precisely because
 * they exercise the hue-angle branches that naive implementations get wrong.
 */
const SHARMA: [Lab, Lab, number][] = [
  [[50.0, 2.6772, -79.7751], [50.0, 0.0, -82.7485], 2.0425],
  [[50.0, 3.1571, -77.2803], [50.0, 0.0, -82.7485], 2.8615],
  [[50.0, 2.8361, -74.02], [50.0, 0.0, -82.7485], 3.4412],
  [[50.0, -1.3802, -84.2814], [50.0, 0.0, -82.7485], 1.0],
  [[50.0, -1.1848, -84.8006], [50.0, 0.0, -82.7485], 1.0],
  [[50.0, -0.9009, -85.5211], [50.0, 0.0, -82.7485], 1.0],
  [[50.0, 0.0, 0.0], [50.0, -1.0, 2.0], 2.3669],
  [[50.0, -1.0, 2.0], [50.0, 0.0, 0.0], 2.3669],
  [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0009], 7.1792],
  [[50.0, 2.49, -0.001], [50.0, -2.49, 0.001], 7.1792],
  [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0011], 7.2195],
  [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0012], 7.2195],
  [[50.0, -0.001, 2.49], [50.0, 0.0009, -2.49], 4.8045],
  [[50.0, 2.5, 0.0], [50.0, 0.0, -2.5], 4.3065],
  [[50.0, 2.5, 0.0], [73.0, 25.0, -18.0], 27.1492],
  [[50.0, 2.5, 0.0], [61.0, -5.0, 29.0], 22.8977],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
  [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
  [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
];

describe('deltaE00 — CIEDE2000', () => {
  it.each(SHARMA)('matches the reference value for %j vs %j', (lab1, lab2, expected) => {
    expect(deltaE00(lab1, lab2)).toBeCloseTo(expected, 4);
  });

  it('is zero for identical colors', () => {
    expect(deltaE00Hex('#43a047', '#43a047')).toBe(0);
  });

  it('is symmetric', () => {
    expect(deltaE00Hex('#e53935', '#1e88e5')).toBeCloseTo(deltaE00Hex('#1e88e5', '#e53935'), 10);
  });

  it('handles pure grays, where the hue angle is undefined', () => {
    // atan2(0,0) is the classic crash/garbage site in CIEDE2000 implementations.
    expect(Number.isFinite(deltaE00Hex('#808080', '#828282'))).toBe(true);
    expect(deltaE00Hex('#000000', '#ffffff')).toBeGreaterThan(90);
    expect(deltaE00Hex('#808080', '#828282')).toBeLessThan(2);
  });

  describe('labFromHex', () => {
    it('puts white and black at the ends of the lightness axis', () => {
      const [whiteL] = labFromHex('#ffffff');
      const [blackL] = labFromHex('#000000');
      expect(whiteL).toBeCloseTo(100, 1);
      expect(blackL).toBeCloseTo(0, 1);
    });

    it('reads a mid gray as neutral', () => {
      const [, a, b] = labFromHex('#808080');
      expect(Math.abs(a)).toBeLessThan(0.5);
      expect(Math.abs(b)).toBeLessThan(0.5);
    });
  });

  it('ranks the engine greens the way an eye would', () => {
    // The old sRGB average produced this sage gray and called it green.
    const sageGray = '#8eb08d';
    const realGreen = '#43a047';
    expect(deltaE00Hex(realGreen, sageGray)).toBeGreaterThan(12);
  });
});
