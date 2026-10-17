import { act, create } from 'react-test-renderer';
import { GestureDetector, State } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { DIGITS } from '../glyphs/digits';
import { LATIN_LOWER } from '../glyphs/latin';
import { TraceBoard } from '../components/TraceBoard';
import { prepareGlyph } from '../utils/resample';

// side 232 → 2 px per box unit, 16 px pad.
const px = (v: number) => 16 + 2 * v;

it('traces digit 1 to done', () => {
  const g = DIGITS.find((d) => d.id === 'd1')!;
  const pts = (prepareGlyph(g).strokes[0] as { points: readonly (readonly [number, number])[] }).points;
  const onDone = jest.fn();
  const onActivity = jest.fn();
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(<TraceBoard step={{ glyph: g, pass: 'guided' }} side={232} accent="coral" onDone={onDone} onActivity={onActivity} />);
  });
  const gesture = tree!.root.findByType(GestureDetector).props.gesture;
  // A tap off the start is a miss: 2 stars instead of 3.
  act(() => fireGestureHandler(gesture, [{ state: State.BEGAN, x: 0, y: 0 }, { state: State.END, x: 0, y: 0 }]));
  act(() => {
    fireGestureHandler(gesture, [
      { state: State.BEGAN, x: px(pts[0][0]), y: px(pts[0][1]) },
      ...pts.map((p) => ({ state: State.ACTIVE, x: px(p[0]), y: px(p[1]) })),
      { state: State.END, x: px(54), y: px(90) },
    ]);
  });
  expect(onActivity).toHaveBeenCalled();
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(onDone).toHaveBeenCalledWith(2);
  act(() => tree!.unmount());
});

it('path then dot reports next kind and finishes on dot tap', () => {
  const g = LATIN_LOWER.find((d) => d.strokes.some((s) => s.kind === 'dot'))!;
  const pg = prepareGlyph(g);
  const onDone = jest.fn();
  const onStrokeDone = jest.fn();
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(<TraceBoard step={{ glyph: g, pass: 'solo' }} side={232} accent="coral" onDone={onDone} onStrokeDone={onStrokeDone} />);
  });
  const gesture = tree!.root.findByType(GestureDetector).props.gesture;
  for (const s of pg.strokes) {
    act(() => {
      if (s.kind === 'dot') {
        fireGestureHandler(gesture, [{ state: State.BEGAN, x: px(s.at[0]), y: px(s.at[1]) }, { state: State.END, x: px(s.at[0]), y: px(s.at[1]) }]);
      } else {
        fireGestureHandler(gesture, [
          { state: State.BEGAN, x: px(s.points[0][0]), y: px(s.points[0][1]) },
          ...s.points.map((p) => ({ state: State.ACTIVE, x: px(p[0]), y: px(p[1]) })),
          { state: State.END, x: 0, y: 0 },
        ]);
      }
    });
  }
  expect(onStrokeDone).toHaveBeenLastCalledWith('dot');
  expect(onDone).toHaveBeenCalledWith(3);
  expect(onDone).toHaveBeenCalledTimes(1);
  act(() => tree!.unmount());
});
