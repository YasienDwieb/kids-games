import { ACCENTS, COLORS, bestTextOn, contrastRatio } from '../colors';

/**
 * Guards the text-contrast floor of the design system.
 *
 * The accent families are tuned to L~0.74, where white labels only reach
 * ~2.2-2.8:1. A device audit measured the primary CTA at 2.78:1 and every
 * `inkSoft` label at 3.85:1, both below the WCAG AA 4.5:1 floor for normal
 * text. These tests fail if a token drifts back under it.
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
    expect(bestTextOn('#3B3026')).toBe(COLORS.surface);
  });

  it('returns ink on light fills', () => {
    expect(bestTextOn('#FFFFFF')).toBe(COLORS.ink);
  });

  it('falls back to ink for non-hex fills', () => {
    expect(bestTextOn('rgba(0,0,0,0.2)')).toBe(COLORS.ink);
  });

  it('documents why COLORS.brand is not used as a label-bearing fill', () => {
    // brand sits in the dead zone: neither ink nor white reaches AA on it, which
    // is why PressableButton and Chip default to the purple accent instead.
    expect(contrastRatio(COLORS.ink, COLORS.brand)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(COLORS.surface, COLORS.brand)).toBeLessThan(AA_NORMAL);
  });
});
