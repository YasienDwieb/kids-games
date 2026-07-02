// Letter Land — domain constants (pure data, no React/UI).
//
// Two letter inventories (Latin + Arabic) authored as `Letter` data. `glyph`
// is rendered literally; `word` is an i18n KEY SUFFIX (resolved as
// `letter-land:words.<word>`) and `emoji` is that word's picture. Every word
// has bundled emoji art — words without a clean glyph were swapped for a
// same-initial word that does (e.g. P pig→panda, igloo→ice cream).

import type { Letter } from './types';

// ---------------------------------------------------------------------------
// Latin inventory — A–Z uppercase (26). id === glyph.
// ---------------------------------------------------------------------------

export const LATIN_LETTERS: readonly Letter[] = [
  { id: 'A', glyph: 'A', word: 'apple', emoji: '🍎' },
  { id: 'B', glyph: 'B', word: 'ball', emoji: '⚽' },
  { id: 'C', glyph: 'C', word: 'cat', emoji: '🐱' },
  { id: 'D', glyph: 'D', word: 'dog', emoji: '🐶' },
  { id: 'E', glyph: 'E', word: 'egg', emoji: '🥚' },
  { id: 'F', glyph: 'F', word: 'fish', emoji: '🐟' },
  { id: 'G', glyph: 'G', word: 'goat', emoji: '🐐' },
  { id: 'H', glyph: 'H', word: 'hat', emoji: '🎩' },
  { id: 'I', glyph: 'I', word: 'icecream', emoji: '🍦' }, // igloo → ice cream (has art)
  { id: 'J', glyph: 'J', word: 'juice', emoji: '🧃' }, // jam → juice (has art)
  { id: 'K', glyph: 'K', word: 'kite', emoji: '🪁' },
  { id: 'L', glyph: 'L', word: 'lion', emoji: '🦁' },
  { id: 'M', glyph: 'M', word: 'moon', emoji: '🌙' },
  { id: 'N', glyph: 'N', word: 'nose', emoji: '👃' }, // nest → nose (has art)
  { id: 'O', glyph: 'O', word: 'orange', emoji: '🍊' },
  { id: 'P', glyph: 'P', word: 'panda', emoji: '🐼' }, // pig → panda (content rule)
  { id: 'Q', glyph: 'Q', word: 'queen', emoji: '👑' },
  { id: 'R', glyph: 'R', word: 'rabbit', emoji: '🐰' },
  { id: 'S', glyph: 'S', word: 'sun', emoji: '☀️' },
  { id: 'T', glyph: 'T', word: 'tree', emoji: '🌳' },
  { id: 'U', glyph: 'U', word: 'umbrella', emoji: '🌂' },
  { id: 'V', glyph: 'V', word: 'van', emoji: '🚐' },
  { id: 'W', glyph: 'W', word: 'whale', emoji: '🐋' },
  { id: 'X', glyph: 'X', word: 'xylophone', emoji: '🎹' },
  { id: 'Y', glyph: 'Y', word: 'yarn', emoji: '🧶' }, // yo-yo → yarn (has art)
  { id: 'Z', glyph: 'Z', word: 'zebra', emoji: '🦓' },
];

// ---------------------------------------------------------------------------
// Arabic inventory — 28 isolated forms in alphabetical order. `id` is a stable
// latin-ish transliteration (also the choice key); `glyph` is the isolated
// form; `word` is a kid-friendly Arabic example-word key suffix.
// ---------------------------------------------------------------------------

export const ARABIC_LETTERS: readonly Letter[] = [
  { id: 'alef', glyph: 'ا', word: 'asad', emoji: '🦁' }, // أسد (lion)
  { id: 'baa', glyph: 'ب', word: 'batta', emoji: '🦆' }, // بطة (duck)
  { id: 'taa', glyph: 'ت', word: 'tuffaha', emoji: '🍎' }, // تفاحة (apple)
  { id: 'thaa', glyph: 'ث', word: 'thalab', emoji: '🦊' }, // ثعلب (fox)
  { id: 'jeem', glyph: 'ج', word: 'jamal', emoji: '🐪' }, // جمل (camel)
  { id: 'haa', glyph: 'ح', word: 'hisan', emoji: '🐴' }, // حصان (horse)
  { id: 'khaa', glyph: 'خ', word: 'kharoof', emoji: '🐑' }, // خروف (sheep)
  { id: 'dal', glyph: 'د', word: 'dub', emoji: '🐻' }, // دب (bear)
  { id: 'thal', glyph: 'ذ', word: 'thubab', emoji: '🪰' }, // ذباب (fly)
  { id: 'raa', glyph: 'ر', word: 'reesha', emoji: '🪶' }, // ريشة (feather) — was رمانة (no art)
  { id: 'zay', glyph: 'ز', word: 'zarafa', emoji: '🦒' }, // زرافة (giraffe)
  { id: 'seen', glyph: 'س', word: 'samaka', emoji: '🐟' }, // سمكة (fish)
  { id: 'sheen', glyph: 'ش', word: 'shams', emoji: '☀️' }, // شمس (sun)
  { id: 'sad', glyph: 'ص', word: 'sarookh', emoji: '🚀' }, // صاروخ (rocket) — was صقر (no art)
  { id: 'dad', glyph: 'ض', word: 'difdaa', emoji: '🐸' }, // ضفدع (frog)
  { id: 'taa_heavy', glyph: 'ط', word: 'tayra', emoji: '✈️' }, // طائرة (plane)
  { id: 'thaa_heavy', glyph: 'ظ', word: 'zarf', emoji: '✉️' }, // ظرف (envelope)
  { id: 'ayn', glyph: 'ع', word: 'asfoor', emoji: '🐦' }, // عصفور (bird)
  { id: 'ghayn', glyph: 'غ', word: 'ghazala', emoji: '🦌' }, // غزالة (gazelle)
  { id: 'faa', glyph: 'ف', word: 'feel', emoji: '🐘' }, // فيل (elephant)
  { id: 'qaf', glyph: 'ق', word: 'qittah', emoji: '🐱' }, // قطة (cat)
  { id: 'kaf', glyph: 'ك', word: 'kura', emoji: '⚽' }, // كرة (ball)
  { id: 'lam', glyph: 'ل', word: 'laymoon', emoji: '🍋' }, // ليمون (lemon)
  { id: 'meem', glyph: 'م', word: 'mawza', emoji: '🍌' }, // موزة (banana)
  { id: 'noon', glyph: 'ن', word: 'najma', emoji: '⭐' }, // نجمة (star)
  { id: 'haa_soft', glyph: 'ه', word: 'hatif', emoji: '📱' }, // هاتف (phone) — was هدهد (no art)
  { id: 'waw', glyph: 'و', word: 'warda', emoji: '🌹' }, // وردة (rose)
  { id: 'yaa', glyph: 'ي', word: 'yad', emoji: '✋' }, // يد (hand)
];

// ---------------------------------------------------------------------------
// Round configuration
// ---------------------------------------------------------------------------

/** Number of letter choices shown in a round. */
export const CHOICES_PER_ROUND = 3;
