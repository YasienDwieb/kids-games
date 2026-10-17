import type { Glyph } from '../types';
import { DIGITS } from './digits';
import { WARMUPS } from './warmup';

export const ALL_SETS: Record<string, readonly Glyph[]> = {
  digits: DIGITS,
  warmup: WARMUPS,
};
