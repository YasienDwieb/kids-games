/**
 * The playable board for one RoundStep: outlined track, the child's ink, start
 * markers, finger tracing via the tracker, and the shared hint ladder (bouncing
 * start → pulsing arrow → ghost-hand reveal; misses are reported for the host's Lulu).
 * The host owns layout, instructions, idle timing and the win flow.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  DemoHand,
  useHintLadder,
  useSound,
  type AccentName,
  type DemoPoint,
} from '@/sdk';
import type { RoundStep } from '../catalog';
import { charStars } from '../progress';
import type { Glyph, Pt } from '../types';
import { boardMetrics, toBox } from '../utils/segments';
import { down, initTrace, move, up, withDotAt, type Step, type TraceState } from '../utils/tracker';
import { prepareGlyph } from '../utils/resample';
import { InkLayer } from './InkLayer';
import { Markers } from './Markers';
import { TrackLayer } from './TrackLayer';
import { Travellers } from './Travellers';

type TraceBoardProps = {
  step: RoundStep;
  side: number;
  showDemo?: boolean;
  accent: AccentName;
  /** A stroke finished and another follows; `next` is that stroke's kind. */
  onStrokeDone?: (next: 'path' | 'dot' | null) => void;
  onDone: (stars: 1 | 2 | 3) => void;
  /** Any grab, advance or dot hit — lets the host reset its idle timer. */
  onActivity?: () => void;
  /** Misses on the current stroke (0 once the glyph is done) — the host shows Lulu encouraging. */
  onMisses?: (misses: number) => void;
  /** Skip the finishing chime (the host plays its own). */
  quietDone?: boolean;
  /** Warm-ups: `from` travels along the path to `to`. */
  travel?: { from: string; to: string; faces?: 'left' };
};

const DEMO_MAX_POINTS = 8;

/** Demo-hand points (box units) for the rest of the current stroke. */
function demoFor(glyph: Glyph, s: TraceState): Pt[] {
  const stroke = glyph.strokes[s.stroke];
  if (stroke.kind === 'dot') return [stroke.at];
  const rest = stroke.points.slice(s.progress);
  if (rest.length <= DEMO_MAX_POINTS) return rest;
  const out: Pt[] = [];
  for (let i = 0; i < DEMO_MAX_POINTS; i++) {
    out.push(rest[Math.round((i * (rest.length - 1)) / (DEMO_MAX_POINTS - 1))]);
  }
  return out;
}

export function TraceBoard({
  step,
  side,
  showDemo = false,
  accent,
  onStrokeDone,
  onDone,
  onActivity,
  onMisses,
  quietDone = false,
  travel,
}: TraceBoardProps) {
  const { play } = useSound();
  const prepared = useMemo(() => prepareGlyph(step.glyph), [step.glyph]);
  // Mutable per-step session: a new step starts from a clean tracker. Keyed on
  // the step's contents so a host passing a fresh-but-equal object doesn't reset.
  // Its glyph's dots get reordered as the child taps them (see withDotAt).
  const session = useMemo(
    () => ({ glyph: prepared, state: initTrace(), stars: [] as (1 | 2 | 3)[], reported: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prepared, step.pass],
  );
  const glyph = session.glyph;
  const [, setTick] = useState(0);
  const s = session.state;
  // Keyed on the pass too, so a single-stroke glyph's guided misses don't leak into its solo pass.
  const ladder = useHintLadder(`${step.pass}:${glyph.id}:${s.stroke}`);
  const { scale, pad } = boardMetrics(side);
  const guided = step.pass === 'guided';

  const missesShown = s.done ? 0 : ladder.misses;
  useEffect(() => {
    onMisses?.(missesShown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missesShown]);

  const apply = ({ state, event }: Step) => {
    const { glyph } = session;
    const prev = session.state;
    session.state = state;
    // Only re-render when something drawn changed, not on every finger move.
    if (
      state.progress !== prev.progress ||
      state.stroke !== prev.stroke ||
      state.grabbed !== prev.grabbed ||
      state.done !== prev.done
    ) {
      setTick((n) => n + 1);
    }
    switch (event) {
      case 'grab':
        play('pop');
        onActivity?.();
        break;
      case 'advance':
        onActivity?.();
        break;
      case 'miss':
        ladder.miss();
        break;
      case 'strokeDone': {
        session.stars.push(ladder.stars);
        const finished = glyph.strokes[state.stroke - 1];
        // A dot finishes on touch-down: a hit pops, a traced path chimes.
        if (finished.kind === 'dot') {
          play('pop');
          onActivity?.();
        } else {
          play('success');
        }
        onStrokeDone?.(glyph.strokes[state.stroke]?.kind ?? null);
        break;
      }
      case 'glyphDone':
        session.stars.push(ladder.stars);
        if (glyph.strokes[state.stroke].kind === 'dot') onActivity?.();
        if (!quietDone) play('success');
        if (!session.reported) {
          session.reported = true;
          onDone(charStars(session.stars));
        }
        break;
      default:
        break;
    }
  };

  // The gesture is created once; it always calls the latest render's handler.
  const handler = useRef<{ begin: (x: number, y: number) => void; update: (x: number, y: number) => void; end: () => void }>(
    null!,
  );
  handler.current = {
    begin: (x, y) => {
      const p = toBox(x, y, side, pad);
      session.glyph = withDotAt(session.glyph, session.state, p);
      apply(down(session.glyph, session.state, p));
    },
    update: (x, y) => apply(move(session.glyph, session.state, toBox(x, y, side, pad))),
    end: () => apply(up(session.glyph, session.state)),
  };
  const pan = useRef(
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .maxPointers(1)
      .onBegin((e) => handler.current.begin(e.x, e.y))
      .onUpdate((e) => handler.current.update(e.x, e.y))
      .onFinalize(() => handler.current.end()),
  ).current;

  const demo = !s.done && !s.grabbed && (showDemo || ladder.step === 'reveal');
  const demoKey = `${s.stroke}:${s.progress}`;
  const demoPoints = useMemo<DemoPoint[]>(
    () => (demo ? demoFor(glyph, s).map(([x, y]) => ({ x: pad + x * scale, y: pad + y * scale })) : []),
    // s changes identity every event; the stroke and resume point are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demo, glyph, demoKey, pad, scale],
  );
  const dotDemo = !s.done && glyph.strokes[s.stroke].kind === 'dot';

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.root, { width: side, height: side }]}>
        <View pointerEvents="none" style={[styles.box, { left: pad, top: pad, width: 100 * scale, height: 100 * scale }]}>
          <TrackLayer glyph={glyph} scale={scale} solo={!guided} accent={accent} current={guided ? s.stroke : undefined} />
          <InkLayer glyph={glyph} stroke={s.stroke} progress={s.progress} done={s.done} scale={scale} accent={accent} />
          <Markers
            glyph={glyph}
            stroke={s.stroke}
            progress={s.progress}
            done={s.done}
            scale={scale}
            guided={guided}
            hint={ladder.step}
            accent={accent}
          />
          {travel ? (
            <Travellers
              glyph={glyph}
              from={travel.from}
              to={travel.to}
              faces={travel.faces}
              done={s.done}
              scale={scale}
            />
          ) : null}
        </View>
        {demoPoints.length > 0 ? (
          <DemoHand
            mode={dotDemo || demoPoints.length < 2 ? 'tap' : 'drag'}
            points={demoPoints}
            size={Math.max(44, side * 0.16)}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Box coordinates are physical: Arabic glyphs are authored right-to-left already.
  root: { direction: 'ltr' },
  box: { position: 'absolute' },
});
