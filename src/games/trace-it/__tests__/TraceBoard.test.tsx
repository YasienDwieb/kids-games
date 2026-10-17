import { act, create } from 'react-test-renderer';
import { GestureDetector, State } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { StyleSheet } from 'react-native';
import { DIGITS } from '../glyphs/digits';
import { WARMUPS, warmupFor } from '../glyphs/warmup';
import { LATIN_LOWER, LATIN_UPPER } from '../glyphs/latin';
import { TraceBoard } from '../components/TraceBoard';
import { TrackLayer } from '../components/TrackLayer';
import { EMOJI, GAP, REACH, routeFor, spotsFor } from '../components/Travellers';
import { TRACK_WIDTH } from '../constants';
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

it('warm-up board shows the traveller and its goal', () => {
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <TraceBoard step={{ glyph: warmupFor('line', false), pass: 'guided' }} side={232} accent="coral" onDone={jest.fn()} travel={{ from: '🐶', to: '🦴' }} />,
    );
  });
  const host = (id: string) => tree!.root.findAll((n: { type: unknown; props: { testID?: string } }) => typeof n.type === 'string' && n.props.testID === id);
  expect(host('traveller')).toHaveLength(1);
  expect(host('goal')).toHaveLength(1);
  act(() => tree!.unmount());
});

describe('warm-up spots', () => {
  const roadOf = (id: string, rtl: boolean) =>
    (prepareGlyph(warmupFor(id, rtl)).strokes[0] as { points: readonly (readonly [number, number])[] }).points;
  const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  it('puts the dog in line before the start and the bone after the end', () => {
    const { from, to } = spotsFor(prepareGlyph(warmupFor('line', false)));
    expect(from[0]).toBeLessThan(24);
    expect(from[1]).toBeCloseTo(50);
    expect(to[0]).toBeGreaterThan(76);
    expect(to[1]).toBeCloseTo(50);
  });

  it('waits the carrot in the open middle of the spiral', () => {
    const { to } = spotsFor(prepareGlyph(warmupFor('spiral', false)));
    // Well inside the innermost turn (radius 21).
    expect(dist(to, [50, 50])).toBeLessThan(14);
  });

  it.each(WARMUPS.flatMap((w) => [[w.id, false], [w.id, true]] as const))(
    '%s (rtl %s): both emoji clear of the road, inside the board and apart',
    (id, rtl) => {
      const road = roadOf(id, rtl);
      const { from, to } = spotsFor(prepareGlyph(warmupFor(id, rtl)));
      for (const c of [from, to]) {
        expect(Math.min(...road.map((p) => dist(p, c)))).toBeGreaterThanOrEqual(REACH - 0.5);
        const lo = -TRACK_WIDTH / 2 + EMOJI / 2;
        const hi = 100 + TRACK_WIDTH / 2 - EMOJI / 2;
        for (const v of c) {
          expect(v).toBeGreaterThanOrEqual(lo);
          expect(v).toBeLessThanOrEqual(hi);
        }
      }
      expect(dist(from, to)).toBeGreaterThanOrEqual(EMOJI + GAP);
      // Each waits by its own end of the road.
      expect(dist(from, road[0])).toBeLessThan(dist(from, road[road.length - 1]));
      expect(dist(to, road[road.length - 1])).toBeLessThan(dist(to, road[0]));
    },
  );

  it('routes the traveller along the road and stops touching the goal', () => {
    const road = roadOf('line', false);
    const { from, to } = spotsFor(prepareGlyph(warmupFor('line', false)));
    const route = routeFor(from, road, to);
    expect(route[0]).toEqual(from);
    expect(route[1]).toEqual(road[0]);
    const last = route[route.length - 1];
    expect(dist(last, to)).toBeCloseTo(EMOJI * 0.6);
  });
});
