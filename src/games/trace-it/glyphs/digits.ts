import type { Glyph, Pt } from '../types';
import { arc, curve, line, path } from './build';

const end = (pts: Pt[]): Pt => pts[pts.length - 1];

const twoHook = arc(50, 32, 20, 205, 395, 22);
const nineRing = arc(48, 32, 20, -15, -375, 21);
const fiveBelly = arc(48, 65, 22, -125, 150, 23);

// Manuscript digits in x 25-75, y 10-90. Start point, direction and stroke order follow
// primary-school workbooks: the guided pass teaches exactly what is authored here.
export const DIGITS: readonly Glyph[] = [
  // 0: from the top, counter-clockwise all the way round.
  { id: 'd0', strokes: [path(arc(50, 50, 22, -90, -450, 38))] },
  // 1: small flag up to the top, then straight down.
  { id: 'd1', strokes: [path(line([38, 24], [54, 10]), line([54, 10], [54, 90]))] },
  // 2: upper-left of the hook, over the top, diagonal down, flat base.
  {
    id: 'd2',
    strokes: [path(twoHook, line(end(twoHook), [28, 90]), line([28, 90], [74, 90]))],
  },
  // 3: top-left, round the upper bump to the middle, round the lower bump.
  {
    id: 'd3',
    strokes: [path(arc(48, 30, 20, 210, 450, 18), arc(48, 69, 22, -90, 150, 21))],
  },
  // 4: down and across, then the long downstroke.
  {
    id: 'd4',
    strokes: [
      path(line([40, 10], [27, 62]), line([27, 62], [75, 62])),
      path(line([60, 10], [60, 90])),
    ],
  },
  // 5: down, round the belly; then the top bar.
  {
    id: 'd5',
    strokes: [
      path(line([33, 10], fiveBelly[0]), fiveBelly),
      path(line([33, 10], [70, 10])),
    ],
  },
  // 6: top-right, sweep down the left side, loop round counter-clockwise.
  {
    id: 'd6',
    strokes: [path(curve([66, 14], [48, 4], [28, 30], [28, 67]), arc(50, 67, 22, 180, -180, 21))],
  },
  // 7: top-left across, then the slanted stroke down.
  { id: 'd7', strokes: [path(line([27, 12], [73, 12]), line([73, 12], [42, 90]))] },
  // 8: top-right, counter-clockwise into the S, round the bottom, back up to the start.
  {
    id: 'd8',
    strokes: [
      path(
        arc(50, 28, 16, -30, -180, 18),
        curve([34, 28], [34, 42], [70, 52], [70, 70]),
        arc(50, 70, 20, 0, 180),
        curve([30, 70], [30, 52], [66, 42], [66, 28]),
        arc(50, 28, 16, 0, -30, 18),
      ),
    ],
  },
  // 9: upper right, counter-clockwise circle closed back to the start, then straight down.
  {
    id: 'd9',
    strokes: [path(nineRing, line(end(nineRing), [end(nineRing)[0], 90]))],
  },
];
