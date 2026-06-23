import type { BackdropConfig } from './types';

const cloud = require('@/sdk/assets/backdrop/png/cloud-cream.png');
const hill = require('@/sdk/assets/backdrop/png/hill-cream.png');

// Morning → midday → golden-hour creams (all warm, all subtle).
const RAMP = ['#F4F0E8', '#FBF3E6', '#F8E9CF'] as const;

export const BACKDROP: BackdropConfig = {
  paletteRamp: RAMP,
  motion: 'animated',
  layers: [
    // Far: slow drifting clouds, faint.
    {
      stripWidth: 900,
      driftDurationMs: 90000,
      opacity: 0.35,
      elements: [
        { source: cloud, width: 180, height: 110, left: 80, bottom: 360 },
        { source: cloud, width: 130, height: 80, left: 520, bottom: 300 },
      ],
    },
    // Near: hills along the bottom, slightly faster, still soft.
    {
      stripWidth: 760,
      driftDurationMs: 60000,
      opacity: 0.5,
      elements: [
        { source: hill, width: 420, height: 200, left: 0, bottom: 0 },
        { source: hill, width: 360, height: 170, left: 420, bottom: 0 },
      ],
    },
  ],
};
