import type { Glyph, Pt, Stroke } from '../types';
import { curve, dot, join, line, path } from './build';

const end = (pts: Pt[]): Pt => pts[pts.length - 1];
const g = (id: string, ...strokes: Stroke[]): Glyph => ({ id, strokes });

// Isolated Naskh for children (Egyptian Ministry KG1 book). Baseline y 65; descenders to ~90.
// The body starts at its right/top point and runs right to left; dots come last.
// Exceptions taken from the book: ج ح خ start the head left to right then fold back into the
// bowl; م starts at the top-left of its head and goes round clockwise.

// ب ت ث: right tip, down into the shallow bowl, along the baseline, up to the left tip.
const baaBody = () =>
  path(
    curve([80, 45], [81, 60], [76, 66], [64, 66]),
    line([64, 66], [36, 66]),
    curve([36, 66], [26, 66], [20, 60], [20, 50]),
  );

// ن ق ل س ش ص ض: the round bowl under the baseline, ending at the left tip.
const deepBowl = (from: Pt, left: number) =>
  curve(from, [from[0] + 1, 94], [left, 94], [left, from[1] + 4]);

// ج ح خ: head left to right, fold back down-left, round the bowl to the lower right.
const haaBody = () =>
  path(
    line([40, 32], [74, 27]),
    curve([74, 27], [60, 31], [44, 38], [35, 48]),
    curve([35, 48], [22, 62], [28, 88], [52, 88]),
    curve([52, 88], [62, 88], [70, 86], [76, 82]),
  );

// ع غ: small c-head from the top right, a short step right, then the big bowl.
const aynBody = () =>
  path(
    curve([66, 32], [50, 20], [30, 38], [50, 48]),
    curve([50, 48], [54, 50], [60, 51], [66, 50]),
    curve([66, 50], [44, 54], [28, 66], [32, 80]),
    curve([32, 80], [36, 92], [56, 92], [64, 86]),
  );

// د ذ: short diagonal down to the corner, then along the base to the left.
const dalBody = () =>
  path(
    curve([40, 26], [50, 38], [68, 50], [68, 60]),
    curve([68, 60], [68, 66], [58, 66], [28, 66]),
    line([28, 66], [25, 60]),
  );

// ر ز: from the top, down and away into the tail at the lower left.
const raaBody = () => path(curve([62, 40], [67, 60], [60, 80], [28, 90]));

// س ش: three teeth right to left, then the bowl.
const cup = (x1: number, x2: number): Pt[] => curve([x1, 46], [x1, 69], [x2, 69], [x2, 46]);
const seenBody = () => path(cup(86, 73), cup(73, 60), deepBowl([60, 46], 18));

// ص ض: loop up and round clockwise, back along the base, a small tooth, then the bowl.
const sadBody = () =>
  path(
    curve([58, 62], [62, 40], [88, 38], [86, 56]),
    curve([86, 56], [84, 66], [66, 66], [56, 66]),
    curve([56, 66], [52, 66], [50, 62], [50, 54]),
    deepBowl([50, 54], 14),
  );

// ط ظ: the loop body, then the upright top to bottom.
const taaHeavy = () => [
  path(curve([42, 62], [46, 40], [80, 38], [80, 56]), curve([80, 56], [80, 67], [56, 66], [32, 66])),
  path(line([42, 14], [42, 62])),
];

// ف ق: head loop from the junction, clockwise, back to the base, then the tail.
const head = (x: number): Pt[] =>
  join(curve([x, 64], [x - 6, 48], [x + 12, 38], [x + 14, 54]), curve([x + 14, 54], [x + 15, 64], [x + 6, 66], [x, 66]));

const faaBody = () => {
  const h = head(66);
  return path(h, line(end(h), [32, 66]), curve([32, 66], [24, 66], [18, 60], [18, 50]));
};
const qafBody = () => {
  const h = head(60);
  return path(h, deepBowl(end(h), 18));
};

const meemBody = () =>
  path(
    curve([46, 46], [50, 34], [70, 36], [69, 51]),
    curve([69, 51], [68, 62], [56, 62], [46, 60]),
    curve([46, 60], [43, 72], [42, 82], [42, 92]),
  );

export const ARABIC_GLYPHS: readonly Glyph[] = [
  // ا: one stroke top to bottom (the hamza of أ is not traced).
  g('alef', path(line([50, 14], [50, 66]))),
  g('baa', baaBody(), dot(50, 82)),
  g('taa', baaBody(), dot(58, 30), dot(42, 30)),
  g('thaa', baaBody(), dot(58, 32), dot(42, 32), dot(50, 21)),
  g('jeem', haaBody(), dot(52, 64)),
  g('haa', haaBody()),
  g('khaa', haaBody(), dot(56, 15)),
  g('dal', dalBody()),
  g('thal', dalBody(), dot(42, 13)),
  g('raa', raaBody()),
  g('zay', raaBody(), dot(60, 28)),
  g('seen', seenBody()),
  g('sheen', seenBody(), dot(80, 34), dot(68, 34), dot(74, 23)),
  g('sad', sadBody()),
  g('dad', sadBody(), dot(72, 32)),
  g('taa_heavy', ...taaHeavy()),
  g('thaa_heavy', ...taaHeavy(), dot(62, 30)),
  g('ayn', aynBody()),
  g('ghayn', aynBody(), dot(52, 16)),
  g('faa', faaBody(), dot(72, 32)),
  g('qaf', qafBody(), dot(74, 32), dot(62, 32)),
  // ك: upright down and along the base to the left, then the small zigzag inside.
  g(
    'kaf',
    path(line([72, 16], [72, 62]), curve([72, 62], [72, 66], [68, 66], [62, 66]), line([62, 66], [30, 66]), line([30, 66], [27, 55])),
    path(curve([58, 34], [46, 30], [44, 42], [54, 44]), line([54, 44], [44, 52])),
  ),
  // ل: upright down, then the bowl to the left and up.
  g('lam', path(line([66, 14], [66, 58]), deepBowl([66, 58], 26))),
  // م: head from the top-left round clockwise, back to the left, then the tail down.
  g('meem', meemBody()),
  g('noon', path(curve([72, 42], [74, 92], [26, 92], [28, 42])), dot(50, 34)),
  // ه: from the top, round counter-clockwise, then the small inner loop.
  g(
    'haa_soft',
    path(
      curve([54, 32], [28, 36], [26, 66], [50, 66]),
      curve([50, 66], [74, 66], [74, 40], [54, 32]),
      curve([54, 32], [46, 44], [46, 56], [54, 58]),
    ),
  ),
  // و: head from the left round clockwise, then the tail down to the lower left.
  g('waw', path(curve([58, 64], [42, 56], [52, 34], [66, 44]), curve([66, 44], [76, 52], [70, 78], [30, 90]))),
  // ي: small head down to the left, swing back right, round the bowl to the left.
  // Taught without the two dots, as children write it at the end of a word.
  g(
    'yaa',
    path(
      curve([62, 36], [54, 40], [42, 46], [44, 54]),
      curve([44, 54], [46, 60], [64, 58], [74, 62]),
      curve([74, 62], [86, 70], [74, 90], [50, 90]),
      curve([50, 90], [36, 90], [24, 84], [22, 72]),
    ),
  ),
];
