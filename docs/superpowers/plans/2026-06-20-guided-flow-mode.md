# Guided Flow Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a parent-controlled "guided flow" mode that plays a sequence of small learning units from different games back-to-back on one continuous shared canvas, with elements (actors) morphing seamlessly between units.

**Architecture:** A new flow **engine** lives in `src/sdk/flow/` (pure actor/transition/curriculum/progress logic + an `ActorLayer`/`SceneCanvas` rendering host + a `useFlow` hook). Authored **content** lives in `src/flow/` (two showcase units that reuse the pure domain generators of `count-and-pop` and `shape-detective`, plus the "Four" topic registration). A landscape-locked `FlowPlayerScreen` composes them. Existing games are untouched and remain fully playable in free-play.

**Tech Stack:** Expo SDK 54, React 19, React Native 0.81, TypeScript strict, Jest (`jest-expo`), RN `Animated` (no Reanimated), `expo-screen-orientation`, `@react-native-async-storage/async-storage` (via `createStore`).

## Global Constraints

- **One import surface:** all engine code is exported from `@/sdk`; content imports from `@/sdk` (and, for reuse, from specific game domain layers under `@/games/<id>/...`). Never import a game's React UI into `src/sdk`.
- **No hardcoded user-facing strings.** Every label/instruction/`accessibilityLabel` goes through `t()`. Keep emoji and asset-intent strings literal. New core strings live under the `flow` section of `src/sdk/i18n/locales/{en,ts → en,ar}.ts`; add every new key to `src/sdk/i18n/__tests__/keys.test.ts`.
- **RTL:** the `ActorLayer` is pinned `direction: 'ltr'` (actor coordinate math assumes a left origin). Western digits for numbers.
- **Design system only:** use `COLORS`/`ACCENTS`, `FONTS`, `SHADOWS`, `SPACING`, `BORDER_RADIUS` tokens; no raw hex, no system fonts, no inline shadow objects.
- **Scoreless:** guided mode persists no score. `flowScoring` defaults `false` and is not wired to any score HUD in v1.
- **Default mode is `free`** — existing behavior is preserved; guided is opt-in via Settings.
- **Path alias:** `@/sdk` → `src/sdk/index.ts`; `@/*` → `src/*`.
- **Test command:** `npx jest <path>` (project script is `jest`). Tests run with `--legacy-peer-deps` already installed; no install needed.
- **Commits:** brief, no co-authored trailer (per repo convention). Do not push.

---

## File Structure

**Engine — `src/sdk/flow/` (pure + RN host, no game imports):**
- `actors.ts` — `Actor` type, `makeActor`, `rowLayout` (pure).
- `transition.ts` — `TransitionPlan`, `planTransition` (pure diff by id).
- `curriculum.ts` — `FlowUnit`/`Topic`/`FlowUnitContext`/`FlowUnitProps` types + unit/topic registry + `activeTopics` (pure-ish).
- `progress.ts` — `FlowProgress`, `createFlowProgressStore`, `DEFAULT_FLOW_PROGRESS`, `resolveStart`, `advancePosition` (pure resolvers + thin store).
- `useFlow.ts` — hook driving position + persistence.
- `ActorLayer.tsx` — renders + animates the shared actor pool from a `planTransition` diff.
- `SceneCanvas.tsx` — persistent oversized backdrop hosting `ActorLayer` + unit overlay.
- `index.ts` — barrel re-exported from `@/sdk`.

**Content — `src/flow/` (app-level; may import games):**
- `units/StarSprite.tsx` — shared star visual (reuses `shape-detective` `ShapeView`).
- `units/fourCount.tsx` — Unit A; reuses `count-and-pop` domain (`buildCountThisMany`).
- `units/fourShapes.tsx` — Unit B; reuses `shape-detective` domain (`buildOddOneOutPuzzle`).
- `curriculum.ts` — registers both units + the "Four" topic (side-effect).
- `index.ts` — `import './curriculum'` side-effect (mirrors `src/games/index.ts`).

**Wiring:**
- `src/sdk/settings/store.ts` — extend `Settings` + `DEFAULT_SETTINGS`.
- `src/types/index.ts` — add `FlowPlayer` route.
- `src/app/navigation/RootNavigator.tsx` — register `FlowPlayerScreen`.
- `src/screens/FlowPlayerScreen.tsx` — landscape host.
- `src/screens/index.ts` — export it.
- `src/screens/HomeScreen.tsx` — branch on `settings.mode`.
- `src/screens/SettingsScreen.tsx` — "Guided mode" section.
- `App.tsx` — add `import './src/flow';` side-effect.
- `src/sdk/i18n/locales/en.ts` + `ar.ts` — `flow` section.
- `src/sdk/i18n/__tests__/keys.test.ts` — new keys.
- `src/sdk/index.ts` — export `./flow`.

---

### Task 1: Extend Settings for mode/topics/scoring

**Files:**
- Modify: `src/sdk/settings/store.ts`
- Test: `src/sdk/settings/__tests__/store.test.ts` (create)

**Interfaces:**
- Produces: `Settings` now includes `mode: 'free' | 'guided'`, `flowTopicIds: string[] | null`, `flowScoring: boolean`; `DEFAULT_SETTINGS` sets `mode:'free'`, `flowTopicIds:null`, `flowScoring:false`.

- [ ] **Step 1: Write the failing test**

```ts
// src/sdk/settings/__tests__/store.test.ts
import { DEFAULT_SETTINGS } from '../store';

describe('settings defaults', () => {
  it('defaults to free mode, all topics, scoreless', () => {
    expect(DEFAULT_SETTINGS.mode).toBe('free');
    expect(DEFAULT_SETTINGS.flowTopicIds).toBeNull();
    expect(DEFAULT_SETTINGS.flowScoring).toBe(false);
  });

  it('keeps existing audio/lang defaults intact', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.hapticsEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.language).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/settings/__tests__/store.test.ts`
Expected: FAIL — `mode` is `undefined`.

- [ ] **Step 3: Implement**

In `src/sdk/settings/store.ts`, add the three fields to the `Settings` type and `DEFAULT_SETTINGS`:

```ts
export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
  /** Selected app language code (e.g. 'en', 'ar'). Null = follow device on first boot. */
  language: string | null;
  /** Active app mode. 'free' = game grid (default); 'guided' = the learning journey. */
  mode: 'free' | 'guided';
  /** Topic ids included in the guided journey; null = all authored topics. */
  flowTopicIds: string[] | null;
  /** Whether guided mode tracks score. Default false (non-blaming, learning-first). */
  flowScoring: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
  language: null,
  mode: 'free',
  flowTopicIds: null,
  flowScoring: false,
};
```

Note: `useSettings().update` already spreads `{ ...(await settingsStore.get()), ...patch }`, and `createStore.get()` returns `DEFAULT_SETTINGS` whole when nothing is stored, so a pre-existing stored blob without these keys is read back through `DEFAULT_SETTINGS` merge on the next `update`. No migration code needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/settings/__tests__/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/settings/store.ts src/sdk/settings/__tests__/store.test.ts
git commit -m "feat(flow): add mode/flowTopicIds/flowScoring to settings"
```

---

### Task 2: Actor model + layout helper

**Files:**
- Create: `src/sdk/flow/actors.ts`
- Test: `src/sdk/flow/__tests__/actors.test.ts`

**Interfaces:**
- Produces:
  - `type Actor = { id: string; x: number; y: number; scale: number; rotation: number; opacity: number; content: ReactNode }`
  - `function makeActor(input: { id: string; x: number; y: number; content: ReactNode; scale?: number; rotation?: number; opacity?: number }): Actor`
  - `function rowLayout(count: number, opts: { cx: number; cy: number; gap: number }): { x: number; y: number }[]` — centered horizontal row of `count` points around `(cx, cy)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/sdk/flow/__tests__/actors.test.ts
import { makeActor, rowLayout } from '../actors';

describe('makeActor', () => {
  it('applies geometry defaults', () => {
    const a = makeActor({ id: 's1', x: 10, y: 20, content: null });
    expect(a).toMatchObject({ id: 's1', x: 10, y: 20, scale: 1, rotation: 0, opacity: 1 });
  });
  it('honors overrides', () => {
    const a = makeActor({ id: 's1', x: 0, y: 0, content: null, scale: 2, opacity: 0.5 });
    expect(a.scale).toBe(2);
    expect(a.opacity).toBe(0.5);
  });
});

describe('rowLayout', () => {
  it('centers a single point on cx', () => {
    expect(rowLayout(1, { cx: 100, cy: 50, gap: 80 })).toEqual([{ x: 100, y: 50 }]);
  });
  it('spaces points symmetrically around cx', () => {
    const pts = rowLayout(2, { cx: 100, cy: 50, gap: 80 });
    expect(pts).toEqual([{ x: 60, y: 50 }, { x: 140, y: 50 }]);
  });
  it('keeps all points on the same y', () => {
    const pts = rowLayout(4, { cx: 200, cy: 30, gap: 50 });
    expect(pts.every((p) => p.y === 30)).toBe(true);
    expect(pts).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/flow/__tests__/actors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/sdk/flow/actors.ts
import type { ReactNode } from 'react';

/** A shared sprite the ActorLayer owns and tweens. `content` is the rendered visual. */
export type Actor = {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number; // degrees
  opacity: number;
  content: ReactNode;
};

export function makeActor(input: {
  id: string;
  x: number;
  y: number;
  content: ReactNode;
  scale?: number;
  rotation?: number;
  opacity?: number;
}): Actor {
  return {
    id: input.id,
    x: input.x,
    y: input.y,
    content: input.content,
    scale: input.scale ?? 1,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
  };
}

/** Centered horizontal row of `count` points around (cx, cy), spaced by `gap`. */
export function rowLayout(
  count: number,
  opts: { cx: number; cy: number; gap: number },
): { x: number; y: number }[] {
  const { cx, cy, gap } = opts;
  const offset = ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: cx - offset + i * gap,
    y: cy,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/flow/__tests__/actors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/actors.ts src/sdk/flow/__tests__/actors.test.ts
git commit -m "feat(flow): actor model + rowLayout helper"
```

---

### Task 3: Transition diff (planTransition)

**Files:**
- Create: `src/sdk/flow/transition.ts`
- Test: `src/sdk/flow/__tests__/transition.test.ts`

**Interfaces:**
- Consumes: `Actor` from `./actors`.
- Produces:
  - `type Geometry = { x: number; y: number; scale: number; rotation: number; opacity: number }`
  - `type TransitionPlan = { matched: { id: string; from: Geometry; to: Geometry; content: ReactNode }[]; entering: Actor[]; leaving: Actor[] }`
  - `function planTransition(from: Actor[], to: Actor[]): TransitionPlan` — diff by `id`. `matched` carries the **target** `content` (new unit wins). `entering` are ids only in `to`; `leaving` are ids only in `from`.

- [ ] **Step 1: Write the failing test**

```ts
// src/sdk/flow/__tests__/transition.test.ts
import { makeActor } from '../actors';
import { planTransition } from '../transition';

const A = (id: string, x: number) => makeActor({ id, x, y: 0, content: id });

describe('planTransition', () => {
  it('matches shared ids and keeps from/to geometry', () => {
    const plan = planTransition([A('s1', 0)], [A('s1', 100)]);
    expect(plan.matched).toHaveLength(1);
    expect(plan.matched[0].from.x).toBe(0);
    expect(plan.matched[0].to.x).toBe(100);
    expect(plan.entering).toHaveLength(0);
    expect(plan.leaving).toHaveLength(0);
  });
  it('classifies entering and leaving ids', () => {
    const plan = planTransition([A('s1', 0), A('s2', 0)], [A('s2', 0), A('s3', 0)]);
    expect(plan.matched.map((m) => m.id)).toEqual(['s2']);
    expect(plan.entering.map((a) => a.id)).toEqual(['s3']);
    expect(plan.leaving.map((a) => a.id)).toEqual(['s1']);
  });
  it('takes content from the target on match', () => {
    const plan = planTransition(
      [makeActor({ id: 's1', x: 0, y: 0, content: 'old' })],
      [makeActor({ id: 's1', x: 0, y: 0, content: 'new' })],
    );
    expect(plan.matched[0].content).toBe('new');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/flow/__tests__/transition.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/sdk/flow/transition.ts
import type { ReactNode } from 'react';
import type { Actor } from './actors';

export type Geometry = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
};

export type TransitionPlan = {
  matched: { id: string; from: Geometry; to: Geometry; content: ReactNode }[];
  entering: Actor[];
  leaving: Actor[];
};

function geom(a: Actor): Geometry {
  return { x: a.x, y: a.y, scale: a.scale, rotation: a.rotation, opacity: a.opacity };
}

/** Diff two actor sets by id to drive the morph. Target content wins on a match. */
export function planTransition(from: Actor[], to: Actor[]): TransitionPlan {
  const fromById = new Map(from.map((a) => [a.id, a]));
  const toById = new Map(to.map((a) => [a.id, a]));

  const matched: TransitionPlan['matched'] = [];
  for (const t of to) {
    const f = fromById.get(t.id);
    if (f) matched.push({ id: t.id, from: geom(f), to: geom(t), content: t.content });
  }
  const entering = to.filter((a) => !fromById.has(a.id));
  const leaving = from.filter((a) => !toById.has(a.id));
  return { matched, entering, leaving };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/flow/__tests__/transition.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/transition.ts src/sdk/flow/__tests__/transition.test.ts
git commit -m "feat(flow): planTransition actor diff"
```

---

### Task 4: Curriculum types + unit/topic registry

**Files:**
- Create: `src/sdk/flow/curriculum.ts`
- Test: `src/sdk/flow/__tests__/curriculum.test.ts`

**Interfaces:**
- Consumes: `Actor` from `./actors`.
- Produces:
  - `type FlowUnitContext = { width: number; height: number; rng: () => number }`
  - `type FlowUnitProps = { actors: Actor[]; onComplete: () => void }`
  - `type FlowUnit = { id: string; topicId: string; enterActors: (ctx: FlowUnitContext) => Actor[]; exitActors: (ctx: FlowUnitContext) => Actor[]; Component: ComponentType<FlowUnitProps> }`
  - `type Topic = { id: string; unitIds: string[] }`
  - `registerFlowUnit(unit: FlowUnit): void`, `getFlowUnit(id: string): FlowUnit | undefined`
  - `registerTopic(topic: Topic): void`, `getAllTopics(): Topic[]` (insertion order)
  - `function activeTopics(all: Topic[], flowTopicIds: string[] | null): Topic[]` — `null` → all; otherwise filter+preserve authored order; unknown ids ignored.
  - `resetFlowRegistryForTests(): void` (test-only helper).

- [ ] **Step 1: Write the failing test**

```ts
// src/sdk/flow/__tests__/curriculum.test.ts
import {
  registerFlowUnit, getFlowUnit, registerTopic, getAllTopics,
  activeTopics, resetFlowRegistryForTests, type FlowUnit, type Topic,
} from '../curriculum';

const stubUnit = (id: string, topicId: string): FlowUnit => ({
  id, topicId,
  enterActors: () => [],
  exitActors: () => [],
  Component: () => null,
});

beforeEach(() => resetFlowRegistryForTests());

describe('flow registry', () => {
  it('registers and retrieves units', () => {
    registerFlowUnit(stubUnit('u1', 't1'));
    expect(getFlowUnit('u1')?.topicId).toBe('t1');
    expect(getFlowUnit('nope')).toBeUndefined();
  });
  it('keeps topics in insertion order', () => {
    registerTopic({ id: 'a', unitIds: ['u1'] });
    registerTopic({ id: 'b', unitIds: ['u2'] });
    expect(getAllTopics().map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('activeTopics', () => {
  const all: Topic[] = [{ id: 'a', unitIds: [] }, { id: 'b', unitIds: [] }];
  it('returns all when filter is null', () => {
    expect(activeTopics(all, null)).toEqual(all);
  });
  it('filters and preserves authored order', () => {
    expect(activeTopics(all, ['b']).map((t) => t.id)).toEqual(['b']);
  });
  it('ignores unknown ids', () => {
    expect(activeTopics(all, ['x', 'a']).map((t) => t.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/flow/__tests__/curriculum.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/sdk/flow/curriculum.ts
import type { ComponentType } from 'react';
import type { Actor } from './actors';

export type FlowUnitContext = { width: number; height: number; rng: () => number };
export type FlowUnitProps = { actors: Actor[]; onComplete: () => void };

export type FlowUnit = {
  id: string;
  topicId: string;
  enterActors: (ctx: FlowUnitContext) => Actor[];
  exitActors: (ctx: FlowUnitContext) => Actor[];
  Component: ComponentType<FlowUnitProps>;
};

export type Topic = { id: string; unitIds: string[] };

const units = new Map<string, FlowUnit>();
const topics: Topic[] = [];

export function registerFlowUnit(unit: FlowUnit): void {
  units.set(unit.id, unit);
}
export function getFlowUnit(id: string): FlowUnit | undefined {
  return units.get(id);
}
export function registerTopic(topic: Topic): void {
  if (!topics.some((t) => t.id === topic.id)) topics.push(topic);
}
export function getAllTopics(): Topic[] {
  return [...topics];
}

/** null → every authored topic; otherwise the listed ids in authored order. */
export function activeTopics(all: Topic[], flowTopicIds: string[] | null): Topic[] {
  if (flowTopicIds == null) return all;
  const wanted = new Set(flowTopicIds);
  return all.filter((t) => wanted.has(t.id));
}

/** Test-only: clear the module-level registry between tests. */
export function resetFlowRegistryForTests(): void {
  units.clear();
  topics.length = 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/flow/__tests__/curriculum.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/curriculum.ts src/sdk/flow/__tests__/curriculum.test.ts
git commit -m "feat(flow): curriculum types + unit/topic registry"
```

---

### Task 5: Flow progress store + position resolvers

**Files:**
- Create: `src/sdk/flow/progress.ts`
- Test: `src/sdk/flow/__tests__/progress.test.ts`

**Interfaces:**
- Consumes: `createStore` from `@/sdk/storage/createStore`; `Topic` from `./curriculum`.
- Produces:
  - `type FlowProgress = { topicId: string; unitIndex: number; updatedAt: number }`
  - `const DEFAULT_FLOW_PROGRESS: FlowProgress = { topicId: '', unitIndex: 0, updatedAt: 0 }`
  - `function createFlowProgressStore(): Store<FlowProgress>` — key `kg:flow:progress`.
  - `type FlowPosition = { done: false; topicId: string; unitIndex: number } | { done: true }`
  - `function resolveStart(topics: Topic[], saved: FlowProgress): FlowPosition` — empty topics → `{done:true}`; unknown/empty saved → first topic, index 0; known topic → clamp `unitIndex` into range.
  - `function advancePosition(topics: Topic[], pos: { topicId: string; unitIndex: number }): FlowPosition` — next unit in topic; else first unit of next topic; else `{done:true}`.

- [ ] **Step 1: Write the failing test**

```ts
// src/sdk/flow/__tests__/progress.test.ts
import { resolveStart, advancePosition, DEFAULT_FLOW_PROGRESS, type FlowProgress } from '../progress';
import type { Topic } from '../curriculum';

const topics: Topic[] = [
  { id: 't1', unitIds: ['a', 'b'] },
  { id: 't2', unitIds: ['c'] },
];

describe('resolveStart', () => {
  it('returns done when there are no topics', () => {
    expect(resolveStart([], DEFAULT_FLOW_PROGRESS)).toEqual({ done: true });
  });
  it('starts at first topic when nothing saved', () => {
    expect(resolveStart(topics, DEFAULT_FLOW_PROGRESS)).toEqual({ done: false, topicId: 't1', unitIndex: 0 });
  });
  it('resumes a saved valid position', () => {
    const saved: FlowProgress = { topicId: 't1', unitIndex: 1, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't1', unitIndex: 1 });
  });
  it('clamps an out-of-range saved index', () => {
    const saved: FlowProgress = { topicId: 't2', unitIndex: 9, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't2', unitIndex: 0 });
  });
  it('falls back to first topic when saved topic is gone', () => {
    const saved: FlowProgress = { topicId: 'ghost', unitIndex: 0, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't1', unitIndex: 0 });
  });
});

describe('advancePosition', () => {
  it('advances within a topic', () => {
    expect(advancePosition(topics, { topicId: 't1', unitIndex: 0 })).toEqual({ done: false, topicId: 't1', unitIndex: 1 });
  });
  it('rolls into the next topic', () => {
    expect(advancePosition(topics, { topicId: 't1', unitIndex: 1 })).toEqual({ done: false, topicId: 't2', unitIndex: 0 });
  });
  it('returns done after the last unit of the last topic', () => {
    expect(advancePosition(topics, { topicId: 't2', unitIndex: 0 })).toEqual({ done: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/flow/__tests__/progress.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/sdk/flow/progress.ts
import { createStore, type Store } from '@/sdk/storage/createStore';
import type { Topic } from './curriculum';

export type FlowProgress = { topicId: string; unitIndex: number; updatedAt: number };

/** topicId '' + updatedAt 0 is the "never started" sentinel. */
export const DEFAULT_FLOW_PROGRESS: FlowProgress = { topicId: '', unitIndex: 0, updatedAt: 0 };

/** Single guided-journey checkpoint. Key becomes kg:flow:progress. */
export function createFlowProgressStore(): Store<FlowProgress> {
  return createStore<FlowProgress>('flow:progress', DEFAULT_FLOW_PROGRESS);
}

export type FlowPosition =
  | { done: false; topicId: string; unitIndex: number }
  | { done: true };

export function resolveStart(topics: Topic[], saved: FlowProgress): FlowPosition {
  if (topics.length === 0) return { done: true };
  const topic = topics.find((t) => t.id === saved.topicId);
  if (!topic) return { done: false, topicId: topics[0].id, unitIndex: 0 };
  const unitIndex = saved.unitIndex >= 0 && saved.unitIndex < topic.unitIds.length ? saved.unitIndex : 0;
  return { done: false, topicId: topic.id, unitIndex };
}

export function advancePosition(
  topics: Topic[],
  pos: { topicId: string; unitIndex: number },
): FlowPosition {
  const ti = topics.findIndex((t) => t.id === pos.topicId);
  if (ti < 0) return { done: true };
  const topic = topics[ti];
  if (pos.unitIndex + 1 < topic.unitIds.length) {
    return { done: false, topicId: topic.id, unitIndex: pos.unitIndex + 1 };
  }
  if (ti + 1 < topics.length) {
    return { done: false, topicId: topics[ti + 1].id, unitIndex: 0 };
  }
  return { done: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/flow/__tests__/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/progress.ts src/sdk/flow/__tests__/progress.test.ts
git commit -m "feat(flow): progress store + resolveStart/advancePosition"
```

---

### Task 6: useFlow hook

**Files:**
- Create: `src/sdk/flow/useFlow.ts`
- Test: `src/sdk/flow/__tests__/useFlow.test.ts`

**Interfaces:**
- Consumes: `Topic`, `getFlowUnit` from `./curriculum`; `FlowUnit` type; `createFlowProgressStore`, `resolveStart`, `advancePosition`, `FlowPosition` from `./progress`.
- Produces:
  - `type UseFlowResult = { status: 'loading' | 'playing' | 'done'; topicId: string | null; unitIndex: number; unit: FlowUnit | null; advance: () => void; reset: () => void }`
  - `function useFlow(args: { topics: Topic[] }): UseFlowResult`

Behavior: on mount, load saved progress, `resolveStart` → set status. `advance()` computes `advancePosition` from the live position, persists it (or persists the first topic with `done`→ status 'done'), and updates state. `reset()` persists `{ topicId: firstTopic, unitIndex: 0 }` and resumes playing. `unit` = `getFlowUnit(topic.unitIds[unitIndex])`.

- [ ] **Step 1: Write the failing test**

This test renders the hook with React Testing renderer via `react-test-renderer` (already available through `jest-expo`). It registers stub units/topics and drives `advance`.

```ts
// src/sdk/flow/__tests__/useFlow.test.ts
import { act, create } from 'react-test-renderer';
import { useEffect } from 'react';
import { useFlow, type UseFlowResult } from '../useFlow';
import {
  registerFlowUnit, registerTopic, resetFlowRegistryForTests, getAllTopics,
} from '../curriculum';
import { createFlowProgressStore, DEFAULT_FLOW_PROGRESS } from '../progress';

// Probe component: surfaces the hook result to the test via a ref callback.
function Probe({ onResult }: { onResult: (r: UseFlowResult) => void }) {
  const r = useFlow({ topics: getAllTopics() });
  useEffect(() => { onResult(r); });
  return null;
}

const stub = (id: string, topicId: string) => ({
  id, topicId, enterActors: () => [], exitActors: () => [], Component: () => null,
});

beforeEach(async () => {
  resetFlowRegistryForTests();
  await createFlowProgressStore().set(DEFAULT_FLOW_PROGRESS);
  registerFlowUnit(stub('a', 't1'));
  registerFlowUnit(stub('b', 't1'));
  registerTopic({ id: 't1', unitIds: ['a', 'b'] });
});

it('starts playing on the first unit then advances to done', async () => {
  let latest: UseFlowResult | null = null;
  await act(async () => {
    create(<Probe onResult={(r) => { latest = r; }} />);
  });
  // settle the async load
  await act(async () => { await Promise.resolve(); });
  expect(latest!.status).toBe('playing');
  expect(latest!.unit?.id).toBe('a');

  await act(async () => { latest!.advance(); });
  expect(latest!.unit?.id).toBe('b');

  await act(async () => { latest!.advance(); });
  expect(latest!.status).toBe('done');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/flow/__tests__/useFlow.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/sdk/flow/useFlow.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlowUnit, Topic } from './curriculum';
import { getFlowUnit } from './curriculum';
import {
  createFlowProgressStore, resolveStart, advancePosition,
  type FlowPosition, type FlowProgress,
} from './progress';

export type UseFlowResult = {
  status: 'loading' | 'playing' | 'done';
  topicId: string | null;
  unitIndex: number;
  unit: FlowUnit | null;
  advance: () => void;
  reset: () => void;
};

export function useFlow(args: { topics: Topic[] }): UseFlowResult {
  const { topics } = args;
  const store = useMemo(() => createFlowProgressStore(), []);
  const [position, setPosition] = useState<FlowPosition | null>(null); // null = loading
  const topicsRef = useRef(topics);
  topicsRef.current = topics;

  useEffect(() => {
    let mounted = true;
    store.get().then((saved) => {
      if (mounted) setPosition(resolveStart(topicsRef.current, saved));
    });
    return () => { mounted = false; };
  }, [store]);

  const persist = useCallback(
    (pos: FlowPosition) => {
      if (pos.done) return; // 'done' keeps the last in-topic checkpoint; nothing new to save
      const next: FlowProgress = { topicId: pos.topicId, unitIndex: pos.unitIndex, updatedAt: Date.now() };
      store.set(next);
    },
    [store],
  );

  const advance = useCallback(() => {
    setPosition((cur) => {
      if (!cur || cur.done) return cur;
      const next = advancePosition(topicsRef.current, cur);
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const first = topicsRef.current[0];
    const pos: FlowPosition = first
      ? { done: false, topicId: first.id, unitIndex: 0 }
      : { done: true };
    persist(pos);
    setPosition(pos);
  }, [persist]);

  if (position == null) {
    return { status: 'loading', topicId: null, unitIndex: 0, unit: null, advance, reset };
  }
  if (position.done) {
    return { status: 'done', topicId: null, unitIndex: 0, unit: null, advance, reset };
  }
  const topic = topics.find((t) => t.id === position.topicId);
  const unit = topic ? getFlowUnit(topic.unitIds[position.unitIndex]) ?? null : null;
  return {
    status: 'playing',
    topicId: position.topicId,
    unitIndex: position.unitIndex,
    unit,
    advance,
    reset,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/sdk/flow/__tests__/useFlow.test.ts`
Expected: PASS. (If `react-test-renderer` is unavailable, install is not required — it ships with the React 19 / jest-expo toolchain; if the import fails, fall back to testing `resolveStart`/`advancePosition` already covered in Task 5 and verify the hook manually in Task 12.)

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/useFlow.ts src/sdk/flow/__tests__/useFlow.test.ts
git commit -m "feat(flow): useFlow hook (load/resume/advance/reset)"
```

---

### Task 7: ActorLayer (renders + morphs the shared actor pool)

**Files:**
- Create: `src/sdk/flow/ActorLayer.tsx`
- Test: none (RN `Animated` visual — verified manually in Task 12). Logic it depends on (`planTransition`) is already tested.

**Interfaces:**
- Consumes: `Actor` from `./actors`; `planTransition` from `./transition`.
- Produces: `function ActorLayer(props: { actors: Actor[]; duration?: number }): JSX.Element` — absolutely-fills its parent, `pointerEvents="none"`, `direction:'ltr'`. Maintains per-id `Animated.Value`s; on `actors` change it diffs against the previous set and animates matched ids to new geometry, fades entering ids in, fades leaving ids out (then drops them).

- [ ] **Step 1: Implement**

```tsx
// src/sdk/flow/ActorLayer.tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Actor } from './actors';
import { planTransition } from './transition';

type Tween = {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  content: ReactNode;
};

function makeTween(a: Actor): Tween {
  return {
    x: new Animated.Value(a.x),
    y: new Animated.Value(a.y),
    scale: new Animated.Value(a.scale),
    rotation: new Animated.Value(a.rotation),
    opacity: new Animated.Value(a.opacity),
    content: a.content,
  };
}

export function ActorLayer({ actors, duration = 520 }: { actors: Actor[]; duration?: number }) {
  // Live tween handles per actor id, persisted across renders.
  const tweens = useRef<Map<string, Tween>>(new Map());
  // Ids currently mounted (includes those fading out), drives render.
  const [mountedIds, setMountedIds] = useState<string[]>([]);
  const prevActors = useRef<Actor[]>([]);

  useEffect(() => {
    const plan = planTransition(prevActors.current, actors);
    const tw = tweens.current;

    // Entering: create tweens starting transparent, then fade/scale in.
    for (const a of plan.entering) {
      const t = makeTween({ ...a, opacity: 0, scale: a.scale * 0.6 });
      tw.set(a.id, t);
    }
    // Ensure mounted set includes entering ids immediately.
    setMountedIds((ids) => Array.from(new Set([...ids, ...actors.map((a) => a.id)])));

    const animations: Animated.CompositeAnimation[] = [];

    // Entering settle.
    for (const a of plan.entering) {
      const t = tw.get(a.id)!;
      t.content = a.content;
      animations.push(
        Animated.parallel([
          Animated.timing(t.opacity, { toValue: a.opacity, duration, useNativeDriver: true }),
          Animated.spring(t.scale, { toValue: a.scale, useNativeDriver: true, speed: 12, bounciness: 8 }),
        ]),
      );
    }
    // Matched: morph geometry to target. (x/y not native-driver-able → separate driver.)
    for (const m of plan.matched) {
      const t = tw.get(m.id)!;
      t.content = m.content;
      animations.push(
        Animated.parallel([
          Animated.timing(t.x, { toValue: m.to.x, duration, useNativeDriver: false }),
          Animated.timing(t.y, { toValue: m.to.y, duration, useNativeDriver: false }),
          Animated.timing(t.scale, { toValue: m.to.scale, duration, useNativeDriver: true }),
          Animated.timing(t.rotation, { toValue: m.to.rotation, duration, useNativeDriver: true }),
          Animated.timing(t.opacity, { toValue: m.to.opacity, duration, useNativeDriver: true }),
        ]),
      );
    }
    // Leaving: fade + shrink, then unmount.
    for (const a of plan.leaving) {
      const t = tw.get(a.id);
      if (!t) continue;
      animations.push(
        Animated.parallel([
          Animated.timing(t.opacity, { toValue: 0, duration, useNativeDriver: true }),
          Animated.timing(t.scale, { toValue: a.scale * 0.6, duration, useNativeDriver: true }),
        ]),
      );
    }

    Animated.parallel(animations).start(() => {
      // Drop leaving tweens + prune mounted ids.
      for (const a of plan.leaving) tweens.current.delete(a.id);
      setMountedIds(actors.map((a) => a.id));
    });

    prevActors.current = actors;
  }, [actors, duration]);

  return (
    <View style={styles.layer} pointerEvents="none">
      {mountedIds.map((id) => {
        const t = tweens.current.get(id);
        if (!t) return null;
        return (
          <Animated.View
            key={id}
            style={[
              styles.actor,
              {
                opacity: t.opacity,
                transform: [
                  { translateX: t.x },
                  { translateY: t.y },
                  { scale: t.scale },
                  {
                    rotate: t.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {t.content}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // LTR pin: actor coordinates assume a left origin (RTL must not mirror them).
  layer: { ...StyleSheet.absoluteFillObject, direction: 'ltr' },
  // Actor anchored at top-left; x/y are translate offsets so content centers via marginLeft/Top below.
  actor: { position: 'absolute', left: 0, top: 0 },
});
```

Note: actor `content` should be self-centering (the `StarSprite` in Task 9 wraps itself with a fixed size and `marginLeft/marginTop` of `-size/2`) so that `(x, y)` denotes the sprite's center.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `ActorLayer.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/sdk/flow/ActorLayer.tsx
git commit -m "feat(flow): ActorLayer morphing renderer"
```

---

### Task 8: SceneCanvas (persistent backdrop host)

**Files:**
- Create: `src/sdk/flow/SceneCanvas.tsx`

**Interfaces:**
- Consumes: `Actor` from `./actors`; `ActorLayer` from `./ActorLayer`.
- Produces: `function SceneCanvas(props: { actors: Actor[]; children?: ReactNode }): JSX.Element` — fills the screen with a warm gradient-free backdrop (token colors) sized 120% of the viewport so actors can travel off-frame, renders `ActorLayer` beneath `children` (the unit's interaction overlay).

- [ ] **Step 1: Implement**

```tsx
// src/sdk/flow/SceneCanvas.tsx
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';
import type { Actor } from './actors';
import { ActorLayer } from './ActorLayer';

export function SceneCanvas({ actors, children }: { actors: Actor[]; children?: ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Oversized backdrop so actors can enter/exit frame during morphs. */}
      <View style={styles.backdrop} pointerEvents="none" />
      <ActorLayer actors={actors} />
      {/* Unit interaction overlay (Pressables positioned at actor coords). */}
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  backdrop: {
    position: 'absolute',
    left: '-10%',
    top: '-10%',
    width: '120%',
    height: '120%',
    backgroundColor: COLORS.canvas,
  },
  overlay: { ...StyleSheet.absoluteFillObject },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `SceneCanvas.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/sdk/flow/SceneCanvas.tsx
git commit -m "feat(flow): SceneCanvas persistent backdrop host"
```

---

### Task 9: Flow barrel + SDK export + StarSprite

**Files:**
- Create: `src/sdk/flow/index.ts`
- Modify: `src/sdk/index.ts`
- Create: `src/flow/units/StarSprite.tsx`

**Interfaces:**
- Produces (from `@/sdk`): `Actor`, `makeActor`, `rowLayout`, `planTransition`, `TransitionPlan`, `FlowUnit`, `FlowUnitContext`, `FlowUnitProps`, `Topic`, `registerFlowUnit`, `getFlowUnit`, `registerTopic`, `getAllTopics`, `activeTopics`, `FlowProgress`, `createFlowProgressStore`, `DEFAULT_FLOW_PROGRESS`, `resolveStart`, `advancePosition`, `FlowPosition`, `useFlow`, `UseFlowResult`, `ActorLayer`, `SceneCanvas`.
- Produces (`StarSprite`): `function StarSprite(props: { color: string; size?: number }): JSX.Element` — a centered star (reuses `shape-detective` `ShapeView`) with `marginLeft/marginTop` `= -size/2` so it centers on an actor's `(x,y)`.

- [ ] **Step 1: Implement the barrel**

```ts
// src/sdk/flow/index.ts
export { type Actor, makeActor, rowLayout } from './actors';
export { type Geometry, type TransitionPlan, planTransition } from './transition';
export {
  type FlowUnit, type FlowUnitContext, type FlowUnitProps, type Topic,
  registerFlowUnit, getFlowUnit, registerTopic, getAllTopics, activeTopics,
} from './curriculum';
export {
  type FlowProgress, type FlowPosition,
  DEFAULT_FLOW_PROGRESS, createFlowProgressStore, resolveStart, advancePosition,
} from './progress';
export { useFlow, type UseFlowResult } from './useFlow';
export { ActorLayer } from './ActorLayer';
export { SceneCanvas } from './SceneCanvas';
```

- [ ] **Step 2: Re-export from the SDK**

In `src/sdk/index.ts`, add at the end (after the i18n block):

```ts
// Guided flow engine
export * from './flow';
```

- [ ] **Step 3: Implement StarSprite**

```tsx
// src/flow/units/StarSprite.tsx
import { View } from 'react-native';
import { ShapeView } from '@/games/shape-detective/components/ShapeView';

/** A star sprite centered on its anchor point (for use as Actor.content). */
export function StarSprite({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <View style={{ marginLeft: -size / 2, marginTop: -size / 2 }}>
      <ShapeView shape={{ kind: 'star', color, size: size >= 80 ? 'large' : size >= 56 ? 'medium' : 'small' }} />
    </View>
  );
}
```

Note: `ShapeView` renders by `size` bucket (`small/medium/large` → 40/64/88 px from `SHAPE_SIZE_PX`). The `size` prop here picks the nearest bucket; the `marginLeft/Top` use the requested px for centering. This keeps the showcase visually consistent without modifying `shape-detective`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/flow/index.ts src/sdk/index.ts src/flow/units/StarSprite.tsx
git commit -m "feat(flow): export flow engine from @/sdk + StarSprite"
```

---

### Task 10: Unit A — fourCount (reuses count-and-pop domain)

**Files:**
- Create: `src/flow/units/fourCount.tsx`
- Test: `src/flow/units/__tests__/fourCount.test.ts`

**Interfaces:**
- Consumes: `makeActor`, `rowLayout`, `Actor`, `FlowUnit`, `FlowUnitContext`, `FlowUnitProps` from `@/sdk`; `buildCountThisMany` from `@/games/count-and-pop/utils/generate`; `ACCENTS` from `@/sdk`; `StarSprite` from `./StarSprite`.
- Produces:
  - `const FOUR_COUNT_TARGET = 4`
  - `function fourCountActors(ctx: FlowUnitContext): Actor[]` — `FOUR_COUNT_TARGET` star actors in a centered row (ids `star-0..3`).
  - `const fourCount: FlowUnit` (`id:'four-count'`, `topicId:'four'`).

Interaction: render a transparent `Pressable` over each actor; tapping marks it "counted" (a11y/sound), and when all four are counted call `onComplete`. The target number `4` is sourced from the `count-and-pop` generator (`buildCountThisMany(seed, 4).target`) to demonstrate real domain reuse.

- [ ] **Step 1: Write the failing test**

```ts
// src/flow/units/__tests__/fourCount.test.ts
import { fourCount, fourCountActors, FOUR_COUNT_TARGET } from '../fourCount';

const ctx = { width: 800, height: 400, rng: () => 0.5 };

describe('fourCount actors', () => {
  it('produces exactly the target number of star actors', () => {
    const actors = fourCountActors(ctx);
    expect(actors).toHaveLength(FOUR_COUNT_TARGET);
    expect(actors.map((a) => a.id)).toEqual(['star-0', 'star-1', 'star-2', 'star-3']);
  });
  it('lays them out on a single horizontal row', () => {
    const ys = new Set(fourCountActors(ctx).map((a) => a.y));
    expect(ys.size).toBe(1);
  });
  it('exit layout reuses the same ids (so the next unit can morph them)', () => {
    const enter = fourCount.enterActors(ctx).map((a) => a.id);
    const exit = fourCount.exitActors(ctx).map((a) => a.id);
    expect(exit).toEqual(enter);
  });
  it('is registered under the four topic', () => {
    expect(fourCount.id).toBe('four-count');
    expect(fourCount.topicId).toBe('four');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/flow/units/__tests__/fourCount.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/flow/units/fourCount.tsx
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS, FONTS, FONT_SIZES, COLORS,
  makeActor, rowLayout, useSound, useTranslation,
  type Actor, type FlowUnit, type FlowUnitContext, type FlowUnitProps,
} from '@/sdk';
import { buildCountThisMany } from '@/games/count-and-pop/utils/generate';
import { StarSprite } from './StarSprite';

// Target sourced from the count-and-pop domain generator (real reuse).
export const FOUR_COUNT_TARGET = buildCountThisMany(1, 4).target; // === 4

const STAR_SIZE = 72;
const HIT = 88;

export function fourCountActors(ctx: FlowUnitContext): Actor[] {
  const pts = rowLayout(FOUR_COUNT_TARGET, {
    cx: ctx.width / 2,
    cy: ctx.height * 0.5,
    gap: STAR_SIZE + 32,
  });
  return pts.map((p, i) =>
    makeActor({
      id: `star-${i}`,
      x: p.x,
      y: p.y,
      content: <StarSprite color={ACCENTS.pink.base} size={STAR_SIZE} />,
    }),
  );
}

function FourCountComponent({ actors, onComplete }: FlowUnitProps) {
  const { play } = useSound();
  const { t } = useTranslation();
  const [counted, setCounted] = useState<Set<string>>(new Set());

  const handleTap = (id: string) => {
    if (counted.has(id)) return;
    void play('pop');
    const next = new Set(counted);
    next.add(id);
    setCounted(next);
    if (next.size >= FOUR_COUNT_TARGET) {
      void play('success');
      setTimeout(onComplete, 450);
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.prompt}>{t('flow.fourCount.prompt')}</Text>
      <Text style={styles.counter}>{counted.size}</Text>
      {actors.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => handleTap(a.id)}
          accessibilityLabel={t('flow.fourCount.starLabel')}
          style={[
            styles.hit,
            { left: a.x - HIT / 2, top: a.y - HIT / 2, opacity: counted.has(a.id) ? 0.4 : 1 },
          ]}
        />
      ))}
    </View>
  );
}

export const fourCount: FlowUnit = {
  id: 'four-count',
  topicId: 'four',
  enterActors: fourCountActors,
  exitActors: fourCountActors, // settle in place; next unit morphs from here
  Component: FourCountComponent,
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  prompt: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  counter: {
    fontFamily: FONTS.displayBold,
    fontSize: 40,
    color: ACCENTS.pink.deep,
    textAlign: 'center',
  },
  hit: { position: 'absolute', width: HIT, height: HIT, borderRadius: HIT / 2 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/flow/units/__tests__/fourCount.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flow/units/fourCount.tsx src/flow/units/__tests__/fourCount.test.ts
git commit -m "feat(flow): four-count unit (reuses count-and-pop domain)"
```

---

### Task 11: Unit B — fourShapes (reuses shape-detective domain)

**Files:**
- Create: `src/flow/units/fourShapes.tsx`
- Test: `src/flow/units/__tests__/fourShapes.test.ts`

**Interfaces:**
- Consumes: `makeActor`, `rowLayout`, `Actor`, `FlowUnit`, `FlowUnitContext`, `FlowUnitProps` from `@/sdk`; `buildOddOneOutPuzzle` from `@/games/shape-detective/utils/generate`; `StarSprite` from `./StarSprite`.
- Produces:
  - `function fourShapesActors(ctx: FlowUnitContext): Actor[]` — 4 star actors (ids `star-0..3`) colored per a generated odd-one-out puzzle; one differs.
  - `const FOUR_SHAPES_PUZZLE_SEED = 7` (fixed so enter/exit and the Component agree on the odd index).
  - `const fourShapes: FlowUnit` (`id:'four-shapes'`, `topicId:'four'`).

Interaction: tapping the odd star → correct → `onComplete`; tapping another → `wrong` sound + gentle nudge, no penalty.

Important: `fourShapesActors` and the `Component` must derive from the **same** puzzle so the odd index matches. Generate it once from `FOUR_SHAPES_PUZZLE_SEED` in a shared `buildFourPuzzle()` helper exported from this module and used by both.

- [ ] **Step 1: Write the failing test**

```ts
// src/flow/units/__tests__/fourShapes.test.ts
import { fourShapes, fourShapesActors, buildFourPuzzle } from '../fourShapes';

const ctx = { width: 800, height: 400, rng: () => 0.5 };

describe('fourShapes', () => {
  it('produces 4 star actors sharing ids with the counting unit', () => {
    const actors = fourShapesActors(ctx);
    expect(actors.map((a) => a.id)).toEqual(['star-0', 'star-1', 'star-2', 'star-3']);
  });
  it('exposes a deterministic odd-one-out index in range', () => {
    const puzzle = buildFourPuzzle();
    expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
    expect(puzzle.correctIndex).toBeLessThan(4);
    // determinism: same seed → same odd index
    expect(buildFourPuzzle().correctIndex).toBe(puzzle.correctIndex);
  });
  it('is registered under the four topic', () => {
    expect(fourShapes.id).toBe('four-shapes');
    expect(fourShapes.topicId).toBe('four');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/flow/units/__tests__/fourShapes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/flow/units/fourShapes.tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  FONTS, FONT_SIZES, COLORS,
  makeActor, rowLayout, useSound, useTranslation,
  type Actor, type FlowUnit, type FlowUnitContext, type FlowUnitProps,
} from '@/sdk';
import { buildOddOneOutPuzzle, mulberry32 } from '@/games/shape-detective/utils/generate';
import { StarSprite } from './StarSprite';

export const FOUR_SHAPES_PUZZLE_SEED = 7;
const STAR_SIZE = 72;
const HIT = 88;
const ITEM_COUNT = 4;

/** One deterministic 4-item odd-one-out puzzle, shared by actors + Component. */
export function buildFourPuzzle() {
  const rng = mulberry32(FOUR_SHAPES_PUZZLE_SEED);
  // activeAttributes 'color' keeps all kinds = star; only the color varies.
  return buildOddOneOutPuzzle(rng, { activeAttributes: ['color'], itemCount: ITEM_COUNT });
}

export function fourShapesActors(ctx: FlowUnitContext): Actor[] {
  const puzzle = buildFourPuzzle();
  const pts = rowLayout(ITEM_COUNT, {
    cx: ctx.width / 2,
    cy: ctx.height * 0.5,
    gap: STAR_SIZE + 32,
  });
  return pts.map((p, i) =>
    makeActor({
      id: `star-${i}`,
      x: p.x,
      y: p.y,
      // Force the star kind; reuse the puzzle's per-item color.
      content: <StarSprite color={puzzle.items[i].color} size={STAR_SIZE} />,
    }),
  );
}

function FourShapesComponent({ actors, onComplete }: FlowUnitProps) {
  const { play } = useSound();
  const { t } = useTranslation();
  const [solved, setSolved] = useState(false);
  const puzzle = buildFourPuzzle();

  const handleTap = (index: number) => {
    if (solved) return;
    if (index === puzzle.correctIndex) {
      setSolved(true);
      void play('success');
      setTimeout(onComplete, 450);
    } else {
      void play('wrong');
    }
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Text style={styles.prompt}>{t('flow.fourShapes.prompt')}</Text>
      {actors.map((a, i) => (
        <Pressable
          key={a.id}
          onPress={() => handleTap(i)}
          accessibilityLabel={t('flow.fourShapes.starLabel')}
          style={[styles.hit, { left: a.x - HIT / 2, top: a.y - HIT / 2 }]}
        />
      ))}
    </View>
  );
}

export const fourShapes: FlowUnit = {
  id: 'four-shapes',
  topicId: 'four',
  enterActors: fourShapesActors,
  exitActors: fourShapesActors,
  Component: FourShapesComponent,
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  prompt: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  hit: { position: 'absolute', width: HIT, height: HIT, borderRadius: HIT / 2 },
});
```

Note on the generator call: verify the actual signature of `buildOddOneOutPuzzle` in `src/games/shape-detective/utils/generate.ts:217`. If its parameters differ from `(rng, { activeAttributes, itemCount })`, adapt this call to match — the requirement is only that it returns `{ items: Shape[]; correctIndex: number }` with one differing item. If `mulberry32` is not exported from that module, copy the same 5-line `mulberry32` already present there into a tiny local helper rather than changing the game.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/flow/units/__tests__/fourShapes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flow/units/fourShapes.tsx src/flow/units/__tests__/fourShapes.test.ts
git commit -m "feat(flow): four-shapes unit (reuses shape-detective domain)"
```

---

### Task 12: Curriculum content registration + side-effect index

**Files:**
- Create: `src/flow/curriculum.ts`
- Create: `src/flow/index.ts`
- Test: `src/flow/__tests__/curriculum.test.ts`

**Interfaces:**
- Consumes: `registerFlowUnit`, `registerTopic`, `getFlowUnit`, `getAllTopics` from `@/sdk`; `fourCount`, `fourShapes` units.
- Produces: side effect — registers both units and the `four` topic (`unitIds: ['four-count', 'four-shapes']`). `src/flow/index.ts` is the single side-effect import (mirrors `src/games/index.ts`).

- [ ] **Step 1: Write the failing test**

```ts
// src/flow/__tests__/curriculum.test.ts
import '@/flow'; // side-effect: registers units + the four topic
import { getAllTopics, getFlowUnit } from '@/sdk';

describe('four topic registration', () => {
  it('registers the four topic with both units in order', () => {
    const four = getAllTopics().find((t) => t.id === 'four');
    expect(four?.unitIds).toEqual(['four-count', 'four-shapes']);
  });
  it('registers both units', () => {
    expect(getFlowUnit('four-count')?.topicId).toBe('four');
    expect(getFlowUnit('four-shapes')?.topicId).toBe('four');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/flow/__tests__/curriculum.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/flow/curriculum.ts
import { registerFlowUnit, registerTopic } from '@/sdk';
import { fourCount } from './units/fourCount';
import { fourShapes } from './units/fourShapes';

registerFlowUnit(fourCount);
registerFlowUnit(fourShapes);

registerTopic({ id: 'four', unitIds: ['four-count', 'four-shapes'] });
```

```ts
// src/flow/index.ts
// Side-effect: registers all flow units + topics (mirrors src/games/index.ts).
import './curriculum';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/flow/__tests__/curriculum.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flow/curriculum.ts src/flow/index.ts src/flow/__tests__/curriculum.test.ts
git commit -m "feat(flow): register four topic + units"
```

---

### Task 13: i18n flow strings + key guard

**Files:**
- Modify: `src/sdk/i18n/locales/en.ts`
- Modify: `src/sdk/i18n/locales/ar.ts`
- Modify: `src/sdk/i18n/__tests__/keys.test.ts`

**Interfaces:**
- Produces core keys: `flow.title`, `flow.continue`, `flow.allCaughtUp`, `flow.exit`, `flow.fourCount.prompt`, `flow.fourCount.starLabel`, `flow.fourShapes.prompt`, `flow.fourShapes.starLabel`, `settings.guided.section`, `settings.guided.mode`, `settings.guided.topics`, `settings.guided.reset`.

- [ ] **Step 1: Add the failing keys to the guard test**

In `src/sdk/i18n/__tests__/keys.test.ts`, add to the `KEYS` array (in the `// core` block):

```ts
  'core:flow.title',
  'core:flow.continue',
  'core:flow.allCaughtUp',
  'core:flow.exit',
  'core:flow.fourCount.prompt',
  'core:flow.fourCount.starLabel',
  'core:flow.fourShapes.prompt',
  'core:flow.fourShapes.starLabel',
  'core:settings.guided.section',
  'core:settings.guided.mode',
  'core:settings.guided.topics',
  'core:settings.guided.reset',
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/sdk/i18n/__tests__/keys.test.ts`
Expected: FAIL — new keys resolve to the raw key string.

- [ ] **Step 3: Implement (en)**

In `src/sdk/i18n/locales/en.ts`, add a `flow` section at the top level of the `core` object and a `guided` block inside `settings`:

```ts
  flow: {
    title: 'Your journey',
    continue: 'Continue your journey',
    allCaughtUp: "You're all caught up 🌟",
    exit: 'Done',
    fourCount: {
      prompt: 'Tap the stars to count them!',
      starLabel: 'Star to count',
    },
    fourShapes: {
      prompt: 'Which star is different?',
      starLabel: 'Star',
    },
  },
```

Inside the existing `settings: { ... }` object, add:

```ts
    guided: {
      section: 'Guided mode',
      mode: 'Guided journey',
      topics: 'Topics',
      reset: 'Reset journey progress',
    },
```

- [ ] **Step 4: Implement (ar)**

In `src/sdk/i18n/locales/ar.ts`, mirror the same structure with warm kid-friendly Arabic (Western digits):

```ts
  flow: {
    title: 'رحلتك',
    continue: 'تابع رحلتك',
    allCaughtUp: 'أحسنت! أنهيت كل شيء 🌟',
    exit: 'تم',
    fourCount: {
      prompt: 'انقر النجوم لتعدّها!',
      starLabel: 'نجمة للعدّ',
    },
    fourShapes: {
      prompt: 'أي نجمة مختلفة؟',
      starLabel: 'نجمة',
    },
  },
```

Inside `settings`:

```ts
    guided: {
      section: 'الوضع الموجّه',
      mode: 'الرحلة الموجّهة',
      topics: 'المواضيع',
      reset: 'إعادة تقدّم الرحلة',
    },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/sdk/i18n/__tests__/keys.test.ts`
Expected: PASS in both en and ar.

- [ ] **Step 6: Commit**

```bash
git add src/sdk/i18n/locales/en.ts src/sdk/i18n/locales/ar.ts src/sdk/i18n/__tests__/keys.test.ts
git commit -m "feat(flow): i18n strings for guided mode (en + ar)"
```

---

### Task 14: FlowPlayerScreen (landscape host + orchestration)

**Files:**
- Create: `src/screens/FlowPlayerScreen.tsx`
- Modify: `src/screens/index.ts`

**Interfaces:**
- Consumes: `useFlow`, `activeTopics`, `getAllTopics`, `SceneCanvas`, `useSettings`, `useTranslation`, `type Actor` from `@/sdk`; `BackButton` from `../components/common`; `expo-screen-orientation`.
- Produces: `function FlowPlayerScreen(props: NativeStackScreenProps<RootStackParamList, 'FlowPlayer'>): JSX.Element`. Exports added to `src/screens/index.ts`.

Behavior:
- Lock landscape on mount; restore `PORTRAIT_UP` on unmount.
- `topics = activeTopics(getAllTopics(), settings.flowTopicIds)`; `useFlow({ topics })`.
- Viewport from `useWindowDimensions()`; build `ctx = { width, height, rng: Math.random }`.
- `actors`: when a `unit` is active, `unit.enterActors(ctx)`. Held in state so the previous unit's actors persist into `ActorLayer` for morph. On `unit.id` change, set actors to the new unit's enter actors (ActorLayer morphs shared ids from old positions).
- On unit `onComplete`: set actors to the **current** unit's `exitActors(ctx)` (a brief settle), wait 350ms, then `advance()`.
- `status === 'done'` → render the calm rest state (`flow.allCaughtUp`) over the canvas with an exit (back) button.
- Always render `BackButton` (top-start) that navigates back to Home.

- [ ] **Step 1: Implement**

```tsx
// src/screens/FlowPlayerScreen.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  SceneCanvas, useFlow, activeTopics, getAllTopics, useSettings, useTranslation,
  FONTS, FONT_SIZES, COLORS, type Actor,
} from '@/sdk';
import { BackButton } from '../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'FlowPlayer'>;

export function FlowPlayerScreen({ navigation }: Props) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  // Landscape lock for guided mode only; restore portrait on exit.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const topics = useMemo(
    () => activeTopics(getAllTopics(), settings.flowTopicIds),
    [settings.flowTopicIds],
  );
  const { status, unit, advance } = useFlow({ topics });
  const ctx = useMemo(() => ({ width, height, rng: Math.random }), [width, height]);

  const [actors, setActors] = useState<Actor[]>([]);
  const advancing = useRef(false);

  // When the active unit changes, morph the actor pool to its enter layout.
  useEffect(() => {
    if (unit) {
      advancing.current = false;
      setActors(unit.enterActors(ctx));
    }
  }, [unit, ctx]);

  const handleComplete = () => {
    if (!unit || advancing.current) return;
    advancing.current = true;
    setActors(unit.exitActors(ctx)); // settle
    setTimeout(() => advance(), 350);
  };

  const UnitComponent = unit?.Component;

  return (
    <View style={styles.root}>
      <SceneCanvas actors={actors}>
        {status === 'playing' && UnitComponent ? (
          <UnitComponent actors={actors} onComplete={handleComplete} />
        ) : null}
        {status === 'done' ? (
          <View style={styles.rest} pointerEvents="box-none">
            <Text style={styles.restText}>{t('flow.allCaughtUp')}</Text>
          </View>
        ) : null}
      </SceneCanvas>
      <BackButton onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  rest: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  restText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
```

In `src/screens/index.ts`, add the export alongside the others:

```ts
export { FlowPlayerScreen } from './FlowPlayerScreen';
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only about the missing `FlowPlayer` route (fixed in Task 15) — `FONT_SIZES.xl` exists; confirm the token in `src/constants/dimensions.ts` (if `xl` is absent, use the largest available, e.g. `lg`).

- [ ] **Step 3: Commit**

```bash
git add src/screens/FlowPlayerScreen.tsx src/screens/index.ts
git commit -m "feat(flow): FlowPlayerScreen landscape host + orchestration"
```

---

### Task 15: Navigation wiring + App registration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/app/navigation/RootNavigator.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `FlowPlayerScreen` from `../../screens`.
- Produces: `RootStackParamList` gains `FlowPlayer: undefined`; navigator registers the screen; `App.tsx` registers flow content via side-effect import.

- [ ] **Step 1: Add the route to the param list**

In `src/types/index.ts`:

```ts
export type RootStackParamList = {
  Home: undefined;
  GamePlayer: { gameId: string };
  Settings: undefined;
  FlowPlayer: undefined;
};
```

- [ ] **Step 2: Register the screen**

In `src/app/navigation/RootNavigator.tsx`, import and add the screen:

```ts
import { HomeScreen, GamePlayerScreen, SettingsScreen, FlowPlayerScreen } from '../../screens';
```

```tsx
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="FlowPlayer" component={FlowPlayerScreen} />
```

- [ ] **Step 3: Register flow content in App.tsx**

In `App.tsx`, after the existing `import './src/games';` line (line 26):

```ts
import './src/flow'; // side-effect: registers flow units + topics
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full suite**

Run: `npx jest`
Expected: PASS (all flow + existing tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/app/navigation/RootNavigator.tsx App.tsx
git commit -m "feat(flow): register FlowPlayer route + flow content"
```

---

### Task 16: HomeScreen mode branch

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `settings.mode` from `useSettings()`.
- Produces: when `settings.mode === 'guided'`, Home renders only a "Continue your journey" entry that navigates to `FlowPlayer`; otherwise renders today's grid unchanged.

- [ ] **Step 1: Implement the branch**

In `src/screens/HomeScreen.tsx`, import `PressableButton`:

```ts
import { /* existing */ PressableButton } from '@/sdk';
```

Inside the component, right after `const games = ...`, add the guided branch before the `return` of the grid. Replace the grid block:

```tsx
        {settings.mode === 'guided' ? (
          <View style={styles.journey}>
            <Text style={styles.journeyTitle}>{t('flow.title')}</Text>
            <PressableButton
              label={t('flow.continue')}
              accent="purple"
              onPress={() => navigation.navigate('FlowPlayer')}
            />
          </View>
        ) : games.length === 0 ? (
          <Text style={styles.empty}>{t('home.empty')}</Text>
        ) : (
          <View style={styles.grid}>
            {/* ...existing grid map unchanged... */}
          </View>
        )}
```

Add styles:

```ts
  journey: {
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: SPACING.lg,
    alignItems: 'center',
  },
  journeyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
  },
```

Note: the age-band chips row can remain visible in guided mode (harmless) or be hidden behind the same `mode !== 'guided'` check — hiding is cleaner. Wrap the chips `ScrollView` in `{settings.mode !== 'guided' && ( ... )}`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npx expo start` (or `--android`). In Settings (built next), flip to guided and confirm Home shows only the journey CTA; flip back and confirm the grid returns. (If Settings UI isn't built yet, temporarily set `DEFAULT_SETTINGS.mode = 'guided'` to eyeball, then revert.)

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(flow): Home shows guided journey when mode=guided"
```

---

### Task 17: SettingsScreen guided-mode section

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `useSettings().update`, `getAllTopics`, `createFlowProgressStore`, `DEFAULT_FLOW_PROGRESS` from `@/sdk`; existing `ToggleRow`, `Chip`.
- Produces: a "Guided mode" card with: a mode toggle (`mode === 'guided'`), a topic checklist driving `flowTopicIds`, and a "Reset journey progress" action.

- [ ] **Step 1: Implement**

In `src/screens/SettingsScreen.tsx`, extend imports:

```ts
import {
  AGE_BANDS, useSettings, useTranslation, useLanguage, LANGUAGES,
  getAllTopics, createFlowProgressStore, DEFAULT_FLOW_PROGRESS,
  type LanguageCode,
} from '@/sdk';
```

Add helpers inside the component:

```tsx
  const topics = getAllTopics();
  const selectedTopicIds = settings.flowTopicIds; // null = all

  const isTopicOn = (id: string) => selectedTopicIds == null || selectedTopicIds.includes(id);

  const toggleTopic = (id: string) => {
    const current = selectedTopicIds ?? topics.map((tp) => tp.id);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // All selected → store null (means "all"); else store the explicit list.
    update({ flowTopicIds: next.length === topics.length ? null : next });
  };

  const resetJourney = () => {
    createFlowProgressStore().set({ ...DEFAULT_FLOW_PROGRESS, updatedAt: Date.now() });
  };
```

Add a new card to the `ScrollView` (after the existing settings card):

```tsx
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('settings.guided.section')}</Text>
          <ToggleRow
            icon="🧭"
            label={t('settings.guided.mode')}
            value={settings.mode === 'guided'}
            onChange={(v) => update({ mode: v ? 'guided' : 'free' })}
          />
          {settings.mode === 'guided' ? (
            <>
              <Text style={styles.sectionLabel}>{t('settings.guided.topics')}</Text>
              <View style={styles.topicRow}>
                {topics.map((tp) => (
                  <Chip
                    key={tp.id}
                    label={tp.id}
                    active={isTopicOn(tp.id)}
                    onPress={() => toggleTopic(tp.id)}
                  />
                ))}
              </View>
              <ToggleRow
                icon="🏁"
                label={t('settings.guided.reset')}
                value={false}
                onChange={() => resetJourney()}
              />
            </>
          ) : null}
        </View>
```

Add styles `sectionLabel` and `topicRow` if not present:

```ts
  sectionLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkSoft,
    marginBottom: SPACING.sm,
  },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: SPACING.md },
```

Note: topic labels use the raw `tp.id` ('four') for v1 — acceptable since topic ids are internal and there's one topic. A future task can add `flow.topics.<id>` translations. The "reset" row uses a `ToggleRow` purely as a tappable row (value always false); if a dedicated button reads cleaner, use a `PressableButton` instead — either is fine.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirm `FONTS.bodySemi` exists; per CLAUDE.md it does.)

- [ ] **Step 3: Manual verification**

Run: `npx expo start`. Open Settings → toggle Guided mode on → Home shows the journey → enter it → landscape locks → tap 4 stars (count) → watch them morph into the shape puzzle → tap the odd star → advance → rest state ("all caught up"). Back out → portrait restored. Toggle a topic off → with only one topic, journey shows rest state immediately. Tap "Reset journey progress" then re-enter → starts at unit A again.

- [ ] **Step 4: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat(flow): Settings guided-mode section (mode/topics/reset)"
```

---

### Task 18: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the whole suite**

Run: `npx jest`
Expected: all PASS, including `actors`, `transition`, `curriculum`, `progress`, `useFlow`, `fourCount`, `fourShapes`, `src/flow/__tests__/curriculum`, `keys.test`, `settings/store`, and all pre-existing game tests.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: End-to-end device check (manual)**

Run: `npx expo start --android`. Verify the full guided journey described in Task 17 Step 3, plus: free mode (default) still shows the grid and all existing games launch and play normally; switching language to Arabic keeps actor positions correct (LTR pin) and prompts read in Arabic.

- [ ] **Step 4: Commit any final fixups**

```bash
git add -A
git commit -m "chore(flow): verification fixups"
```

---

## Self-Review

**Spec coverage (each §):**
- §1 Purpose / two modes → Tasks 1 (settings), 16 (Home branch), 17 (Settings). ✓
- §2 Continuous shared canvas / morph → Tasks 2 (actors), 3 (transition), 7 (ActorLayer), 8 (SceneCanvas), 14 (orchestration). ✓
- §3 Flow-native units reusing two games' domains → Tasks 9 (StarSprite), 10 (fourCount/count-and-pop), 11 (fourShapes/shape-detective). ✓
- §5 FlowUnit contract → Task 4. ✓
- §6 Topic "Four" showcase (2 units, shared 4 stars, morph) → Tasks 10–12, 14. ✓
- §7 Curriculum + scoreless progress + resume + rest state → Tasks 4, 5, 6, 14. ✓
- §8 Landscape lock + i18n flow ns + RTL LTR pin → Tasks 14 (lock), 13 (i18n), 7 (LTR pin). ✓
- §9 Settings extension + Home/nav wiring → Tasks 1, 15, 16, 17. ✓
- §10 Out of scope (gate, adaptive, more topics, converting games) → not implemented (correct). ✓
- §11 Testing strategy → Tasks 2,3,4,5,6,10,11,12,13 cover the pure layers + i18n guard; visuals manual (14,16,17,18). ✓
- §12 Risks → mitigations realized: shared-id morph (Task 7), engine/game decoupling (StarSprite is the only game import, in content layer not sdk), LTR pin (Task 7). ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases" — every code step shows real code. Two adaptation notes (Task 11 generator signature, Task 14 `FONT_SIZES.xl`) explicitly tell the engineer what to verify and the exact fallback. ✓

**Type consistency:** `Actor`/`makeActor`/`rowLayout` (Task 2) used identically in 3, 7, 10, 11. `planTransition`→`TransitionPlan` (Task 3) consumed in 7. `FlowUnit`/`FlowUnitContext`/`FlowUnitProps`/`Topic` (Task 4) consumed in 6, 10, 11, 12, 14. `FlowProgress`/`resolveStart`/`advancePosition`/`createFlowProgressStore` (Task 5) consumed in 6, 17. `useFlow`→`UseFlowResult` (Task 6) consumed in 14. `Settings.mode/flowTopicIds/flowScoring` (Task 1) consumed in 14, 16, 17. Names match across tasks. ✓

**Known adaptation points (call out for the implementer):**
1. Task 11 — confirm `buildOddOneOutPuzzle` signature at `src/games/shape-detective/utils/generate.ts:217`; adapt the call to whatever yields `{ items, correctIndex }` for 4 color-varying items, and re-use/copy `mulberry32` accordingly.
2. Task 14 — confirm `FONT_SIZES.xl` exists; if not use `FONT_SIZES.lg`.
3. Task 6 — if `react-test-renderer` import fails under this toolchain, the hook is still covered indirectly by Task 5's resolver tests; verify the hook behavior manually in Task 17/18.
