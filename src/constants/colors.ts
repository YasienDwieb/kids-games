export const COLORS = {
  // Primary palette — soft, cheerful shades
  primary: {
    red: '#FF6B6B',
    blue: '#4ECDC4',
    yellow: '#FFE66D',
    green: '#7BC67E',
    purple: '#A78BFA',
    orange: '#FFA46B',
    pink: '#FF9FF3',
  },

  // Backgrounds
  background: {
    light: '#FFF9F0',
    warm: '#FFF3E0',
    cool: '#E8F8F5',
    white: '#FFFFFF',
  },

  // Text
  text: {
    primary: '#2D3436',
    secondary: '#636E72',
    light: '#B2BEC3',
    inverse: '#FFFFFF',
  },

  // UI states
  success: '#7BC67E',
  warning: '#FFE66D',
  error: '#FF6B6B',
  disabled: '#DFE6E9',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;
