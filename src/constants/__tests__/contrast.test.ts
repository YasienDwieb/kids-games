import { ACCENTS, COLORS, bestTextOn, contrastRatio } from '../colors';

/**
 * Guards the text-contrast floor of the design system.
 *
 * The pop accents are bright, so white labels on them only reach ~1.7-3:1;
 * labels must be ink. A device audit once measured the primary CTA at 2.78:1
 * and every `inkSoft` label at 3.85:1, both below the WCAG AA 4.5:1 floor for
 * normal text. These tests fail if a token drifts back under it.
 */

const AA_NORMAL = 4.5;

describe('accent fills carry a legible label', () => {
  const accentNames = Object.keys(ACCENTS) as (keyof typeof ACCENTS)[];

  it.each(accentNames)('%s.base clears AA with its chosen label colour', (name) => {
    const fill = ACCENTS[name].base;
    expect(contrastRatio(bestTextOn(fill), fill)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('picks ink (not white) on every light accent', () => {
    for (const name of accentNames) {
      expect(bestTextOn(ACCENTS[name].base)).toBe(COLORS.ink);
    }
  });
});

describe('secondary text tokens', () => {
  it('inkSoft clears AA on both surface and canvas', () => {
    expect(contrastRatio(COLORS.inkSoft, COLORS.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(COLORS.inkSoft, COLORS.canvas)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('ink clears AA on surface and canvas', () => {
    expect(contrastRatio(COLORS.ink, COLORS.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(COLORS.ink, COLORS.canvas)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe('bestTextOn', () => {
  it('returns white on dark fills', () => {
    expect(bestTextOn('#1B1B2F')).toBe(COLORS.surface);
  });

  it('returns ink on light fills', () => {
    expect(bestTextOn('#FFFFFF')).toBe(COLORS.ink);
  });

  it('falls back to ink for non-hex fills', () => {
    expect(bestTextOn('rgba(0,0,0,0.2)')).toBe(COLORS.ink);
  });

  it('brand (grape) carries a white label', () => {
    // The grape brand is dark enough for white text, which the level badge,
    // the active chip and the "Level up" header rely on.
    expect(bestTextOn(COLORS.brand)).toBe(COLORS.surface);
    expect(contrastRatio(COLORS.surface, COLORS.brand)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
