export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  // legacy keys (kept for existing games)
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
  // Pop Quest radii
  tile: 28,
  card: 22,
  btn: 26,
  soft: 14,
  pill: 9999,
} as const;

// Minimum 48 for accessibility, 64+ recommended for young children
export const TOUCH_TARGET = {
  min: 48,
  recommended: 64,
  large: 80,
} as const;

export const FONT_SIZES = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 56,
  title: 48,
} as const;

// Ink outline widths — every Pop Quest surface wears one.
export const OUTLINE = {
  thin: 2,
  base: 3,
  thick: 4,
  color: '#1B1B2F',
} as const;

// Hard, offset comic shadows in ink (no blur). `boxShadow` renders the same on
// iOS and Android under the New Architecture, unlike shadow*/elevation.
export const SHADOWS = {
  sm: { boxShadow: '2px 2px 0px #1B1B2F' },
  md: { boxShadow: '4px 4px 0px #1B1B2F' },
  lg: { boxShadow: '6px 6px 0px #1B1B2F' },
} as const;
