/* ============================================================
   Kids Games — "Pop Quest" design system colors
   Comic-pop: loud flat colour, one dark ink for every outline,
   hard offset shadow and label. Per-game accents are the only
   thing that varies; each game owns one full-bleed colour.
   ============================================================ */

// Per-game accent families. `base` = the full-bleed colour, `deep` = pressed /
// edge shade, `tint` = soft fill for cells and backgrounds behind play.
export const ACCENTS = {
  green: { base: '#7DDB3C', deep: '#5CB81E', tint: '#E8F8DA' }, // lime
  orange: { base: '#FFA51F', deep: '#E58600', tint: '#FFEFCF' }, // tangerine
  coral: { base: '#FF6B5E', deep: '#E84B3D', tint: '#FFE3DF' }, // tomato
  purple: { base: '#9B7BFF', deep: '#7B4DFF', tint: '#EEE7FF' }, // grape
  blue: { base: '#2EC4F1', deep: '#0FA5D4', tint: '#DDF5FD' }, // splash
  pink: { base: '#FF6FB4', deep: '#FF4FA3', tint: '#FFE3F1' }, // bubblegum
} as const;

export type AccentName = keyof typeof ACCENTS;

// Named pop colours for chrome (Home, celebrations, quests).
export const POP = {
  zap: '#FFE135', // sunny yellow — Home, level-up headers, combo badges
  zapDeep: '#F5C400',
  grape: '#7B4DFF', // brand
  bubblegum: '#FF4FA3',
  splash: '#2EC4F1',
  lime: '#7DDB3C',
  night: '#2A2160', // recharge break
  nightSoft: '#D9D3FF',
} as const;

export const COLORS = {
  // --- canvas & surfaces ---
  canvas: '#FFF7E0', // soft zap cream behind play
  canvas2: '#FFEFC2',
  surface: '#FFFFFF',
  surface2: '#FFFBEF',

  // --- ink (one dark navy for every outline, shadow and label) ---
  // inkSoft carries secondary labels at 12-13px, so it must clear WCAG AA (4.5:1)
  // on both surface and canvas.
  ink: '#1B1B2F',
  inkSoft: '#55516B',
  inkFaint: '#A9A5BC',
  line: 'rgba(27, 27, 47, 0.10)',
  line2: 'rgba(27, 27, 47, 0.18)',

  // --- brand (grape) ---
  brand: '#7B4DFF',
  brandDeep: '#5A2FE0',
  brandTint: '#EEE7FF',

  gold: '#FFC61A',

  // --- accent families (also available structured via ACCENTS) ---
  accent: ACCENTS,

  // ----------------------------------------------------------------
  // Backwards-compatible groups (games import these via @/sdk).
  // Retuned to the pop system; keys preserved so games keep working.
  // ----------------------------------------------------------------
  primary: {
    red: ACCENTS.coral.base,
    blue: ACCENTS.blue.base,
    yellow: POP.zap,
    green: ACCENTS.green.base,
    purple: ACCENTS.purple.base,
    orange: ACCENTS.orange.base,
    pink: ACCENTS.pink.base,
  },

  background: {
    light: '#FFF7E0', // canvas
    warm: '#FFEFC2', // canvas2
    cool: ACCENTS.blue.tint,
    white: '#FFFFFF',
  },

  text: {
    primary: '#1B1B2F', // ink
    secondary: '#55516B', // inkSoft
    light: '#A9A5BC', // inkFaint
    inverse: '#FFFFFF',
  },

  // UI states
  success: ACCENTS.green.base,
  warning: POP.zap,
  error: ACCENTS.coral.base,
  disabled: '#E6E2F0',

  // Overlays / shadows
  overlay: 'rgba(27, 27, 47, 0.45)',
  shadow: 'rgba(27, 27, 47, 0.2)',
} as const;

/* ------------------------------------------------------------------
   Contrast helpers

   Games pass arbitrary fills to buttons (`color` / `accent`), so the
   label colour cannot be hardcoded: white on our L~0.74 accents only
   reaches ~2.2-2.8:1. Pick whichever of ink/white actually wins on the
   given fill instead, which keeps every CTA at or above WCAG AA.
   ------------------------------------------------------------------ */

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const chan = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Best-contrast label colour for a given background. Non-hex fills
// (rgba/named) fall back to ink, which is correct for our light surfaces.
export function bestTextOn(background: string): string {
  if (!background?.startsWith('#')) return COLORS.ink;
  return contrastRatio(COLORS.ink, background) >= contrastRatio(COLORS.surface, background)
    ? COLORS.ink
    : COLORS.surface;
}
