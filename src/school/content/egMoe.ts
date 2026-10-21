/**
 * Egyptian MOE kindergarten curriculum, Term 1 (books 2026–2027 from
 * https://ellibrary.moe.gov.eg/Books/Books-Kindergarten/).
 *
 * Units, lesson order and letters follow each book's contents page; `bookRef`
 * is the page to check. Picture words are ours (chosen so a picture shows the
 * word) and are reviewed by the content team against the book. Arabic and
 * English lessons are written in their own language; Math follows the app
 * language. Term 2 is added when the Ministry publishes it.
 */
import type { LanguageCode } from '@/sdk';
import {
  arabicLetter,
  colour,
  colourSet,
  days,
  englishLetter,
  number,
  review,
  shape,
  shapeSet,
  trFor,
  vocab,
  type ArLetterSpec,
  type EnLetterSpec,
} from '../build';
import type { Lesson, Level, Subject, Term, Unit } from '../types';

type UnitBase = Omit<Unit, 'lessons' | 'curriculum' | 'term'> & { term?: Term };

function unit(base: UnitBase, lessons: Lesson[], withReview = true): Unit {
  const all = withReview && lessons.length > 1 ? [...lessons, review(lessons, base.lang, `${base.id}-review`)] : lessons;
  return { curriculum: 'eg-moe', term: 1, ...base, lessons: all };
}

// --- Arabic ----------------------------------------------------------------

function arabicUnit(base: UnitBase, specs: ArLetterSpec[], kg2: boolean): Unit {
  const pictures = specs.flatMap((s) => s.words.map(([e]) => e));
  return unit(base, specs.map((s) => arabicLetter(s, pictures, kg2)));
}

const AR = (
  id: string,
  title: string,
  letter: string,
  name: string,
  words: [string, string][],
  bookRef: string,
): ArLetterSpec => ({ id, title, letter, name, words, bookRef });

function arabicKg1(): Unit[] {
  const tr = trFor('ar');
  const u1Lessons = [
    colourSet(['red', 'blue', 'yellow'], 'ar', 'الألوان', 'KG1 العربية ف1 ص7', 'ar-kg1-u1-colours'),
    shapeSet(['circle', 'square', 'triangle'], 'ar', 'الأشكال', 'KG1 العربية ف1 ص16', 'ar-kg1-u1-shapes'),
    colourSet(['green', 'orange', 'red'], 'ar', tr('lesson.moreColours'), 'KG1 العربية ف1 ص7', 'ar-kg1-u1-colours2'),
  ];
  return [
    unit(
      {
        id: 'ar-kg1-u1',
        subject: 'arabic',
        level: 'kg1',
        number: 1,
        title: 'التهيئة',
        lang: 'ar',
        intro: { emojis: ['🎨', '🔺', '👀'], text: 'هيا نستعد للتعلم! نتعرف معًا على الألوان والأشكال.' },
      },
      u1Lessons,
    ),
    arabicUnit(
      {
        id: 'ar-kg1-u2',
        subject: 'arabic',
        level: 'kg1',
        number: 2,
        title: 'أنا وأسرتي',
        lang: 'ar',
        intro: {
          emojis: ['👩', '👨', '🏠', '🧸'],
          text: 'هذه أسرتي الحبيبة: أمي وأبي وإخوتي وجدي وجدتي. هيا نتعلم حروفًا جديدة!',
        },
      },
      [
        AR('ar-kg1-u2-alef', 'هذا أنا', 'أ', 'الألف', [['🦁', 'أسد'], ['🐰', 'أرنب'], ['🍍', 'أناناس']], 'KG1 العربية ف1 ص31'),
        AR('ar-kg1-u2-ba', 'أمي وأبي', 'ب', 'الباء', [['🦆', 'بطة'], ['🏠', 'بيت'], ['🐄', 'بقرة']], 'KG1 العربية ف1 ص36'),
        AR('ar-kg1-u2-meem', 'إخوتي وألعابي', 'م', 'الميم', [['🍌', 'موز'], ['🔑', 'مفتاح'], ['☂️', 'مظلة']], 'KG1 العربية ف1 ص41'),
        AR('ar-kg1-u2-ha', 'بيتي الجميل', 'ح', 'الحاء', [['🐴', 'حصان'], ['🐋', 'حوت'], ['🥛', 'حليب']], 'KG1 العربية ف1 ص46'),
        AR('ar-kg1-u2-jeem', 'جدي وجدتي', 'ج', 'الجيم', [['🐫', 'جمل'], ['🥕', 'جزر'], ['🧀', 'جبن']], 'KG1 العربية ف1 ص51'),
        AR('ar-kg1-u2-dal', 'أغنية أسرتي', 'د', 'الدال', [['🐻', 'دب'], ['🐔', 'دجاجة'], ['🐬', 'دلفين']], 'KG1 العربية ف1 ص57'),
      ],
      false,
    ),
    arabicUnit(
      {
        id: 'ar-kg1-u3',
        subject: 'arabic',
        level: 'kg1',
        number: 3,
        title: 'الطبيعة من حولي',
        lang: 'ar',
        intro: { emojis: ['🌸', '🌳', '🌞', '🌊'], text: 'انظر حولك! الزهور والأشجار والشمس والبحر. هيا نتعلم معًا!' },
      },
      [
        AR('ar-kg1-u3-kha', 'الزهور والألوان', 'خ', 'الخاء', [['🐑', 'خروف'], ['🥒', 'خيار'], ['🍞', 'خبز']], 'KG1 العربية ف1 ص64'),
        AR('ar-kg1-u3-ta', 'أشجار خضراء', 'ت', 'التاء', [['🍎', 'تفاح'], ['🐊', 'تمساح'], ['👑', 'تاج']], 'KG1 العربية ف1 ص69'),
        AR('ar-kg1-u3-lam', 'الشمس والقمر', 'ل', 'اللام', [['🍋', 'ليمون'], ['🧸', 'لعبة'], ['🍖', 'لحم']], 'KG1 العربية ف1 ص74'),
        AR('ar-kg1-u3-seen', 'البحر', 'س', 'السين', [['🐟', 'سمكة'], ['🚗', 'سيارة'], ['⌚', 'ساعة']], 'KG1 العربية ف1 ص79'),
        AR('ar-kg1-u3-noon', 'أنا أزرع', 'ن', 'النون', [['🐝', 'نحلة'], ['🐯', 'نمر'], ['⭐', 'نجمة']], 'KG1 العربية ف1 ص84'),
      ],
      false,
    ),
  ];
}

function arabicKg2(): Unit[] {
  return [
    arabicUnit(
      {
        id: 'ar-kg2-u1',
        subject: 'arabic',
        level: 'kg2',
        number: 1,
        title: 'غذائي',
        lang: 'ar',
        intro: { emojis: ['🍎', '🥕', '🥛'], text: 'ماذا نأكل اليوم؟ الفواكه والخضراوات والحليب تجعلنا أقوياء!' },
      },
      [
        AR('ar-kg2-u1-alef', 'الفواكه', 'أ', 'الألف', [['🍍', 'أناناس'], ['🍚', 'أرز'], ['🦁', 'أسد']], 'KG2 العربية ف1 ص13'),
        AR('ar-kg2-u1-ba', 'الخضراوات', 'ب', 'الباء', [['🥔', 'بطاطس'], ['🍆', 'باذنجان'], ['🧅', 'بصل']], 'KG2 العربية ف1 ص18'),
        AR('ar-kg2-u1-meem', 'الألبان', 'م', 'الميم', [['🍌', 'موز'], ['🥭', 'مانجو'], ['🧂', 'ملح']], 'KG2 العربية ف1 ص23'),
        AR('ar-kg2-u1-ha', 'وجبتي', 'ح', 'الحاء', [['🥛', 'حليب'], ['🍬', 'حلوى'], ['🐴', 'حصان']], 'KG2 العربية ف1 ص28'),
        AR('ar-kg2-u1-jeem', 'آداب الطعام', 'ج', 'الجيم', [['🧀', 'جبن'], ['🥕', 'جزر'], ['🐫', 'جمل']], 'KG2 العربية ف1 ص33'),
        AR('ar-kg2-u1-dal', 'أطعمتي', 'د', 'الدال', [['🐔', 'دجاج'], ['🍩', 'دونات'], ['🐻', 'دب']], 'KG2 العربية ف1 ص39'),
      ],
      true,
    ),
    arabicUnit(
      {
        id: 'ar-kg2-u2',
        subject: 'arabic',
        level: 'kg2',
        number: 2,
        title: 'أدواتي وألعابي',
        lang: 'ar',
        intro: { emojis: ['🍽️', '✏️', '🧸'], text: 'هذه أدواتي وألعابي. أحافظ عليها وأرتبها في مكانها!' },
      },
      [
        AR('ar-kg2-u2-kha', 'أدوات المائدة', 'خ', 'الخاء', [['🍞', 'خبز'], ['🥒', 'خيار'], ['🐑', 'خروف']], 'KG2 العربية ف1 ص46'),
        AR('ar-kg2-u2-ta', 'أدواتي المدرسية', 'ت', 'التاء', [['🍎', 'تفاح'], ['👑', 'تاج'], ['🐊', 'تمساح']], 'KG2 العربية ف1 ص51'),
        AR('ar-kg2-u2-lam', 'أدوات النظافة', 'ل', 'اللام', [['🍋', 'ليمون'], ['🧸', 'لعبة'], ['🥛', 'لبن']], 'KG2 العربية ف1 ص56'),
        AR('ar-kg2-u2-seen', 'ألعابي', 'س', 'السين', [['🚗', 'سيارة'], ['🐟', 'سمكة'], ['⌚', 'ساعة']], 'KG2 العربية ف1 ص61'),
        AR('ar-kg2-u2-noon', 'أحافظ على أدواتي', 'ن', 'النون', [['⭐', 'نجمة'], ['🐝', 'نحلة'], ['🐯', 'نمر']], 'KG2 العربية ف1 ص66'),
        AR('ar-kg2-u2-ra', 'أغنية أدواتي', 'ر', 'الراء', [['📻', 'راديو'], ['🪶', 'ريشة'], ['✉️', 'رسالة']], 'KG2 العربية ف1 ص72'),
      ],
      true,
    ),
    arabicUnit(
      {
        id: 'ar-kg2-u3',
        subject: 'arabic',
        level: 'kg2',
        number: 3,
        title: 'وسائل المواصلات',
        lang: 'ar',
        intro: { emojis: ['🚗', '🚲', '🚂', '✈️', '🚢'], text: 'نركب السيارة والدراجة والقطار والطائرة والسفينة. هيا نسافر ونتعلم!' },
      },
      [
        AR('ar-kg2-u3-fa', 'السيارة', 'ف', 'الفاء', [['🐘', 'فيل'], ['🍓', 'فراولة'], ['🦋', 'فراشة']], 'KG2 العربية ف1 ص79'),
        AR('ar-kg2-u3-kaf', 'الدراجة', 'ك', 'الكاف', [['📖', 'كتاب'], ['⚽', 'كرة'], ['🐕', 'كلب']], 'KG2 العربية ف1 ص84'),
        AR('ar-kg2-u3-qaf', 'القطار', 'ق', 'القاف', [['🐱', 'قطة'], ['🌙', 'قمر'], ['✏️', 'قلم']], 'KG2 العربية ف1 ص89'),
        AR('ar-kg2-u3-ya', 'الطائرة', 'ي', 'الياء', [['✋', 'يد'], ['🕊️', 'يمامة'], ['🛥️', 'يخت']], 'KG2 العربية ف1 ص94'),
        AR('ar-kg2-u3-ain', 'السفينة', 'ع', 'العين', [['🍇', 'عنب'], ['🐦', 'عصفور'], ['👁️', 'عين']], 'KG2 العربية ف1 ص99'),
      ],
      true,
    ),
  ];
}

// --- English ---------------------------------------------------------------

const EN = (id: string, letter: string, words: [string, string][], bookRef: string): EnLetterSpec => ({
  id,
  letter,
  words,
  bookRef,
});

function englishUnit(base: UnitBase, words: [string, string][], letters: EnLetterSpec[], extra: Lesson[] = []): Unit {
  const pictures = letters.flatMap((s) => s.words.map(([e]) => e));
  const ref = `${base.level.toUpperCase()} English T1 Unit ${base.number}`;
  return unit(base, [
    vocab({ id: `${base.id}-words`, title: base.title, words, bookRef: ref }),
    ...extra,
    ...letters.map((s) => englishLetter(s, pictures)),
  ]);
}

function englishKg1(): Unit[] {
  const base = (number: number, title: string, emojis: string[], text: string): UnitBase => ({
    id: `en-kg1-u${number}`,
    subject: 'english',
    level: 'kg1',
    number,
    title,
    lang: 'en',
    intro: { emojis, text },
  });
  const ref = (n: number) => `KG1 English T1 Unit ${n}`;
  return [
    englishUnit(
      base(1, 'Meet and Greet!', ['👋', '👦', '👧'], "Hello, friends! Let's meet and greet!"),
      [['👋', 'hello'], ['🌅', 'good morning'], ['👦', 'boy'], ['👧', 'girl'], ['😀', 'happy'], ['😢', 'sad']],
      [
        EN('en-kg1-u1-t', 'T', [['🚂', 'train'], ['🧸', 'toys'], ['🐢', 'turtle']], ref(1)),
        EN('en-kg1-u1-i', 'I', [['🐛', 'insect'], ['🖋️', 'ink'], ['🦎', 'iguana']], ref(1)),
      ],
    ),
    englishUnit(
      base(2, 'I Can Find it at School!', ['🏫', '📕', '✏️'], 'What can we find at school? Let’s look!'),
      [['🧑‍🏫', 'teacher'], ['🪑', 'chair'], ['📕', 'book'], ['✏️', 'pencil'], ['🖍️', 'crayon'], ['🛝', 'slide']],
      [
        EN('en-kg1-u2-s', 'S', [['⭐', 'star'], ['☀️', 'sun'], ['🏫', 'school']], ref(2)),
        EN('en-kg1-u2-a', 'A', [['🍎', 'apple'], ['🐜', 'ant'], ['🐊', 'alligator']], ref(2)),
        EN('en-kg1-u2-n', 'N', [['🪺', 'nest'], ['🌙', 'night'], ['🔢', 'numbers']], ref(2)),
      ],
    ),
    englishUnit(
      base(3, 'My Body, My Care!', ['👀', '✋', '🦷'], 'This is my body. I take care of it every day!'),
      [['👀', 'eyes'], ['👂', 'ears'], ['👃', 'nose'], ['👄', 'mouth'], ['🦷', 'teeth'], ['✋', 'hands'], ['🦵', 'legs'], ['🦶', 'feet']],
      [
        EN('en-kg1-u3-p', 'P', [['🖊️', 'pen'], ['👖', 'pants'], ['🍳', 'pan']], ref(3)),
        EN('en-kg1-u3-h', 'H', [['❤️', 'heart'], ['🍯', 'honey'], ['🚁', 'helicopter']], ref(3)),
        EN('en-kg1-u3-d', 'D', [['🐶', 'dog'], ['👗', 'dress'], ['🦆', 'duck']], ref(3)),
        EN('en-kg1-u3-r', 'R', [['🐰', 'rabbit'], ['🤖', 'robot'], ['🍚', 'rice']], ref(3)),
      ],
    ),
    englishUnit(
      base(4, 'My Family Picnic!', ['👵', '🌳', '🥪'], 'Let’s have a picnic with my family in the garden!'),
      [['👴', 'grandfather'], ['👵', 'grandmother'], ['👨', 'father'], ['👩', 'mother'], ['🌳', 'tree'], ['🌸', 'flower'], ['🧃', 'juice'], ['🥪', 'sandwich']],
      [
        EN('en-kg1-u4-e', 'E', [['🥚', 'egg'], ['🦅', 'eagle'], ['🐘', 'elephant']], ref(4)),
        EN('en-kg1-u4-c', 'C', [['🐄', 'cow'], ['☁️', 'cloud'], ['🧢', 'cap']], ref(4)),
        EN('en-kg1-u4-k', 'K', [['🥝', 'kiwi'], ['🪁', 'kite'], ['🦘', 'kangaroo']], ref(4)),
        EN('en-kg1-u4-m', 'M', [['👩', 'mom'], ['👨', 'man'], ['🐒', 'monkey']], ref(4)),
      ],
    ),
  ];
}

function englishKg2(): Unit[] {
  const base = (number: number, title: string, emojis: string[], text: string): UnitBase => ({
    id: `en-kg2-u${number}`,
    subject: 'english',
    level: 'kg2',
    number,
    title,
    lang: 'en',
    intro: { emojis, text },
  });
  const ref = (n: number) => `KG2 English T1 Unit ${n}`;
  return [
    englishUnit(
      base(1, 'Little Bodies, Big Moves!', ['🏃', '🤸', '⚽'], 'Let’s move! We can walk, run and jump!'),
      [['🚶', 'walk'], ['🏃', 'run'], ['🤸', 'jump'], ['⚽', 'kick'], ['🪁', 'kite'], ['🧃', 'juice']],
      [
        EN('en-kg2-u1-j', 'J', [['🧃', 'juice'], ['🤹', 'juggle'], ['🧥', 'jacket']], ref(1)),
        EN('en-kg2-u1-k', 'K', [['🪁', 'kite'], ['🥝', 'kiwi'], ['🔑', 'key']], ref(1)),
      ],
    ),
    englishUnit(
      base(2, 'Let’s Get Dressed!', ['👕', '👗', '👟'], 'Let’s get dressed! What will you wear today?'),
      [['👕', 'T-shirt'], ['👗', 'dress'], ['👖', 'trousers'], ['🩳', 'shorts'], ['🧢', 'cap'], ['👟', 'shoes'], ['🧦', 'socks']],
      [
        EN('en-kg2-u2-d', 'D', [['🫏', 'donkey'], ['👗', 'dress'], ['🐶', 'dog']], ref(2)),
        EN('en-kg2-u2-m', 'M', [['🐒', 'monkey'], ['👩', 'mommy'], ['🌙', 'moon']], ref(2)),
        EN('en-kg2-u2-g', 'G', [['🎸', 'guitar'], ['🌱', 'grass'], ['🦒', 'giraffe']], ref(2)),
      ],
    ),
    englishUnit(
      base(3, 'My Week!', ['📅', '🎒', '🚌'], 'There are seven days in my week. Let’s learn them!'),
      [['🎒', 'bag'], ['🚌', 'bus'], ['🛏️', 'bed'], ['🚩', 'flag'], ['🌸', 'flower'], ['💡', 'lamp']],
      [
        EN('en-kg2-u3-o', 'O', [['🍊', 'orange'], ['🐙', 'octopus'], ['🦦', 'otter']], ref(3)),
        EN('en-kg2-u3-b', 'B', [['🎒', 'bag'], ['🚌', 'bus'], ['🛏️', 'bed']], ref(3)),
        EN('en-kg2-u3-f', 'F', [['🚩', 'flag'], ['🌸', 'flower'], ['🐟', 'fish']], ref(3)),
        EN('en-kg2-u3-l', 'L', [['💡', 'lamp'], ['🍃', 'leaf'], ['🦵', 'leg']], ref(3)),
      ],
      [days('en', 'Days of the week', ref(3), 'en-kg2-u3-days')],
    ),
    englishUnit(
      base(4, 'My Busy Day!', ['🌅', '☀️', '🌙'], 'Morning, noon and night — this is my busy day!'),
      [['🌅', 'morning'], ['☀️', 'noon'], ['🌙', 'night'], ['🥞', 'breakfast'], ['🍱', 'lunch'], ['🍝', 'dinner']],
      [
        EN('en-kg2-u4-w', 'W', [['💧', 'water'], ['🐺', 'wolf'], ['⌚', 'watch']], ref(4)),
        EN('en-kg2-u4-c', 'C', [['🐱', 'cat'], ['🎨', 'colors'], ['🐫', 'camel']], ref(4)),
        EN('en-kg2-u4-r', 'R', [['🍚', 'rice'], ['🐰', 'rabbit'], ['📏', 'ruler']], ref(4)),
        EN('en-kg2-u4-u', 'U', [['☂️', 'umbrella'], ['⬆️', 'up'], ['⬇️', 'under']], ref(4)),
      ],
    ),
  ];
}

// --- Math (from the books' math strand, in the app language) --------------

function mathUnits(level: Level, lang: LanguageCode): Unit[] {
  const tr = trFor(lang);
  const base = (number: number, key: string, emojis: string[]): UnitBase => ({
    id: `math-${level}-u${number}`,
    subject: 'math',
    level,
    number,
    title: tr(`units.${key}`),
    lang,
    intro: { emojis, text: tr(`intro.${key}`) },
  });
  if (level === 'kg1') {
    const ref = 'KG1 English T1 — Math';
    return [
      unit(base(1, 'numbers15', ['🍎', '🐟', '⭐']), [1, 2, 3, 4, 5].map((n) => number(n, lang, 5, ref, 'math-kg1'))),
      unit(
        base(2, 'shapes', ['🔵', '🟥', '⭐']),
        (['circle', 'square', 'star', 'heart', 'triangle'] as const).map((s) => shape(s, lang, ref, 'math-kg1')),
      ),
      unit(
        base(3, 'colours', ['🎨', '🍎', '🍌']),
        (['red', 'blue', 'yellow', 'green', 'orange'] as const).map((c) => colour(c, lang, ref, 'math-kg1')),
      ),
    ];
  }
  const ref = 'KG2 English T1 — Math';
  return [
    unit(base(1, 'numbers610', ['🎈', '🐥', '🍓']), [6, 7, 8, 9, 10].map((n) => number(n, lang, 10, ref, 'math-kg2'))),
    unit(base(2, 'days', ['📅', '🌞', '🌙']), [days(lang, tr('units.days'), ref, 'math-kg2-days')], false),
  ];
}

// --- catalogue ---------------------------------------------------------------

const cache = new Map<LanguageCode, Unit[]>();

/** Every unit, Math built in `appLang`. Cached per language. */
export function allUnits(appLang: LanguageCode): Unit[] {
  let units = cache.get(appLang);
  if (!units) {
    units = [
      ...arabicKg1(),
      ...arabicKg2(),
      ...englishKg1(),
      ...englishKg2(),
      ...mathUnits('kg1', appLang),
      ...mathUnits('kg2', appLang),
    ];
    cache.set(appLang, units);
  }
  return units;
}

export function unitsFor(appLang: LanguageCode, subject: Subject, level: Level, term: Term): Unit[] {
  return allUnits(appLang)
    .filter((u) => u.subject === subject && u.level === level && u.term === term)
    .sort((a, b) => a.number - b.number);
}

export function findLesson(appLang: LanguageCode, lessonId: string): { unit: Unit; lesson: Lesson } | null {
  for (const u of allUnits(appLang)) {
    const lesson = u.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit: u, lesson };
  }
  return null;
}

export function findUnit(appLang: LanguageCode, unitId: string): Unit | undefined {
  return allUnits(appLang).find((u) => u.id === unitId);
}
