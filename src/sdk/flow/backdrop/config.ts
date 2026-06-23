import type { BackdropConfig } from './types';

const cloud = require('@/sdk/assets/backdrop/png/cloud-white.png');
const hillFar = require('@/sdk/assets/backdrop/png/hill-far.png');
const hillNear = require('@/sdk/assets/backdrop/png/hill-near.png');

// Soft mint sky → golden-hour: gentle, all kept low-contrast behind gameplay.
const RAMP = ['#EAF6EC', '#E4F4E6', '#FBEFD6'] as const;

// Hill PNGs are full-width ridge strips (~7.8:1). Each hill element spans its
// whole stripWidth at that aspect so the two-copy loop tiles with no side gap
// or seam-cut; clouds are sparse so their box aspect/letterbox is invisible.
export const BACKDROP: BackdropConfig = {
  paletteRamp: RAMP,
  motion: 'animated',
  layers: [
    // Back: slow drifting white clouds, anchored low enough to clear the top edge.
    {
      stripWidth: 900,
      driftDurationMs: 90000,
      opacity: 0.5,
      elements: [
        { source: cloud, width: 150, height: 100, left: 90, bottom: 210 },
        { source: cloud, width: 110, height: 74, left: 560, bottom: 250 },
      ],
    },
    // Mid: far hills, lighter green, peeking above the near ridge.
    {
      stripWidth: 1000,
      driftDurationMs: 66000,
      opacity: 0.5,
      elements: [{ source: hillFar, width: 1000, height: 128, left: 0, bottom: 30 }],
    },
    // Front: near hills, deeper green, along the bottom and slightly faster.
    {
      stripWidth: 1200,
      driftDurationMs: 46000,
      opacity: 0.6,
      elements: [{ source: hillNear, width: 1200, height: 154, left: 0, bottom: 0 }],
    },
  ],
};
