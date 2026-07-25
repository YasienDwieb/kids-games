/* ============================================================
   Kids Games — unified design system colors
   One warm cream canvas, warm-brown ink, friendly violet brand.
   Per-game accent colors are the only thing that varies.
   Ported from design/tokens.css.
   ============================================================ */

// Per-game accent families (harmonized: L~0.74 C~0.13, hue varies).
// `base` = the accent, `deep` = pressed/edge shade, `tint` = soft fill.
export const ACCENTS = {
  green: { base: '#6FC27B', deep: '#54A862', tint: '#E4F4E6' },
  orange: { base: '#F4A65A', deep: '#E08D3C', tint: '#FCEED9' },
  coral: { base: '#F47C6E', deep: '#E0604F', tint: '#FCE5E1' },
  purple: { base: '#A48BF2', deep: '#8A6FE6', tint: '#EEE8FD' },
  blue: { base: '#5CB8E4', deep: '#3A9FD1', tint: '#E0F2FB' },
  pink: { base: '#F58FB8', deep: '#E66FA0', tint: '#FCE5EF' },
} as const;

export type AccentName = keyof typeof ACCENTS;

export const COLORS = {
  // --- canvas & surfaces (warm cream) ---
  canvas: '#FBF3E6',
  canvas2: '#F6EAD7',
  surface: '#FFFFFF',
  surface2: '#FFFAF1',

  // --- ink (warm dark brown, never pure black) ---
  // inkSoft carries secondary labels at 12-13px, so it must clear WCAG AA (4.5:1)
  // on both surface and canvas: 5.86:1 on #FFFFFF, 5.32:1 on the cream canvas.
  ink: '#3B3026',
  inkSoft: '#6E6357',
  inkFaint: '#B7AD9F',
  line: 'rgba(59, 48, 38, 0.08)',
  line2: 'rgba(59, 48, 38, 0.14)',

  // --- brand (friendly violet — the hub's own color) ---
  brand: '#8B7CF0',
  brandDeep: '#6E5DE0',
  brandTint: '#ECE8FE',

  gold: '#F6C747',

  // --- accent families (also available structured via ACCENTS) ---
  accent: ACCENTS,

  // ----------------------------------------------------------------
  // Backwards-compatible groups (games import these via @/sdk).
  // Retuned to the warm system; keys preserved so games keep working.
  // ----------------------------------------------------------------
  primary: {
    red: ACCENTS.coral.base,
    blue: ACCENTS.blue.base,
    yellow: '#F6C747',
    green: ACCENTS.green.base,
    purple: ACCENTS.purple.base,
    orange: ACCENTS.orange.base,
    pink: ACCENTS.pink.base,
  },

  background: {
    light: '#FBF3E6', // canvas
    warm: '#F6EAD7', // canvas2
    cool: ACCENTS.blue.tint,
    white: '#FFFFFF',
  },

  text: {
    primary: '#3B3026', // ink
    secondary: '#6E6357', // inkSoft
    light: '#B7AD9F', // inkFaint
    inverse: '#FFFFFF',
  },

  // UI states
  success: ACCENTS.green.base,
  warning: '#F6C747',
  error: ACCENTS.coral.base,
  disabled: '#E7DECF',

  // Overlays / shadows
  overlay: 'rgba(59, 48, 38, 0.34)',
  shadow: 'rgba(74, 52, 28, 0.16)',
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
