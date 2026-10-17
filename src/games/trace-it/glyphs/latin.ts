import type { Glyph, Pt } from '../types';
import { arc, dot, line, path } from './build';

const end = (pts: Pt[]): Pt => pts[pts.length - 1];
const g = (id: string, ...strokes: Glyph['strokes'][number][]): Glyph => ({ id, strokes });
const down = (x: number, y0: number, y1: number) => path(line([x, y0], [x, y1]));
const across = (y: number, x0: number, x1: number) => path(line([x0, y], [x1, y]));

// Ball-and-stick print (KG1 English): tall lines top to bottom, bars left to right,
// round letters start near 2 o'clock going counter-clockwise. Uppercase y 10-90;
// lowercase x-height y 40-90, ascenders to 10, descenders to 98.

// Uppercase pieces.
const bigC = arc(54, 50, 28, -45, -315, 40);
const bigG = arc(54, 50, 28, -45, -360, 40);
const bigS = [arc(50, 30, 23, -30, -270, 20), arc(50, 70, 23, -90, 150, 20)];
const bigU = arc(50, 62, 25, 180, 0, 28);
const bigJ = arc(46, 70, 16, 0, 165, 20);
const pBump = (x0: number, y0: number, y1: number, cx: number) =>
  path(
    line([x0, y0], [cx, y0]),
    arc(cx, (y0 + y1) / 2, (y1 - y0) / 2, -90, 90),
    line([cx, y1], [x0, y1]),
  );

export const LATIN_UPPER: readonly Glyph[] = [
  // A: left slant down, right slant down (both from the apex), then the bar.
  g('A', path(line([50, 10], [22, 90])), path(line([50, 10], [78, 90])), across(62, 32, 68)),
  // B: stick; then top bump back to the stick and the bottom bump (one stroke).
  g(
    'B',
    down(25, 10, 90),
    path(
      line([25, 10], [46, 10]),
      arc(46, 29.5, 19.5, -90, 90),
      line([46, 49], [25, 49]),
      line([25, 49], [50, 49]),
      arc(50, 69.5, 20.5, -90, 90),
      line([50, 90], [25, 90]),
    ),
  ),
  g('C', path(bigC)),
  // D: stick, then the big curve from the top round to the bottom.
  g('D', down(25, 10, 90), path(line([25, 10], [42, 10]), arc(42, 50, 34, -90, 90, 40), line([42, 90], [25, 90]))),
  // E: stick, then bars top to bottom.
  g('E', down(25, 10, 90), across(10, 25, 75), across(50, 25, 66), across(90, 25, 75)),
  g('F', down(25, 10, 90), across(10, 25, 75), across(50, 25, 66)),
  // G: C-curve round to the right side, then straight in.
  g('G', path(bigG, line(end(bigG), [60, 50]))),
  g('H', down(25, 10, 90), down(75, 10, 90), across(50, 25, 75)),
  // I: one stick (UK print).
  g('I', down(50, 10, 90)),
  // J: down, then hook to the left.
  g('J', path(line([62, 10], [62, 70]), bigJ)),
  // K: stick, then the arm in to the stick and out to the bottom right.
  g('K', down(25, 10, 90), path(line([74, 10], [25, 52]), line([25, 52], [76, 90]))),
  g('L', path(line([25, 10], [25, 90]), line([25, 90], [72, 90]))),
  // M: left stick, the V from the top-left to the top-right, right stick.
  g('M', down(20, 10, 90), path(line([20, 10], [50, 62]), line([50, 62], [80, 10])), down(80, 10, 90)),
  // N: stick, diagonal, stick.
  g('N', down(25, 10, 90), path(line([25, 10], [75, 90])), down(75, 10, 90)),
  g('O', path(arc(50, 50, 30, -50, -410, 40))),
  g('P', down(25, 10, 90), pBump(25, 10, 52, 48)),
  g('Q', path(arc(50, 50, 30, -50, -410, 40)), path(line([56, 70], [78, 90]))),
  // R: stick, then the bump back to the stick and the leg out.
  g(
    'R',
    down(25, 10, 90),
    path(line([25, 10], [48, 10]), arc(48, 31, 21, -90, 90), line([48, 52], [25, 52]), line([25, 52], [76, 90])),
  ),
  g('S', path(...bigS)),
  g('T', path(line([20, 10], [80, 10])), path(line([50, 10], [50, 90]))),
  // U: down, round the bottom, up.
  g('U', path(line([25, 10], [25, 62]), bigU, line(end(bigU), [75, 10]))),
  g('V', path(line([22, 10], [50, 90]), line([50, 90], [78, 10]))),
  g('W', path(line([12, 10], [31, 90]), line([31, 90], [50, 26]), line([50, 26], [69, 90]), line([69, 90], [88, 10]))),
  // X: top-left down to the right, then top-right down to the left.
  g('X', path(line([25, 10], [75, 90])), path(line([75, 10], [25, 90]))),
  // Y: left arm, right arm, then the stem.
  g('Y', path(line([22, 10], [50, 50])), path(line([78, 10], [50, 50])), down(50, 50, 90)),
  g('Z', path(line([25, 10], [75, 10]), line([75, 10], [25, 90]), line([25, 90], [75, 90]))),
];

// Lowercase pieces: x-height body centred at y 65.
const ring = () => arc(50, 65, 22, -30, -360, 25); // a, d, g, q: round from 2 o'clock
const bowl = () => arc(50, 65, 22, 180, 540, 25); // b, p: from the stick, clockwise
const hump = (x0: number, x1: number, top: number) => {
  const r = (x1 - x0) / 2;
  const cy = top + r;
  return path(arc(x0 + r, cy, r, 180, 360), line([x1, cy], [x1, 90]));
};
const descHook = (x: number, r: number, y = 86) => arc(x - r, y, r, 0, 165, 98 - y);
const ySlant: [Pt, Pt] = [[72, 40], [38, 98]];
const yMeet: Pt = [72 - 34 * (40 / 58), 80];

export const LATIN_LOWER: readonly Glyph[] = [
  // a, d, g, q: round from 2 o'clock counter-clockwise, then the stick down.
  g('a', path(ring()), down(72, 40, 90)),
  // b: tall stick, then the bowl from the stick going clockwise.
  g('b', down(28, 10, 90), path(bowl())),
  g('c', path(arc(52, 65, 22, -45, -315, 25))),
  g('d', path(ring()), down(72, 10, 90)),
  // e: bar left to right, then curl counter-clockwise.
  g('e', path(line([28, 65], [72, 65]), arc(50, 65, 22, 0, -315, 25))),
  // f: hook over the top and down, then the cross bar.
  g('f', path(arc(60, 26, 16, -20, -180), line([44, 26], [44, 90])), across(45, 30, 60)),
  g('g', path(ring()), path(line([72, 40], [72, 88]), descHook(72, 14, 88))),
  g('h', down(28, 10, 90), hump(28, 72, 40)),
  g('i', down(50, 40, 90), dot(50, 24)),
  g('j', path(line([56, 40], [56, 86]), descHook(56, 14)), dot(56, 24)),
  // k: tall stick, then the arm in to the stick and out.
  g('k', down(30, 10, 90), path(line([70, 40], [30, 68]), line([30, 68], [72, 90]))),
  g('l', down(50, 10, 90)),
  g('m', down(18, 40, 90), hump(18, 46, 40), hump(46, 74, 40)),
  g('n', down(28, 40, 90), hump(28, 72, 40)),
  g('o', path(arc(50, 65, 22, -50, -410, 25))),
  g('p', down(28, 40, 98), path(bowl())),
  g('q', path(ring()), down(72, 40, 98)),
  // r: stick, then the small arch from the stick.
  g('r', down(32, 40, 90), path(arc(54, 64, 22, 180, 310, 24))),
  g('s', path(arc(50, 52.5, 17, -30, -270, 12.5), arc(50, 77.5, 19, -90, 150, 12.5))),
  g('t', path(line([50, 15], [50, 90])), path(line([32, 45], [68, 45]))),
  // u: down, round the bottom and up; then the stem down.
  g('u', path(line([28, 40], [28, 68]), arc(50, 68, 22, 180, 0), line([72, 68], [72, 40])), down(72, 40, 90)),
  g('v', path(line([28, 40], [50, 90]), line([50, 90], [72, 40]))),
  g('w', path(line([16, 40], [33, 90]), line([33, 90], [50, 52]), line([50, 52], [67, 90]), line([67, 90], [84, 40]))),
  g('x', path(line([28, 40], [72, 90])), path(line([72, 40], [28, 90]))),
  // y: short slant in from the left, then the long slant into the descender.
  g('y', path(line([28, 40], yMeet)), path(line(...ySlant))),
  g('z', path(line([28, 40], [72, 40]), line([72, 40], [28, 90]), line([28, 90], [72, 90]))),
];
