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
  ink: '#3B3026',
  inkSoft: '#8C8073',
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
    secondary: '#8C8073', // inkSoft
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
