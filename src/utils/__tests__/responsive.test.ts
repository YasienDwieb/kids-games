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
  it('iPhone landscape produces the historical rail values', () => {
    const g = computeHomeGrid(iphoneLandscape);
    // Derived from: h = 390 - 0 - 21 - 28 - 56 = 285
    // rows = max(1,min(3,round(285/200=1.425)=1)) = 1
    // cardH = floor(285/1) - 12 = 273
    // cardW = max(116,min(160,round(273*0.82=223.86)=224)) = 160
    // emoji = max(30,min(54,round(273*0.3=81.9)=82)) = 54
    expect(g).toEqual({ rows: 1, cols: 11, cardW: 160, cardH: 273, emojiSize: 54, scroll: true });
  });

  it('taller phone landscape yields more rows but same caps', () => {
    // height 420 → h = 420-0-21-28-56 = 315; round(315/200=1.575)=2 rows
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
