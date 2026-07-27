import { computeHomeGrid, isTablet, type HomeGridInput } from '../responsive';

// Typical iPhone landscape (safe-area insets ~ top:0 bottom:21 in landscape).
const iphoneLandscape: HomeGridInput = {
  width: 844, height: 390, count: 11, insetsTop: 0, insetsBottom: 21,
};

describe('isTablet', () => {
  it('phones (short side < 768) are not tablets', () => {
    expect(isTablet(844, 390)).toBe(false); // iPhone landscape
    expect(isTablet(390, 844)).toBe(false); // iPhone portrait
    expect(isTablet(800, 360)).toBe(false); // small android landscape
  });

  it('tablets (short side >= 768) are tablets', () => {
    expect(isTablet(1366, 1024)).toBe(true); // iPad 13" landscape
    expect(isTablet(1024, 1366)).toBe(true); // iPad portrait
    expect(isTablet(1280, 800)).toBe(true);  // android tablet
    expect(isTablet(768, 1024)).toBe(true);  // exactly at threshold
  });
});

describe('computeHomeGrid — phone (locked behavior)', () => {
  it('iPhone landscape lays the rail out in two rows', () => {
    const g = computeHomeGrid(iphoneLandscape);
    // Derived from: h = 390 - 0 - 21 - 28 - 56 = 285
    // rows = max(1,min(3,round(285/140=2.036)=2)) = 2
    // cardH = floor(285/2) - 12 = 130
    // cardW = max(116,min(160,round(130*0.82=106.6)=107)) = 116
    // emoji = max(30,min(54,round(130*0.3=39)=39)) = 39
    expect(g).toEqual({ rows: 2, cols: 6, cardW: 116, cardH: 130, emojiSize: 39, scroll: true });
  });

  it('shows far more of the catalogue than a single row would', () => {
    // The point of two rows: a 390dp-tall phone showed ~3 of 11 games at one
    // row of 160dp cards, with no affordance saying the rest existed.
    const g = computeHomeGrid(iphoneLandscape);
    const visibleCols = Math.floor((844 - 244 - 12 * 2) / (g.cardW + 12));
    expect(g.rows * visibleCols).toBeGreaterThanOrEqual(8);
  });

  it('keeps tiles well above the 44dp touch minimum', () => {
    const g = computeHomeGrid(iphoneLandscape);
    expect(Math.min(g.cardW, g.cardH)).toBeGreaterThan(44 * 2);
  });

  it('taller phone landscape stays within the caps', () => {
    // height 420 → h = 420-0-21-28-56 = 315; round(315/140=2.25)=2 rows
    const g = computeHomeGrid({ ...iphoneLandscape, height: 420 });
    expect(g.rows).toBe(2);
    expect(g.cardW).toBeLessThanOrEqual(160);
    expect(g.emojiSize).toBeLessThanOrEqual(54);
    expect(g.scroll).toBe(true);
  });
});

describe('computeHomeGrid — tablet (fit-all)', () => {
  const ipadLandscape: HomeGridInput = {
    width: 1366, height: 1024, count: 11, insetsTop: 24, insetsBottom: 20,
  };

  it('fits all games without scrolling on iPad landscape', () => {
    const g = computeHomeGrid(ipadLandscape);
    expect(g.scroll).toBe(false);
    expect(g.rows * g.cols).toBeGreaterThanOrEqual(11);
  });

  it('scales cards larger than the phone cap', () => {
    const g = computeHomeGrid(ipadLandscape);
    expect(g.cardW).toBeGreaterThan(160); // bigger than phone max
    expect(g.cardW).toBeLessThanOrEqual(260); // but bounded
    expect(g.emojiSize).toBeGreaterThan(54);
  });

  it('android tablet takes the same path as iPad', () => {
    const g = computeHomeGrid({ width: 1280, height: 800, count: 11, insetsTop: 0, insetsBottom: 0 });
    expect(g.scroll).toBe(false);
    expect(g.cardW).toBeGreaterThan(160);
  });

  it('falls back to scroll when games cannot fit even at min size', () => {
    // Small tablet-class canvas with an absurd count → cannot fit → scroll.
    const g = computeHomeGrid({ width: 768, height: 1024, count: 200, insetsTop: 0, insetsBottom: 0 });
    expect(g.scroll).toBe(true);
  });
});
