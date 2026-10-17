import type { Glyph } from '../types';
import { DIGITS } from './digits';
import { LATIN_LOWER, LATIN_UPPER } from './latin';
import { WARMUPS } from './warmup';

export const ALL_SETS: Record<string, readonly Glyph[]> = {
  digits: DIGITS,
  warmup: WARMUPS,
  latin: [...LATIN_UPPER, ...LATIN_LOWER],
};
