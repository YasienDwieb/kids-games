import type { Vec2 } from '../types';

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Integrate one step. With gravity 0 the arrow flies perfectly straight. */
export function stepArrow(
  a: { x: number; y: number; vx: number; vy: number },
  dtSec: number,
  gravity: number,
) {
  const vy = a.vy + gravity * dtSec;
  return { x: a.x + a.vx * dtSec, y: a.y + vy * dtSec, vx: a.vx, vy };
}

export function circleHit(p: Vec2, cx: number, cy: number, r: number): boolean {
  return Math.hypot(p.x - cx, p.y - cy) <= r;
}

/** Star rating from how many arrows were spent vs. the quota (fewer wasted = better). */
export function starsFor(arrowsUsed: number, quota: number): number {
  const wasted = Math.max(0, arrowsUsed - quota);
  if (wasted <= 1) return 3;
  if (wasted <= 3) return 2;
  return 1;
}
