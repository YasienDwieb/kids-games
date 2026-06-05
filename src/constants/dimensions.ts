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
  // design-system radii (design/tokens.css)
  tile: 30,
  card: 22,
  btn: 20,
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

// Soft warm shadows (RN style fragments) — ported from --sh-* in tokens.css.
export const SHADOWS = {
  sm: {
    shadowColor: '#4A341C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#4A341C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4A341C',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
} as const;
