// Size-driven responsive helpers. Keyed on screen dimensions only — never
// Platform.OS — so iOS/Android of the same size class behave identically.

/** Standard tablet threshold: the SHORT side is >= 768dp. */
export function isTablet(width: number, height: number): boolean {
  return Math.min(width, height) >= 768;
}
