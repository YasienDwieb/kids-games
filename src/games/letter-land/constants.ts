// Letter Land — domain constants (pure data, no React/UI).
//
// Two letter inventories (Latin + Arabic) authored as `Letter` data. `glyph`
// is rendered literally; `word` is an i18n KEY SUFFIX (resolved as
// `letter-land:words.<word>`) so the example word localizes per language.

import type { Letter, RoundMode } from './types';

// ---------------------------------------------------------------------------
// Latin inventory — A–Z uppercase (26). id === glyph; `word` is a kid-friendly
// example-word key suffix.
// ---------------------------------------------------------------------------

export const LATIN_LETTERS: readonly Letter[] = [
  { id: 'A', glyph: 'A', word: 'apple' },
  { id: 'B', glyph: 'B', word: 'ball' },
  { id: 'C', glyph: 'C', word: 'cat' },
  { id: 'D', glyph: 'D', word: 'dog' },
  { id: 'E', glyph: 'E', word: 'egg' },
  { id: 'F', glyph: 'F', word: 'fish' },
  { id: 'G', glyph: 'G', word: 'goat' },
  { id: 'H', glyph: 'H', word: 'hat' },
  { id: 'I', glyph: 'I', word: 'igloo' },
  { id: 'J', glyph: 'J', word: 'jam' },
  { id: 'K', glyph: 'K', word: 'kite' },
  { id: 'L', glyph: 'L', word: 'lion' },
  { id: 'M', glyph: 'M', word: 'moon' },
  { id: 'N', glyph: 'N', word: 'nest' },
  { id: 'O', glyph: 'O', word: 'orange' },
  { id: 'P', glyph: 'P', word: 'pig' },
  { id: 'Q', glyph: 'Q', word: 'queen' },
  { id: 'R', glyph: 'R', word: 'rabbit' },
  { id: 'S', glyph: 'S', word: 'sun' },
  { id: 'T', glyph: 'T', word: 'tree' },
  { id: 'U', glyph: 'U', word: 'umbrella' },
  { id: 'V', glyph: 'V', word: 'van' },
  { id: 'W', glyph: 'W', word: 'whale' },
  { id: 'X', glyph: 'X', word: 'xylophone' },
  { id: 'Y', glyph: 'Y', word: 'yoyo' },
  { id: 'Z', glyph: 'Z', word: 'zebra' },
];

// ---------------------------------------------------------------------------
// Arabic inventory — 28 isolated forms in alphabetical order. `id` is a stable
// latin-ish transliteration (also the choice key); `glyph` is the isolated
// form; `word` is a kid-friendly Arabic example-word key suffix.
// ---------------------------------------------------------------------------

export const ARABIC_LETTERS: readonly Letter[] = [
  { id: 'alef', glyph: 'ا', word: 'asad' }, // أسد (lion)
  { id: 'baa', glyph: 'ب', word: 'batta' }, // بطة (duck)
  { id: 'taa', glyph: 'ت', word: 'tuffaha' }, // تفاحة (apple)
  { id: 'thaa', glyph: 'ث', word: 'thalab' }, // ثعلب (fox)
  { id: 'jeem', glyph: 'ج', word: 'jamal' }, // جمل (camel)
  { id: 'haa', glyph: 'ح', word: 'hisan' }, // حصان (horse)
  { id: 'khaa', glyph: 'خ', word: 'kharoof' }, // خروف (sheep)
  { id: 'dal', glyph: 'د', word: 'dub' }, // دب (bear)
  { id: 'thal', glyph: 'ذ', word: 'thubab' }, // ذباب (fly)
  { id: 'raa', glyph: 'ر', word: 'rummana' }, // رمانة (pomegranate)
  { id: 'zay', glyph: 'ز', word: 'zarafa' }, // زرافة (giraffe)
  { id: 'seen', glyph: 'س', word: 'samaka' }, // سمكة (fish)
  { id: 'sheen', glyph: 'ش', word: 'shams' }, // شمس (sun)
  { id: 'sad', glyph: 'ص', word: 'saqr' }, // صقر (falcon)
  { id: 'dad', glyph: 'ض', word: 'difdaa' }, // ضفدع (frog)
  { id: 'taa_heavy', glyph: 'ط', word: 'tayra' }, // طائرة (plane)
  { id: 'thaa_heavy', glyph: 'ظ', word: 'zarf' }, // ظرف (envelope)
  { id: 'ayn', glyph: 'ع', word: 'asfoor' }, // عصفور (bird)
  { id: 'ghayn', glyph: 'غ', word: 'ghazala' }, // غزالة (gazelle)
  { id: 'faa', glyph: 'ف', word: 'feel' }, // فيل (elephant)
  { id: 'qaf', glyph: 'ق', word: 'qittah' }, // قطة (cat)
  { id: 'kaf', glyph: 'ك', word: 'kura' }, // كرة (ball)
  { id: 'lam', glyph: 'ل', word: 'laymoon' }, // ليمون (lemon)
  { id: 'meem', glyph: 'م', word: 'mawza' }, // موزة (banana)
  { id: 'noon', glyph: 'ن', word: 'najma' }, // نجمة (star)
  { id: 'haa_soft', glyph: 'ه', word: 'hudhud' }, // هدهد (hoopoe)
  { id: 'waw', glyph: 'و', word: 'warda' }, // وردة (rose)
  { id: 'yaa', glyph: 'ي', word: 'yad' }, // يد (hand)
];

// ---------------------------------------------------------------------------
// Round configuration
// ---------------------------------------------------------------------------

/** Number of letter choices shown in a `hearAndFind` round. */
export const CHOICES_PER_ROUND = 3;

/**
 * Round mode by 1-based level. Every level is `hearAndFind` — kept as a
 * function so existing callers/tests resolve without churn.
 */
export function modeForLevel(_level: number): RoundMode {
  return 'hearAndFind';
}
