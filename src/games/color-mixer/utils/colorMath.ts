export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse a hex color. Throws on malformed input rather than quietly returning black:
 * a bad hex in a persisted record used to become a black swatch that then poisoned every
 * mix it entered, with no test, no log line, and nothing for the child to see but a wrong
 * color. Callers that can encounter untrusted data should catch and drop the record.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Malformed hex color: ${JSON.stringify(hex)}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/** Whether a string is a hex color this game can render. */
export function isValidHex(hex: unknown): hex is string {
  return typeof hex === 'string' && /^#?[a-f\d]{6}$/i.test(hex);
}

export function getColorBrightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function getContrastTextColor(hex: string): 'black' | 'white' {
  return getColorBrightness(hex) > 128 ? 'black' : 'white';
}

export function areColorsSimilar(hex1: string, hex2: string, threshold: number = 30): boolean {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
  );
  return distance < threshold;
}
