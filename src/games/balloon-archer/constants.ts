import { ACCENTS, COLORS } from '@/sdk';

// Flat, fixed-speed arrow — no gravity, no power, no angle. Difficulty lives in
// the balloons (height / speed / variety), not in the input.
export const PHYSICS = {
  arrowSpeed: 1400, // px/s, straight across
  arrowLength: 56,
} as const;

// Archer's fixed horizontal position (only its lane height varies).
export const ARCHER_X = { ratio: 0.1, min: 64, max: 120 } as const;

export const GROUND_H = 64;
export const LANE_TOP = 70; // highest the aim can go (under the HUD)
export const POP_MS = 260; // balloon burst duration

// Balloon palette — accent bases so colors stay on the design system.
export const BALLOON_COLORS = [
  ACCENTS.coral.base,
  ACCENTS.blue.base,
  ACCENTS.green.base,
  ACCENTS.orange.base,
  ACCENTS.purple.base,
  ACCENTS.pink.base,
];

export const GROUND_COLOR = ACCENTS.green.base;
export const ARROW_COLOR = COLORS.ink;
export const STRING_COLOR = 'rgba(59,48,38,0.30)';
export const GUIDE_COLOR = 'rgba(59,48,38,0.28)';
