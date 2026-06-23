import type { BackdropConfig } from './types';

export const MAX_BACKDROP_LAYERS = 3;

export function validateBackdropConfig(config: BackdropConfig): void {
  if (config.paletteRamp.length === 0) {
    throw new Error('backdrop: paletteRamp must have at least one stop');
  }
  if (config.layers.length > MAX_BACKDROP_LAYERS) {
    throw new Error(`backdrop: at most ${MAX_BACKDROP_LAYERS} layers allowed`);
  }
  for (const layer of config.layers) {
    if (layer.stripWidth <= 0) throw new Error('backdrop: layer stripWidth must be > 0');
    if (layer.driftDurationMs <= 0) throw new Error('backdrop: layer driftDurationMs must be > 0');
  }
}
