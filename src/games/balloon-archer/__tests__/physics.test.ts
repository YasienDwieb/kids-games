import { circleHit, clamp, starsFor, stepArrow } from '../utils/physics';
import { buildLevel, TOTAL_LEVELS } from '../utils/levels';

describe('stepArrow', () => {
  it('flies straight when gravity is 0', () => {
    const next = stepArrow({ x: 0, y: 100, vx: 200, vy: 0 }, 0.5, 0);
    expect(next.x).toBe(100);
    expect(next.y).toBe(100); // no vertical drift
    expect(next.vy).toBe(0);
  });
});

describe('circleHit', () => {
  it('detects a point inside the radius and rejects one outside', () => {
    expect(circleHit({ x: 5, y: 0 }, 0, 0, 10)).toBe(true);
    expect(circleHit({ x: 20, y: 0 }, 0, 0, 10)).toBe(false);
  });
});

describe('starsFor', () => {
  it('rewards efficiency', () => {
    expect(starsFor(4, 4)).toBe(3); // no waste
    expect(starsFor(6, 4)).toBe(2); // 2 wasted
    expect(starsFor(10, 4)).toBe(1); // many wasted
  });
});

describe('clamp', () => {
  it('bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('buildLevel ramp', () => {
  it('keeps the quiver above the quota and ramps difficulty up', () => {
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const d = buildLevel(lvl);
      expect(d.arrows).toBeGreaterThan(d.quota);
      expect(d.quota).toBeGreaterThanOrEqual(4);
    }
    expect(buildLevel(8).quota).toBeGreaterThan(buildLevel(1).quota);
    expect(buildLevel(8).riseSpeed).toBeGreaterThan(buildLevel(1).riseSpeed);
    expect(buildLevel(8).spawnEveryMs).toBeLessThan(buildLevel(1).spawnEveryMs);
  });
});
