// Animal Safari — domain constants (pure data, no React/UI).
//
// One inventory of 12 animals authored as `Animal` data. `emoji` is rendered
// literally; `nameKey` is an i18n KEY SUFFIX (resolved as
// `animal-safari:names.<nameKey>`) so the animal name localizes per language.
//
// 11 animals have a real CC0/PD audio clip (`hasSound: true`); cow has NO clip
// (`hasSound: false`) — it may appear in `hearName` rounds but NEVER in a
// `whichSound` round.

import type { Animal, RoundMode } from './types';

// ---------------------------------------------------------------------------
// Animal inventory — 12 animals. id === nameKey. hasSound true for all but cow.
// ---------------------------------------------------------------------------

export const ANIMALS: readonly Animal[] = [
  { id: 'lion', emoji: '🦁', nameKey: 'lion', hasSound: true },
  { id: 'elephant', emoji: '🐘', nameKey: 'elephant', hasSound: true },
  { id: 'cow', emoji: '🐄', nameKey: 'cow', hasSound: false },
  { id: 'dog', emoji: '🐶', nameKey: 'dog', hasSound: true },
  { id: 'cat', emoji: '🐱', nameKey: 'cat', hasSound: true },
  { id: 'frog', emoji: '🐸', nameKey: 'frog', hasSound: true },
  { id: 'horse', emoji: '🐎', nameKey: 'horse', hasSound: true },
  { id: 'sheep', emoji: '🐑', nameKey: 'sheep', hasSound: true },
  { id: 'rooster', emoji: '🐔', nameKey: 'rooster', hasSound: true },
  { id: 'duck', emoji: '🦆', nameKey: 'duck', hasSound: true },
  { id: 'bird', emoji: '🐦', nameKey: 'bird', hasSound: true },
  { id: 'bee', emoji: '🐝', nameKey: 'bee', hasSound: true },
];

// ---------------------------------------------------------------------------
// Round configuration
// ---------------------------------------------------------------------------

/** Number of animal choices shown in a round. */
export const CHOICES_PER_ROUND = 3;

/**
 * Round mode by 1-based level (mirrors letter-land's odd/even alternation):
 * odd levels → 'hearName', even levels → 'whichSound'.
 */
export function modeForLevel(level: number): RoundMode {
  return level % 2 === 1 ? 'hearName' : 'whichSound';
}
