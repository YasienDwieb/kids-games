import { useCallback, useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { clampDt, MAX_DT } from './frame';

/**
 * A game's per-frame step. Runs on the **UI thread**, so it must be a worklet:
 * put `'worklet'` on the first line. It may read and write shared values
 * freely; to reach React state, use `runOnJS` — and only when something the UI
 * actually shows has changed, never every frame.
 *
 * @param dt Seconds since the previous frame, clamped to `maxDt`.
 * @param elapsed Seconds the loop has spent *active* (pauses don't advance it).
 */
export type GameLoopStep = (dt: number, elapsed: number) => void;

export type GameLoopOptions = {
  /** Whether the loop is running. Flip to `false` for pauses and overlays. */
  active?: boolean;
  /** Longest frame to integrate, in seconds. Defaults to ~30fps. */
  maxDt?: number;
};

/**
 * Run `step` on every frame, on the UI thread.
 *
 * This is the SDK's single answer to "move something continuously". It exists
 * because the alternative each game reached for — `requestAnimationFrame` plus
 * `Animated.Value.setValue()` or per-frame `setState` — runs the integration on
 * the JS thread, where it competes with React reconciliation, storage reads and
 * audio decoding. Every hiccup on that thread became a visible stutter. A frame
 * callback runs on the UI thread instead, so motion keeps its cadence no matter
 * what JS is doing.
 *
 * Two rules keep it that way:
 *   1. Positions live in shared values, mapped to transforms by
 *      `useAnimatedStyle`. Never in React state.
 *   2. Cross back to JS (`runOnJS`) only on real events — a catch, a level end —
 *      not once per frame.
 */
export function useGameLoop(step: GameLoopStep, options: GameLoopOptions = {}): void {
  const { active = true, maxDt = MAX_DT } = options;

  const elapsed = useSharedValue(0);
  const maxDtRef = useSharedValue(maxDt);

  useEffect(() => {
    maxDtRef.value = maxDt;
  }, [maxDt, maxDtRef]);

  /* Reanimated re-registers the frame callback whenever this identity changes,
     so wrap `step` rather than inlining it: the loop is then rebuilt only when
     the game's step really changes (a new level), not on every render. Give
     `step` stable deps — a `useCallback` reading shared values — and the loop
     survives untouched for the whole level. */
  const onFrame = useCallback(
    (info: { timeSincePreviousFrame: number | null }) => {
      'worklet';
      const dt = clampDt(info.timeSincePreviousFrame, maxDtRef.value);
      if (dt === 0) return; // first frame after (re)start — nothing to integrate
      elapsed.value += dt;
      step(dt, elapsed.value);
    },
    [step, elapsed, maxDtRef],
  );

  const frame = useFrameCallback(onFrame, false);

  // `frame` is a stable ref object from reanimated, but its `isActive` field is
  // mutated in place; depend on `setActive` rather than the object.
  const setActive = frame.setActive;
  useEffect(() => {
    setActive(active);
    return () => setActive(false);
  }, [active, setActive]);
}

/** Re-export so games can type their own channels without a direct dependency. */
export type { SharedValue };
