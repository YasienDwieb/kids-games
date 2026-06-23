import { rampColor } from '../palette';

describe('rampColor', () => {
  const stops = ['#000000', '#ffffff'] as const;

  it('returns the first stop at progress 0', () => {
    expect(rampColor(stops, 0)).toBe('#000000');
  });

  it('returns the last stop at progress 1', () => {
    expect(rampColor(stops, 1)).toBe('#ffffff');
  });

  it('interpolates the midpoint', () => {
    expect(rampColor(stops, 0.5)).toBe('#808080');
  });

  it('clamps out-of-range progress', () => {
    expect(rampColor(stops, -1)).toBe('#000000');
    expect(rampColor(stops, 2)).toBe('#ffffff');
  });

  it('picks the correct segment with 3 stops', () => {
    const three = ['#000000', '#ff0000', '#ffffff'] as const;
    expect(rampColor(three, 0.25)).toBe('#800000'); // halfway into first segment
    expect(rampColor(three, 0.5)).toBe('#ff0000');  // exactly the middle stop
  });

  it('returns the single stop when only one is given', () => {
    expect(rampColor(['#abcdef'], 0.7)).toBe('#abcdef');
  });
});
