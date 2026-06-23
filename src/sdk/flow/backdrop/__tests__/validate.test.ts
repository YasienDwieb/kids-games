import { validateBackdropConfig, MAX_BACKDROP_LAYERS } from '../validate';
import type { BackdropConfig } from '../types';

const layer = () => ({ elements: [], stripWidth: 100, driftDurationMs: 1000, opacity: 0.5 });
const base = (over: Partial<BackdropConfig> = {}): BackdropConfig => ({
  paletteRamp: ['#FBF3E6'],
  layers: [layer()],
  motion: 'animated',
  ...over,
});

describe('validateBackdropConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateBackdropConfig(base())).not.toThrow();
  });

  it('rejects an empty palette ramp', () => {
    expect(() => validateBackdropConfig(base({ paletteRamp: [] }))).toThrow(/palette/i);
  });

  it('rejects more than the max number of layers', () => {
    const layers = Array.from({ length: MAX_BACKDROP_LAYERS + 1 }, layer);
    expect(() => validateBackdropConfig(base({ layers }))).toThrow(/layers/i);
  });

  it('rejects a non-positive strip width', () => {
    expect(() => validateBackdropConfig(base({ layers: [{ ...layer(), stripWidth: 0 }] }))).toThrow(/stripWidth/i);
  });

  it('rejects a non-positive drift duration', () => {
    expect(() => validateBackdropConfig(base({ layers: [{ ...layer(), driftDurationMs: 0 }] }))).toThrow(/drift/i);
  });
});
