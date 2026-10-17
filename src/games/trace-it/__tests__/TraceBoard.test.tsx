import { act, create } from 'react-test-renderer';
import { GestureDetector, State } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { DIGITS } from '../glyphs/digits';
import { LATIN_LOWER, LATIN_UPPER } from '../glyphs/latin';
import { TraceBoard } from '../components/TraceBoard';
import { TrackLayer } from '../components/TrackLayer';
import { prepareGlyph } from '../utils/resample';

const mockPlay = jest.fn();
jest.mock('@/sdk', () => ({ ...jest.requireActual('@/sdk'), useSound: () => ({ play: mockPlay }) }));

beforeEach(() => mockPlay.mockClear());

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

function traceD1(props: Partial<React.ComponentProps<typeof TraceBoard>> = {}) {
  const g = DIGITS.find((d) => d.id === 'd1')!;
  const pts = (prepareGlyph(g).strokes[0] as { points: readonly (readonly [number, number])[] }).points;
  const onMisses = jest.fn();
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <TraceBoard step={{ glyph: g, pass: 'guided' }} side={232} accent="coral" onDone={jest.fn()} onMisses={onMisses} {...props} />,
    );
  });
  const gesture = tree!.root.findByType(GestureDetector).props.gesture;
  const tapOff = () => act(() => fireGestureHandler(gesture, [{ state: State.BEGAN, x: 0, y: 0 }, { state: State.END, x: 0, y: 0 }]));
  const trace = () =>
    act(() => {
      fireGestureHandler(gesture, [
        { state: State.BEGAN, x: px(pts[0][0]), y: px(pts[0][1]) },
        ...pts.map((p) => ({ state: State.ACTIVE, x: px(p[0]), y: px(p[1]) })),
        { state: State.END, x: px(54), y: px(90) },
      ]);
    });
  return { tree: tree!, onMisses, tapOff, trace };
}

it('chimes on the finished glyph unless quietDone', () => {
  const loud = traceD1();
  loud.trace();
  expect(mockPlay).toHaveBeenCalledWith('success');
  act(() => loud.tree.unmount());
  mockPlay.mockClear();
  const quiet = traceD1({ quietDone: true });
  quiet.trace();
  expect(mockPlay).not.toHaveBeenCalledWith('success');
  act(() => quiet.tree.unmount());
});

it('reports misses to the host, and 0 once the glyph is done', () => {
  const b = traceD1();
  b.tapOff();
  b.tapOff();
  expect(b.onMisses).toHaveBeenLastCalledWith(2);
  b.trace();
  expect(b.onMisses).toHaveBeenLastCalledWith(0);
  act(() => b.tree.unmount());
});

it('dims strokes still to come in the guided pass only', () => {
  const g = prepareGlyph(LATIN_UPPER.find((x) => x.strokes.filter((s) => s.kind === 'path').length >= 2)!);
  const later = (current?: number) => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<TrackLayer glyph={g} scale={2} solo={false} accent="coral" current={current} />);
    });
    const n = tree!.root.findAll((x: { props: { testID?: string } }) => x.props.testID === 'track-later', { deep: true }).length;
    act(() => tree!.unmount());
    return n;
  };
  expect(later(0)).toBeGreaterThan(0);
  expect(later(g.strokes.length - 1)).toBe(0);
  expect(later(undefined)).toBe(0);
});
