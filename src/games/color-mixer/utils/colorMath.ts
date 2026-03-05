export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function mixTwoColors(hex1: string, hex2: string, ratio: number = 0.5): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const mixed = {
    r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
    g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
    b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio),
  };

  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

export function addColorToMix(
  currentHex: string,
  newColorHex: string,
  newColorInfluence: number = 0.5
): string {
  return mixTwoColors(currentHex, newColorHex, newColorInfluence);
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
