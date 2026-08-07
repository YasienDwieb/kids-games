---
title: "Motion and the Game Loop"
summary: "src/sdk/motion/ gives games a UI-thread frame loop (useGameLoop) and a set of worklet-safe easing helpers (frame.ts), so continuous motion — falling items, a chasing basket — keeps its cadence no matter what the JS thread is doing. candy-catch is the first and, as of this range, only consumer; turbo-road and balloon-archer still drive their own requestAnimationFrame loops on the JS thread."
topics: [architecture, sdk, motion]
sources:
  - id: use-game-loop
    type: file
    path: src/sdk/motion/useGameLoop.ts
  - id: frame-ts
    type: file
    path: src/sdk/motion/frame.ts
  - id: frame-test
    type: file
    path: src/sdk/motion/__tests__/frame.test.ts
  - id: candy-catch-index
    type: file
    path: src/games/candy-catch/index.tsx
  - id: candy-catch-constants
    type: file
    path: src/games/candy-catch/constants.ts
  - id: babel-config
    type: file
    path: babel.config.js
  - id: package-json
    type: file
    path: package.json
  - id: turbo-road-loop
    type: file
    path: src/games/turbo-road/hooks/useRaceGame.ts
  - id: balloon-archer-loop
    type: file
    path: src/games/balloon-archer/hooks/useArcheryGame.ts
  - id: sdk-barrel
    type: file
    path: src/sdk/index.ts
---

`src/sdk/motion/` gives games one shared way to move something continuously: a
per-frame callback that runs on the UI thread instead of the JS thread. It
exists because the pattern every game reached for before it —
`requestAnimationFrame` driving an `Animated.Value.setValue()` call or a
per-frame `setState` — runs that integration on the same JS thread that also
handles React reconciliation, `AsyncStorage` reads, and audio decoding, so any
hiccup on that thread showed up as visible stutter in the motion itself
[@use-game-loop]. `useGameLoop` and its companion math module, `frame.ts`, are
the SDK's answer: positions live in reanimated shared values and are mapped to
transforms by `useAnimatedStyle`, so a frame of motion never waits on a React
render at all.

`candy-catch` — added in the same range that introduced this subsystem — is
the first game built on it, and the reference example for how a game should
use it [@candy-catch-index]. It is also, as of this range, the *only* one:
`turbo-road` and `balloon-archer` still drive their motion with their own
`requestAnimationFrame` loops [@turbo-road-loop] [@balloon-archer-loop]. Do not
assume every game has been migrated to `useGameLoop` just because the
mechanism exists in the SDK.

## `useGameLoop`: the contract

`useGameLoop(step, { active, maxDt })` wraps reanimated's `useFrameCallback`
and calls `step(dt, elapsed)` once per frame, entirely on the UI thread
[@use-game-loop]. Three rules define the contract a game must honor:

- **`step` must be a worklet.** Its first line has to be the `'worklet'`
  directive, or reanimated cannot run it off the JS thread. Inside it, a game
  may read and write shared values freely, but it cannot close over ordinary
  JS state or call arbitrary JS functions.
- **React only hears about real events, via `runOnJS`.** Crossing back to the
  JS thread — to update a score, log a catch, end a level — costs a bridge
  hop, so it should happen for an actual game event, never once per frame
  [@use-game-loop].
- **`active` gates the whole loop, not per-frame branching inside `step`.**
  Passing `active: status === 'playing' && overlay === 'none'` (as
  `candy-catch` does) calls `frame.setActive()` under the hood, so a pause or
  an end-of-level overlay stops the callback from firing at all rather than
  firing and doing nothing [@candy-catch-index] [@use-game-loop].

`elapsed` is seconds the loop has spent *active* — pauses do not advance it —
which is what candy-catch uses to drive each falling item's continuous wobble
(`Math.sin(elapsed * 2.4 + phase)`) without a separate timer [@candy-catch-index].

## The dt clamp is an invariant

`frame.ts`'s `clampDt` converts reanimated's `timeSincePreviousFrame` (ms, or
`null` on the very first frame) into a delta in seconds, capped at `MAX_DT`
(`1/30`, roughly 30fps) [@frame-ts]. This clamp is not a tuning knob a game can
skip — it is the thing that keeps a single stalled frame from breaking motion
outright. Before this subsystem existed, candy-catch's own hand-rolled loop
computed `dt` from raw timestamps with no ceiling, so one long frame — a GC
pause, an audio decode, the app returning from the background — integrated one
huge step and every falling item visibly teleported instead of continuing to
fall smoothly [@frame-ts]. `frame.test.ts` pins this behavior directly: a
2000ms gap between frames must still clamp to `MAX_DT`, and a `null`
`timeSincePreviousFrame` (the first frame) must clamp to exactly `0`, so
nothing is integrated before there is a real previous frame to measure from
[@frame-test].

The rest of `frame.ts` is worklet-safe motion math with the same `'worklet'`
directive on every function, so each one can be called from inside `step`:
`clamp` bounds a value; `lerp` interpolates linearly; `wrap` wraps a value into
`[0, span)` for looping scroll or parallax phases; and `approach(current,
target, rate, dt)` eases a value toward a target using exponential smoothing
rather than the naive `v += (target - v) * k` form, specifically because the
naive form converges at a different *rate* depending on frame rate — the same
chase motion would feel snappier on a 120Hz screen than a 60Hz one. The
exponential form depends on elapsed time, not frame count, so `frame.test.ts`
asserts the same `approach` call converges to the same value after the same
amount of *time* whether it is stepped at 60Hz or 120Hz [@frame-test]
[@frame-ts]. candy-catch uses `approach` for the basket chasing the player's
finger, and `clamp` for capping the basket's visual tilt angle
[@candy-catch-index].

## candy-catch as the reference consumer

candy-catch's rewrite illustrates every rule above in one file
[@candy-catch-index]:

- **Shared values, not state.** The basket's x-position, tilt, and every
  falling item's x/y/rotation/opacity live in `useSharedValue` /
  `makeMutable` channels, read by `useAnimatedStyle` to produce transforms.
  None of it is React state, so a fall never waits on a render.
- **A fixed item pool.** `ITEM_POOL` (10) view slots are mounted once up
  front and reused for the life of a level; catching or missing an item just
  frees its slot for the next spawn [@candy-catch-constants]. This exists so
  that nothing mounts or unmounts mid-fall — no view creation or image decode
  ever lands in the middle of a level, which was a second source of the
  stutter the old per-item-`Animated.Value` approach produced.
  `slot.cooldown` (`SLOT_COOLDOWN`, 0.25s) holds a just-retired slot empty
  briefly so its fade-out animation can finish before a new item reuses it
  [@candy-catch-constants].
- **One `step` worklet, few `runOnJS` calls.** The single `step` worklet
  advances the basket toward its pan-gesture target with `approach`,
  integrates every active item's fall, tests catch collisions against the
  basket, and only calls `runOnJS(spawn)`, `runOnJS(onCaught)`, or
  `runOnJS(onMissed)` when one of those events actually happens
  [@candy-catch-index].
- **The gesture writes shared values directly.** The basket's drag target is
  a `react-native-gesture-handler` `Gesture.Pan()` whose `onBegin`/`onChange`
  worklets write straight to `basketTarget.value`, so dragging never round-trips
  through JS either [@candy-catch-index].

### Two bugs the rewrite fixed

The rewrite corrected two concrete motion bugs in candy-catch's original
hand-rolled loop, both worth knowing as gotchas for any future
`requestAnimationFrame`-based game code in this repo:

1. **A ref read at render time doesn't animate.** The old basket view read its
   position as `{ left: basketX.current }`, a plain ref mutated on every pan
   move. Mutating a ref never triggers a re-render, so the basket's on-screen
   position only actually updated when some *unrelated* state change (a spawn,
   a catch) happened to force a re-render — the basket looked like it moved in
   jumps rather than tracking the finger. The fix routes the basket's position
   through a shared value and `useAnimatedStyle` instead, exactly the pattern
   the rest of this page describes.
2. **No dt clamp.** Covered above — the old loop had no ceiling on a single
   frame's `dt`, so a stalled frame teleported every falling item.

## Boundary and native-dependency notes

`useGameLoop`, `GameLoopStep`, `GameLoopOptions`, and the `frame.ts` helpers
(`MAX_DT`, `clampDt`, `clamp`, `lerp`, `approach`, `wrap`) are re-exported from
the `@/sdk` barrel under its "Motion" section, alongside the pre-existing
`useTilt` [@sdk-barrel]. Like every other SDK export, a game reaches this
subsystem only through `@/sdk`, never by importing `src/sdk/motion/*`
directly — see [SDK boundary](../concepts/sdk-boundary) for the rule and
[SDK public API](../reference/sdk-public-api) for the full export list.

Building this subsystem added two native dependencies, `react-native-reanimated`
and `react-native-worklets`, plus a new `babel.config.js` whose only plugin is
`react-native-worklets/plugin`, documented as needing to stay last in the
plugin list because it compiles every `'worklet'`-tagged function so it can run
off the JS thread [@babel-config] [@package-json]. Unlike a pure-JS SDK change,
picking up this dependency in a running app requires whatever this repo's
normal native build path already produces — see
[Release an Android build](../guides/release-an-android-build) and
[Release an iOS build](../guides/release-an-ios-build) — rather than a
Metro-only reload.
