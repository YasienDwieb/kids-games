export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
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
