# Guided Flow Mode — Design

**Date:** 2026-06-20
**Status:** Approved (design); ready for implementation planning

## 1. Purpose

Introduce a second, parent-controlled way to use the app: a **guided flow** in which a
sequence of small learning activities ("flow-units") drawn from different games is played
back-to-back as one continuous, seamless experience. It complements the existing **free-play**
mode (the game grid), which is unchanged.

Goals:

- A flow-unit from one game is followed by a flow-unit from another, organized around a shared
  **learning topic** (e.g. the number "four").
- Transitions between units are **unseen** — the kid experiences one continuous world. This is
  achieved with a **truly continuous shared canvas**: units render into one shared coordinate
  space and individual elements ("actors") physically morph from one unit's layout into the next.
- Guided mode is for **learning, not scoring** — a non-blaming environment. Scoring is off by
  default (config flag).
- Parents control which mode is active and which topics are included, via Settings.
- Progress is saved so a child can **resume by topic** later.
- Guided mode runs **landscape** (better for the shared wide backdrop and small fingers); the rest
  of the app stays portrait.

Non-goals for v1 (see §10): parent gate, adaptive sequencing, topic-pool shuffle, converting every
existing game to flow-units.

## 2. Key decisions (locked during brainstorming)

| Decision | Choice |
| --- | --- |
| Transition fidelity | **Truly continuous shared canvas** — shared actors morph A→B |
| Unit authoring | **Flow-native units on a shared actor/scene system** (existing full games untouched) |
| Curriculum model | **Authored topic curriculum** — ordered `Topic[]` → ordered `unitIds`; resume = `{topicId, unitIndex}` |
| Home entry | **Parent-selected single mode** — child sees only the active mode |
| Default mode | **free** (today's behavior preserved; guided is opt-in by a parent) |
| Parent gate | **None for now** — Settings stays fully open (gate is future work) |
| Scoring in guided | **Off by default** (`flowScoring` flag) |
| Orientation | **Landscape locked in guided mode only** |
| v1 showcase | **Engine + one topic ("Four")** with two units (count-and-pop + shape-detective) that visibly morph shared actors |

## 3. Why these two games are the showcase

`count-and-pop` and `shape-detective` both already separate a **pure domain layer**
(`types.ts`, `utils/generate.ts`, `utils/levels.ts` — no React/UI) from their UI components and
their `useLevels`-based host. Flow-units reuse those **same domain generators** while rendering
through the shared actor system, so we are not re-deriving any learning logic.

They also share a natural visual bridge: count-and-pop counts objects, shape-detective inspects
shapes — so the same **4 star-sprites** can be counted in one unit and then morph into a shape
puzzle in the next. That is the cross-game morph that proves the whole pipeline.

The two games remain **registered, whole, and playable** in free-play exactly as today.

## 4. Architecture

New flow engine under `src/sdk/flow/`, exported from `@/sdk`, plus a `FlowPlayerScreen`.

```
src/sdk/flow/
  actors.ts        Actor model + helpers
  curriculum.ts    Topic[] / FlowUnit registry + types
  transition.ts    diff exitActors(A) vs enterActors(B) → tween plan for shared ids
  ActorLayer.tsx   renders the shared actor pool; owns position/scale/rotation/opacity tweens
  SceneCanvas.tsx  persistent oversized backdrop + ActorLayer host (does not unmount mid-flow)
  useFlow.ts       drives curriculum position, advance, resume persistence
  progress.ts      flow progress store (kg:flow:progress)
  index.ts         barrel for the above
src/screens/FlowPlayerScreen.tsx   landscape-locked host: SceneCanvas + active unit's Component
```

**Rendering model.** `SceneCanvas` mounts once when guided mode is entered and stays mounted for
the whole session. It renders (a) a backdrop sized larger than the viewport (so actors can travel
in/out of frame), and (b) an `ActorLayer`. The active `FlowUnit.Component` renders its
*interaction* (taps, choices, drag) but the visible objects are **actors owned by the ActorLayer**,
not by the unit. Swapping units does not unmount the canvas or the actors — only the active unit's
interaction component changes.

## 5. The `FlowUnit` contract (core abstraction)

```ts
// Actor: a shared sprite the ActorLayer owns and tweens.
type Actor = {
  id: string;            // stable across units so the transition can match A.exit → B.enter
  kind: 'emoji' | 'shape';
  payload: EmojiActor | ShapeActor;   // what to render (emoji glyph, or Shape {kind,color,size})
  x: number; y: number;  // position in canvas coordinates (LTR-pinned, see §8)
  scale: number;
  rotation: number;
  opacity: number;
};

type FlowUnitContext = {
  // viewport metrics + a seeded RNG so units lay actors out deterministically per session
  width: number; height: number;
  rng: () => number;
};

type FlowUnitProps = {
  actors: Actor[];          // the live actor handles for this unit
  onComplete: () => void;   // kid succeeded → engine advances (no score side-effect)
};

type FlowUnit = {
  id: string;
  topicId: string;
  enterActors: (ctx: FlowUnitContext) => Actor[];  // actors + layout when this unit appears
  exitActors:  (ctx: FlowUnitContext) => Actor[];  // final layout handed to next unit's transition
  Component: ComponentType<FlowUnitProps>;         // interaction; renders via shared ActorLayer
};
```

**Transition mechanic.** When advancing from unit A to unit B, `transition.ts` diffs
`A.exitActors()` against `B.enterActors()` by actor `id`:

- **matched id** → the existing sprite tweens (position/scale/rotation/payload) from A's layout to
  B's layout. This is "the balloon becomes the counting object", generalized.
- **only in A** → fades/flies out.
- **only in B** → fades/flies in.

The tween runs on the `ActorLayer` using RN `Animated` (native driver where possible), consistent
with the existing games' animation approach (no Reanimated dependency added).

## 6. Showcase content — Topic "Four"

Two flow-native units sharing **4 star-sprites** (`kind:'shape'`, star), built on the existing
domain generators:

- **Unit A — `four-count`** (reuses `count-and-pop` domain): the kid pops/counts to reveal **4**
  stars (a `countThisMany`/`howMany`-style interaction driven by the count-and-pop generator).
  Ends with the 4 stars settled in a row → `exitActors`.
- **morph** → the 4 star actors glide/regroup into the next layout; no screen swap, no unmount.
- **Unit B — `four-shapes`** (reuses `shape-detective` domain): the same 4 stars become an
  odd-one-out / pattern puzzle ("which one is different?"), driven by the shape-detective generator.

Completing Unit B completes Topic "Four". With only one topic in v1, the flow then shows a gentle
"all caught up" rest state (see §7).

## 7. Curriculum, progress & resume

- `curriculum.ts` holds an authored, ordered `Topic[]`. Each `Topic = { id, unitIds: string[] }`.
  Units are looked up from a flow-unit registry by id.
- Progress store key `kg:flow:progress`, value `{ topicId: string, unitIndex: number, updatedAt: number }`.
  **No score field** — guided mode is scoreless by design.
- On entering guided mode: read saved progress and jump to `{topicId, unitIndex}` (default: first
  topic, first unit). Completing a unit advances `unitIndex`; finishing a topic's last unit advances
  to the next topic's first unit.
- Finishing the final topic shows a calm **rest state** ("You're all caught up 🌟") rather than a
  win/score screen, reinforcing the non-blaming intent. Re-entering resumes at the rest state until
  a parent adds topics or resets.
- A parent reset path (Settings) clears `kg:flow:progress` back to the first topic.

## 8. Orientation, i18n, RTL

- `FlowPlayerScreen` locks **landscape** on mount and restores **portrait** on unmount — same
  pattern as `src/sdk/orientation/useFreeOrientation.ts`, but landscape. Only guided mode is
  affected; free-play and all other screens remain portrait.
- The `SceneCanvas` backdrop is intentionally larger than the viewport so actors can enter/exit
  frame during morphs.
- **No hardcoded user-facing strings.** All unit/chrome text goes through `t()`. New strings live
  under a `flow` section in the core locales (`src/sdk/i18n/locales/{en,ar}.ts`) plus, if a unit
  needs its own copy, the unit registers translations the same way games do. Add new keys to the
  i18n key guard test.
- **RTL:** actor coordinate math assumes a left origin, so the `ActorLayer` is pinned with
  `direction: 'ltr'` (per the project RTL rules); directional chrome glyphs flip via
  `I18nManager.isRTL`. Numbers use Western digits.

## 9. Settings (parent control, ungated)

Extend `Settings` (`src/sdk/settings/store.ts`):

```ts
type Settings = {
  // ...existing: soundEnabled, hapticsEnabled, ageBand, language
  mode: 'free' | 'guided';        // default 'free'
  flowTopicIds: string[] | null;  // active topics; null = all topics
  flowScoring: boolean;           // default false (scoreless)
};
```

- `DEFAULT_SETTINGS` adds `mode:'free'`, `flowTopicIds:null`, `flowScoring:false`. Existing stored
  settings without these keys fall back to defaults (backward compatible).
- `SettingsScreen` gains a **"Guided mode"** section: a mode switch, a topic checklist (drives
  `flowTopicIds`), and a "Reset journey progress" action. Ungated for now.
- `HomeScreen` reads `mode`:
  - `free` → today's `GameCard` grid (unchanged).
  - `guided` → only a "Continue your journey" entry that navigates to `FlowPlayer`.
- `RootStackParamList` gains a `FlowPlayer` route; `RootNavigator` registers `FlowPlayerScreen`.

## 10. Out of scope (v1) / future work

- **Parent gate** (child-lock on parent controls) — Settings stays open for now.
- **Adaptive sequencing** and **topic-pool shuffle** — curriculum is fixed/authored.
- **Converting other games** to flow-units — only count-and-pop + shape-detective are wired.
- **More topics** beyond "Four" — the engine supports them; content comes later.
- Cross-game morph between actors of *different kinds* (emoji↔shape) beyond what the "Four" topic
  needs.

## 11. Testing strategy

- **Pure logic, unit-tested (no RN):**
  - `transition.ts` actor-diff: matched/added/removed id sets and resulting tween plan.
  - `curriculum.ts` + `useFlow` advance/resume: advancing within a topic, rolling to the next
    topic, reaching the rest state, and resuming from saved `{topicId, unitIndex}`.
  - `progress.ts` store round-trips and the scoreless invariant (no score persisted).
  - Reuse of count-and-pop / shape-detective generators by the two units (deterministic with a
    fixed seed), mirroring those games' existing generator tests.
- **i18n guard:** every new `flow` key resolves (≠ raw key) in en + ar (existing keys test).
- **Settings backward-compat:** loading a pre-existing settings blob yields the new defaults.
- Manual/visual check of the morph and landscape lock on device (animation feel is not unit-tested).

## 12. Risks & mitigations

- **Morph realism is the hard part.** Mitigated by the shared-actor model (the sprite is literally
  the same entity across units, not a decoy) and by keeping the showcase to one actor kind (stars).
- **Scope creep into "make every game flow-ready".** Mitigated by the FlowUnit contract isolating
  the engine from games; existing games are untouched and only their pure domain layers are reused.
- **Landscape + RTL coordinate bugs.** Mitigated by the `direction:'ltr'` pin and unit tests on the
  pure transition/layout math.
```
