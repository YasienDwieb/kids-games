import { BACKDROP } from '../config';
import { validateBackdropConfig, MAX_BACKDROP_LAYERS } from '../validate';

describe('BACKDROP default config', () => {
  it('is valid', () => {
    expect(() => validateBackdropConfig(BACKDROP)).not.toThrow();
  });

  it('has a morning→golden ramp with at least 3 stops', () => {
    expect(BACKDROP.paletteRamp.length).toBeGreaterThanOrEqual(3);
  });

  it('uses at most the layer cap', () => {
    expect(BACKDROP.layers.length).toBeLessThanOrEqual(MAX_BACKDROP_LAYERS);
    expect(BACKDROP.layers.length).toBeGreaterThan(0);
  });

  it('drifts far layers slower than near layers (back→front order)', () => {
    const durations = BACKDROP.layers.map((l) => l.driftDurationMs);
    const sorted = [...durations].sort((a, b) => b - a);
    expect(durations).toEqual(sorted); // non-increasing: first (far) is slowest
  });

  it('keeps every layer subtle (opacity <= 0.6)', () => {
    expect(BACKDROP.layers.every((l) => l.opacity <= 0.6)).toBe(true);
  });
});
