import type { ImageSourcePropType } from 'react-native';

export type BackdropElement = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** x-offset within the strip, from the strip's start edge. */
  left: number;
  /** distance from the layer's bottom. */
  bottom: number;
};

export type BackdropLayer = {
  elements: BackdropElement[];
  /** width of one composed copy; two copies tile to loop seamlessly. */
  stripWidth: number;
  /** ms for one strip to drift its full width (larger = slower / farther). */
  driftDurationMs: number;
  opacity: number;
};

export type BackdropConfig = {
  /** ordered hex stops; index 0 = journey start, last = journey end. */
  paletteRamp: readonly string[];
  /** back → front. */
  layers: BackdropLayer[];
  motion: 'animated' | 'static';
};
