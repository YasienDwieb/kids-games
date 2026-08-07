import { approach, clamp, clampDt, lerp, wrap } from '../frame';

describe('clampDt', () => {
  it('converts milliseconds to seconds', () => {
    expect(clampDt(16, 1 / 30)).toBeCloseTo(0.016, 5);
  });

  // The first frame after a loop starts has no previous frame to measure from.
  it('returns 0 when there is no previous frame', () => {
    expect(clampDt(null, 1 / 30)).toBe(0);
  });

  // Regression: candy-catch had no clamp, so one long frame (GC, audio decode,
  // app backgrounded) integrated a huge dt and teleported every falling item.
  it('caps a long frame so objects cannot teleport', () => {
    expect(clampDt(2000, 1 / 30)).toBeCloseTo(1 / 30, 5);
  });

  it('never returns a negative dt if the clock goes backwards', () => {
    expect(clampDt(-5, 1 / 30)).toBe(0);
  });
});

describe('clamp', () => {
  it('bounds a value between min and max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('interpolates between two values', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('approach', () => {
  it('moves toward the target without overshooting', () => {
    const next = approach(0, 100, 10, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(100);
  });

  it('converges to the target over time', () => {
    let v = 0;
    for (let i = 0; i < 240; i++) v = approach(v, 100, 10, 1 / 60);
    expect(v).toBeCloseTo(100, 1);
  });

  // The whole point of exponential smoothing over `v += (t - v) * k`: the result
  // after a given amount of *time* must not depend on the frame rate, otherwise
  // the same follow motion feels different on a 60Hz and a 120Hz device.
  it('is frame-rate independent', () => {
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = approach(at60, 100, 8, 1 / 60);

    let at120 = 0;
    for (let i = 0; i < 120; i++) at120 = approach(at120, 100, 8, 1 / 120);

    expect(at60).toBeCloseTo(at120, 3);
  });

  it('stays put when dt is 0', () => {
    expect(approach(20, 100, 10, 0)).toBe(20);
  });
});

describe('wrap', () => {
  it('wraps a value into the [0, span) range', () => {
    expect(wrap(5, 10)).toBe(5);
    expect(wrap(12, 10)).toBe(2);
    expect(wrap(-1, 10)).toBe(9);
  });
});
