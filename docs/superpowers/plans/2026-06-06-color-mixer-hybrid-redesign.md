# Color Mixer Hybrid Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify color-mixer on the continuous RGB engine — closeness-based discoveries + challenges, working "Save my color", a single two-shelf "My Colors" book — and apply the warm design system, retiring the dead discrete-recipe code.

**Architecture:** Pure color-matching helpers (`colorDistance`/`nearestFamous`/`closeness`) drive both discovery and challenge success against a generous threshold. `useColorMixer` keeps the running blend and gains persisted `discoveries`; `useChallengeMode` judges by closeness and persists completions. UI is rebuilt from `@/sdk` primitives (blue accent). The discrete recipe engine is deleted.

**Tech Stack:** React Native (Expo SDK 54), TypeScript strict, Jest (pure-logic tests), `@/sdk` design system.

Spec: `docs/superpowers/specs/2026-06-06-color-mixer-hybrid-redesign-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/games/color-mixer/utils/match.ts` (new) | pure matching: `colorDistance`, `nearestFamous`, `closeness`, `isChallengeMet`, `FAMOUS_IDS` |
| `src/games/color-mixer/utils/__tests__/match.test.ts` (new) | matching unit tests + famous-color reachability guard |
| `src/games/color-mixer/constants.ts` | add `MATCH_THRESHOLD`; tune famous hexes; remove `COLOR_RECIPES`/`COLOR_GROUPS`; canvas bg |
| `src/games/color-mixer/types.ts` | drop discrete `MixingZone` fields; `ColorRecipe` removal |
| `src/games/color-mixer/hooks/useColorMixer.ts` | persisted `discoveries`; closeness discovery; drop discrete engine |
| `src/games/color-mixer/hooks/useChallengeMode.ts` | closeness success; persist `completedChallenges` |
| `src/games/color-mixer/index.tsx` | wire Save dialog; pass `currentMixHex`; design-system layout |
| `src/games/color-mixer/components/MixingZone.tsx` | running-blend only + Save affordance; restyle |
| `src/games/color-mixer/components/ChallengeMode.tsx` | closeness meter + closeness success; restyle |
| `src/games/color-mixer/components/ColorCollection.tsx` | → "My Colors" two-shelf book; restyle |
| `src/games/color-mixer/components/DiscoveryCelebration.tsx` | restyle to design modal |
| `src/games/color-mixer/components/ColorNamingDialog.tsx` | restyle (already token-light) |
| `src/games/color-mixer/config.ts` | `backgroundColor` → `#FBF3E6` |

**Note on hook tests:** this repo unit-tests only pure logic (see `mouse-maze/__tests__`). Hooks/components are verified by extracted pure helpers + `tsc` + `expo export` + manual run. The plan follows that norm: TDD covers `utils/match.ts`; hooks/components are covered by those helpers and typecheck/bundle.

---

## Task 1: Pure color-matching helpers (+ reachability guard)

**Files:**
- Create: `src/games/color-mixer/utils/match.ts`
- Create: `src/games/color-mixer/utils/__tests__/match.test.ts`
- Modify: `src/games/color-mixer/constants.ts`
- Modify: `src/games/color-mixer/utils/index.ts`

- [ ] **Step 1: Tune famous hexes + add threshold in `constants.ts`**

In `COLORS`, set the 6 non-primary hexes to the values reachable from the 0.5-average blend (so a child who mixes the natural ingredients actually lands on them), and add the threshold. Replace the existing hex values for these ids:

```ts
// in COLORS: keep id/name/isPrimary/isUnlocked, change ONLY hex for these six
orange:    hex: '#F18835',
green:     hex: '#8EB08D',
purple:    hex: '#82618D',
brown:     hex: '#AB8870',
pink:      hex: '#F09A98',
lightBlue: hex: '#8CC1F0',
```

Add near the bottom of `constants.ts`:

```ts
/** Generous RGB (Euclidean) distance under which a blend "matches" a target. */
export const MATCH_THRESHOLD = 60;
```

- [ ] **Step 2: Write the failing test** — `src/games/color-mixer/utils/__tests__/match.test.ts`

```ts
import { COLORS, MATCH_THRESHOLD } from '../../constants';
import { addColorToMix } from '../colorMath';
import { colorDistance, nearestFamous, closeness, FAMOUS_IDS } from '../match';
import type { ColorId } from '../../types';

describe('colorDistance', () => {
  it('is 0 for identical colors', () => {
    expect(colorDistance('#FF9800', '#FF9800')).toBe(0);
  });
  it('is symmetric and positive for different colors', () => {
    const d1 = colorDistance('#000000', '#FFFFFF');
    const d2 = colorDistance('#FFFFFF', '#000000');
    expect(d1).toBe(d2);
    expect(d1).toBeGreaterThan(0);
  });
});

describe('nearestFamous', () => {
  it('returns the famous id when within threshold', () => {
    expect(nearestFamous(COLORS.orange.hex)).toBe('orange');
  });
  it('returns null for a far-off color (a primary stays unmatched)', () => {
    expect(nearestFamous('#000000')).toBeNull();
  });
});

describe('closeness', () => {
  it('is 1 for an exact match and lower as distance grows', () => {
    expect(closeness('#FF9800', '#FF9800')).toBe(1);
    expect(closeness('#000000', '#FFFFFF')).toBeLessThan(0.2);
  });
});

// Calibration guard: every famous color must be reachable from a short
// continuous mix of primaries (≤3 drops), within MATCH_THRESHOLD.
describe('famous-color reachability', () => {
  const MIXABLE: ColorId[] = ['red', 'yellow', 'blue', 'white', 'black'];

  function reachableMixes(): string[] {
    const out: string[] = [];
    const hex = (id: ColorId) => COLORS[id].hex;
    for (const a of MIXABLE)
      for (const b of MIXABLE) {
        const m2 = addColorToMix(hex(a), hex(b));
        out.push(m2);
        for (const c of MIXABLE) out.push(addColorToMix(m2, hex(c)));
      }
    return out;
  }

  it.each(FAMOUS_IDS)('%s is reachable within threshold', (id) => {
    const target = COLORS[id].hex;
    const best = Math.min(...reachableMixes().map((h) => colorDistance(h, target)));
    expect(best).toBeLessThan(MATCH_THRESHOLD);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest src/games/color-mixer/utils/__tests__/match.test.ts`
Expected: FAIL — `Cannot find module '../match'`.

- [ ] **Step 4: Implement `utils/match.ts`**

```ts
import { COLORS, MATCH_THRESHOLD } from '../constants';
import { hexToRgb } from './colorMath';
import type { ColorId } from '../types';

/** The discoverable (non-primary) colors. */
export const FAMOUS_IDS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => !COLORS[id].isPrimary,
);

/** Euclidean RGB distance between two hex colors. */
export function colorDistance(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.sqrt((x.r - y.r) ** 2 + (x.g - y.g) ** 2 + (x.b - y.b) ** 2);
}

/** Closest famous color within MATCH_THRESHOLD, else null. */
export function nearestFamous(hex: string): ColorId | null {
  let best: ColorId | null = null;
  let bestDist = MATCH_THRESHOLD;
  for (const id of FAMOUS_IDS) {
    const d = colorDistance(hex, COLORS[id].hex);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/** 0..1 progress toward a target (1 = exact), for the challenge meter only. */
export function closeness(hex: string, targetHex: string): number {
  const RANGE = 180; // distance over which the meter fills
  return Math.max(0, 1 - colorDistance(hex, targetHex) / RANGE);
}

/** Whether a blend satisfies a challenge target. */
export function isChallengeMet(mixHex: string | null, targetHex: string): boolean {
  return mixHex != null && colorDistance(mixHex, targetHex) < MATCH_THRESHOLD;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/games/color-mixer/utils/__tests__/match.test.ts`
Expected: PASS (all, including the 6 reachability cases). If a reachability case fails, raise `MATCH_THRESHOLD` (try 70) or nudge that color's hex toward an achievable mix, then re-run until green.

- [ ] **Step 6: Export from the utils barrel** — `src/games/color-mixer/utils/index.ts`

```ts
// Color Mixer utils
export * from './colorMath';
export * from './match';
```

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit` → Expected: no output.

```bash
git add src/games/color-mixer/utils/match.ts \
  src/games/color-mixer/utils/__tests__/match.test.ts \
  src/games/color-mixer/utils/index.ts src/games/color-mixer/constants.ts
git commit -m "feat(color-mixer): add color-match helpers + tuned famous colors"
```

---

## Task 2: Closeness-based challenge logic + persistence

**Files:**
- Modify: `src/games/color-mixer/hooks/useChallengeMode.ts`

> **Persistence note (refines the spec):** the spec described one `color-mixer` store holding all three keys. We use a **separate** `color-mixer-challenges` namespace for `completedChallenges` instead. Reason: `useColorMixer` and `useChallengeMode` are independent hooks; two `createStore` instances writing the *same* key with different object shapes would clobber each other (last writer wins, data loss). Separate namespaces are safe.

- [ ] **Step 1: Rewrite the hook to judge by closeness and persist completions**

```ts
import { useCallback, useEffect, useState } from 'react';
import { createStore } from '@/sdk';
import { CHALLENGES, COLORS } from '../constants';
import { isChallengeMet } from '../utils';
import type { Challenge } from '../types';

const challengeStore = createStore('color-mixer-challenges', {
  completedChallenges: [] as string[],
});

export function useChallengeMode() {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  useEffect(() => {
    challengeStore.get()
      // createStore.get() returns stored JSON as-is and does NOT backfill new
      // default keys, so guard every key with `?? []` for older saved data.
      .then((s) => setCompletedChallenges(s.completedChallenges ?? []))
      .catch((e) => console.error('Failed to load challenge progress:', e));
  }, []);

  const selectChallenge = useCallback((challenge: Challenge) => {
    setCurrentChallenge(challenge);
  }, []);

  const clearChallenge = useCallback(() => setCurrentChallenge(null), []);

  const checkChallengeComplete = useCallback(
    (mixHex: string | null): boolean => {
      if (!currentChallenge) return false;
      return isChallengeMet(mixHex, COLORS[currentChallenge.targetColor].hex);
    },
    [currentChallenge],
  );

  const markChallengeComplete = useCallback(() => {
    if (!currentChallenge) return;
    setCompletedChallenges((prev) => {
      if (prev.includes(currentChallenge.id)) return prev;
      const updated = [...prev, currentChallenge.id];
      challengeStore.set({ completedChallenges: updated }).catch((e) =>
        console.error('Failed to save challenge progress:', e),
      );
      return updated;
    });
    setCurrentChallenge(null);
  }, [currentChallenge]);

  return {
    challenges: CHALLENGES,
    currentChallenge,
    completedChallenges,
    selectChallenge,
    clearChallenge,
    checkChallengeComplete,
    markChallengeComplete,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors in `ChallengeMode.tsx`/`index.tsx` (they still pass `resultColor`). These are fixed in Tasks 5 & 6 — proceed; do not commit yet.

---

## Task 3: `useColorMixer` — persisted discoveries, drop discrete engine

**Files:**
- Modify: `src/games/color-mixer/hooks/useColorMixer.ts`

- [ ] **Step 1: Replace the hook body**

Full replacement (removes the discrete recipe engine; adds persisted `discoveries`; keeps the continuous blend + saved colors):

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { COLORS } from '../constants';
import type { ColorId, ColorData, SavedColor } from '../types';
import { addColorToMix, hexToRgb, nearestFamous } from '../utils';

const store = createStore('color-mixer', {
  savedColors: [] as SavedColor[],
  discoveries: [] as ColorId[],
});

const PRIMARY_COLORS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => COLORS[id].isPrimary,
);

export function useColorMixer() {
  const [newDiscovery, setNewDiscovery] = useState<ColorId | null>(null);
  const [discoveries, setDiscoveries] = useState<ColorId[]>([]);
  const discoveriesRef = useRef<ColorId[]>([]);

  const [currentMixHex, setCurrentMixHex] = useState<string | null>(null);
  const [mixHistory, setMixHistory] = useState<string[]>([]);
  const currentMixHexRef = useRef<string | null>(null);
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);

  useEffect(() => {
    store.get()
      .then((s) => {
        // createStore.get() does NOT backfill new default keys for previously
        // persisted data, so guard each with `?? []` (old installs lack `discoveries`).
        const saved = s.savedColors ?? [];
        const found = s.discoveries ?? [];
        setSavedColors(saved);
        setDiscoveries(found);
        discoveriesRef.current = found;
      })
      .catch((e) => console.error('Failed to load color-mixer store:', e));
  }, []);

  const persist = useCallback((patch: Partial<{ savedColors: SavedColor[]; discoveries: ColorId[] }>) => {
    store.get()
      .then((s) => store.set({ ...s, ...patch }))
      .catch((e) => console.error('Failed to persist color-mixer store:', e));
  }, []);

  /** Detect a first-time famous discovery from the running blend. */
  const detectDiscovery = useCallback((hex: string) => {
    const found = nearestFamous(hex);
    if (found && !discoveriesRef.current.includes(found)) {
      const updated = [...discoveriesRef.current, found];
      discoveriesRef.current = updated;
      setDiscoveries(updated);
      setNewDiscovery(found);
      persist({ discoveries: updated });
    }
  }, [persist]);

  const addColorToContinuousMix = useCallback((colorHex: string) => {
    const current = currentMixHexRef.current;
    const blended = current ? addColorToMix(current, colorHex, 0.5) : colorHex;
    if (current) setMixHistory((prev) => [...prev, current]);
    else setMixHistory([]);
    currentMixHexRef.current = blended;
    setCurrentMixHex(blended);
    detectDiscovery(blended);
  }, [detectDiscovery]);

  const undoLastMix = useCallback(() => {
    setMixHistory((prev) => {
      const previous = prev.length > 0 ? prev[prev.length - 1] : null;
      currentMixHexRef.current = previous;
      setCurrentMixHex(previous);
      return prev.slice(0, -1);
    });
  }, []);

  const clearContinuousMix = useCallback(() => {
    currentMixHexRef.current = null;
    setCurrentMixHex(null);
    setMixHistory([]);
  }, []);

  const saveCurrentMix = useCallback((name: string) => {
    const hex = currentMixHexRef.current;
    if (!hex) return;
    const saved: SavedColor = {
      id: `saved_${Date.now()}`,
      hex,
      name,
      rgb: hexToRgb(hex),
      createdAt: Date.now(),
    };
    setSavedColors((prev) => {
      const updated = [...prev, saved];
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist]);

  const deleteSavedColor = useCallback((id: string) => {
    setSavedColors((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist]);

  const acknowledgeDiscovery = useCallback(() => setNewDiscovery(null), []);

  const discoveredColors = useCallback(
    (): ColorData[] => discoveries.map((id) => COLORS[id]),
    [discoveries],
  );

  return {
    primaryColors: PRIMARY_COLORS,
    unlockedColors: PRIMARY_COLORS, // palette = primaries (continuous engine)
    newDiscovery,
    discoveries,
    acknowledgeDiscovery,
    discoveredColors,

    currentMixHex,
    canUndo: mixHistory.length > 0,
    addColorToContinuousMix,
    undoLastMix,
    clearContinuousMix,

    savedColors,
    saveCurrentMix,
    deleteSavedColor,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `index.tsx`/`MixingZone.tsx` referencing removed members (`mixingZone`, `addColorToZone`, `clearZone`). Fixed in Tasks 5–6. Do not commit yet.

---

## Task 4: Remove discrete types & recipe constants

**Files:**
- Modify: `src/games/color-mixer/types.ts`
- Modify: `src/games/color-mixer/constants.ts`

- [ ] **Step 1: `types.ts` — delete the discrete `MixingZone`, `ColorRecipe`, and recipe field of `GameState`**

Remove the `ColorRecipe` type, the `MixingZone` type, and the `mixingZone`/`discoveredRecipes`/`palette` fields from `GameState` (and the now-unused `DraggableColor` if nothing references it — verify with grep). Keep `ColorId`, `ColorData`, `DynamicColor`, `SavedColor`, `Challenge`, `GameMode`.

Verify nothing else imports the removed types:

```bash
grep -rn "ColorRecipe\|discoveredRecipes\|ExtendedMixingZone\|ExtendedGameState" src/games/color-mixer
```

Delete any now-dead `Extended*` interfaces that reference removed types.

- [ ] **Step 2: `constants.ts` — remove `COLOR_RECIPES` and `COLOR_GROUPS`**

Delete the `COLOR_RECIPES` array and the `COLOR_GROUPS` array (the Famous shelf derives its 6 ids from `FAMOUS_IDS`). Keep `COLORS`, `DISCOVERY_HINTS`, `CHALLENGES`, `DIMENSIONS`, `TIMING`, `ALL_COLOR_IDS`, `MATCH_THRESHOLD`. Change `GAME_BG`:

```ts
export const GAME_BG = '#FBF3E6'; // canvas
```

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` (expect remaining errors only in UI files touched by later tasks). Do not commit yet.

---

## Task 5: MixingZone — running-blend only + Save affordance + restyle

**Files:**
- Modify: `src/games/color-mixer/components/MixingZone.tsx`

- [ ] **Step 1: Simplify props and render**

Replace the component so it (a) drops the discrete `colorsInZone`/`resultColor`/`isMixing` ingredient orbit, (b) shows the empty state or the running blend via `DraggableResult`, and (c) styles from tokens. New prop shape:

```ts
type MixingZoneProps = {
  size: number;
  currentMixHex: string | null;
  onLayout: (position: { x: number; y: number; width: number; height: number }) => void;
  onResultDragEnd?: (position: { x: number; y: number }) => void;
};
```

Render: keep the circular drop zone (measure → `onLayout`). When `currentMixHex` is null show the `🎨 Drop colors here!` empty state (restyled with `FONTS`/`COLORS.inkSoft`); otherwise render `<DraggableResult hex={currentMixHex} size={DIMENSIONS.RESULT_BLOB_SIZE} onDragEnd={onResultDragEnd} />` with the existing scale/opacity entrance animation. Replace raw hex styles: border `COLORS.line2`, active `COLORS.brand`, background `COLORS.surface`, text via `FONTS`. Remove `getIngredientPosition`, `ColorBlob` ingredient mapping, and the spin animation.

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` (errors now only in `index.tsx`/`ChallengeMode.tsx`). Do not commit yet.

---

## Task 6: ChallengeMode — closeness meter + closeness success + restyle

**Files:**
- Modify: `src/games/color-mixer/components/ChallengeMode.tsx`

- [ ] **Step 1: Switch input from `resultColor` to `currentMixHex` and judge by closeness**

New props:

```ts
type ChallengeModeProps = {
  currentChallenge: Challenge;
  currentMixHex: string | null;
  onChallengeComplete: () => void;
  onBack: () => void;
};
```

Logic: `const targetHex = COLORS[currentChallenge.targetColor].hex;`
`const isCorrect = isChallengeMet(currentMixHex, targetHex);`
`const meter = currentMixHex ? closeness(currentMixHex, targetHex) : 0;` (import `isChallengeMet`, `closeness` from `../utils`). Keep the success spring + `setTimeout(onChallengeComplete, 2000)` effect keyed on `isCorrect`.

Replace the "wrong result" text with a **closeness meter**: a track (`COLORS.line2`) with a fill width `${Math.round(meter * 100)}%` (`COLORS.brand`) and a label that reads from `meter`: `>=1` "Perfect!" · `>=0.85` "So close!" · `>=0.6` "Getting warmer…" · else "Keep mixing!". Hide the meter when `currentMixHex` is null.

Restyle target/hint/success from tokens (`FONTS`, `COLORS`, `SHADOWS`, `Star` not needed here; success uses `🎉` + `FONTS.displayBold`). Back control → `IconButton`/text using `FONTS`.

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` (errors only in `index.tsx`). Do not commit yet.

---

## Task 7: My Colors book — two shelves + restyle

**Files:**
- Modify: `src/games/color-mixer/components/ColorCollection.tsx`

- [ ] **Step 1: Rebuild as a two-shelf "My Colors" book**

New props:

```ts
type MyColorsProps = {
  visible: boolean;
  discoveries: ColorId[];
  savedColors: SavedColor[];
  onDeleteSaved: (id: string) => void;
  onClose: () => void;
};
```

Content (Modal, restyled with `COLORS.canvas`/`surface`, `FONTS`, `SHADOWS`):
- Header: title **My Colors** + a `Done` `PressableButton`/`IconButton`.
- **Shelf 1 — Famous colors:** header `"{discoveries.length}/{FAMOUS_IDS.length} found"`; grid over `FAMOUS_IDS`. Discovered (`discoveries.includes(id)`) → `ColorBlob` swatch + `COLORS[id].name`. Undiscovered → locked `?` chip + `DISCOVERY_HINTS[id]`.
- **Shelf 2 — My creations:** grid over `savedColors` → swatch + name + a small delete (`×`) calling `onDeleteSaved(c.id)`. Empty state: "Mix a color and tap Save!".

Keep `ColorBlob`. Import `FAMOUS_IDS` from `../utils`, `DISCOVERY_HINTS`/`COLORS` from `../constants`.

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` (errors only in `index.tsx`). Do not commit yet.

---

## Task 8: DiscoveryCelebration + ColorNamingDialog restyle

**Files:**
- Modify: `src/games/color-mixer/components/DiscoveryCelebration.tsx`
- Modify: `src/games/color-mixer/components/ColorNamingDialog.tsx`

- [ ] **Step 1: Restyle DiscoveryCelebration to the design modal**

Keep its `colorId`/`visible`/`onComplete` API and the `Sparkles`. Restyle the card: `COLORS.surface`, `BORDER_RADIUS.tile`, `SHADOWS.lg`, scrim `COLORS.overlay`, `FONTS.displayBold` title ("New color!"), show the `COLORS[colorId]` swatch + name, and a `PressableButton` ("Yay!", accent `blue`) calling `onComplete` (in addition to the existing auto-dismiss timer).

- [ ] **Step 2: Restyle ColorNamingDialog**

Keep `visible`/`colorHex`/`onSave`/`onCancel`. Restyle to a design card (surface, tile radius, `SHADOWS.lg`, `FONTS`); show the color swatch, a `TextInput` (token border), and two `PressableButton`s: Save (accent `blue`) and Cancel (`variant="ghost"`). `onSave` passes the entered name (default e.g. "My Color" if blank).

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` (errors only in `index.tsx`). Do not commit yet.

---

## Task 9: index.tsx — wire everything + design-system layout

**Files:**
- Modify: `src/games/color-mixer/index.tsx`
- Modify: `src/games/color-mixer/components/ColorPalette.tsx` (light token pass)

- [ ] **Step 1: Rewire state, drag, save, challenge, and layout**

Key changes:
- Drop `mixer.mixingZone`, `mixer.clearZone`, `mixer.addColorToZone`. `handleDragEnd` now only calls `mixer.addColorToContinuousMix(COLORS[dragColorRef.current].hex)` when inside the zone.
- `MixingZone` props → `currentMixHex={mixer.currentMixHex}`, `onResultDragEnd`, `onLayout`.
- Add Save: a `saveDialogOpen` state; a **Save** `PressableButton` (accent `blue`, shown when `mixer.currentMixHex`) opens `ColorNamingDialog`; on save call `mixer.saveCurrentMix(name)`, close dialog, `mixer.clearContinuousMix()`.
- Challenge: `<ChallengeMode currentMixHex={mixer.currentMixHex} ... />`; on `checkChallengeComplete`-driven success, `challenge.markChallengeComplete()` (ChallengeMode fires `onChallengeComplete` after its success animation).
- Header: title (`FONTS.displayBold`) + a **My Colors** `IconButton` (📚) opening the book.
- Mode toggle: two `Chip`s (Free Play / Challenges) replacing the segmented control.
- Actions row (Undo/Clear/Save): token-styled.
- Palette: light token pass only — `ColorPalette`'s tray background → `COLORS.surface`, any labels → `FONTS`. Keep its drag mechanics and `ColorBlob` unchanged (structure is fine; this is a visual touch-up, not a rebuild).
- Pass `<ColorCollection visible={showCollection} discoveries={mixer.discoveries} savedColors={mixer.savedColors} onDeleteSaved={mixer.deleteSavedColor} onClose={...} />`.
- Background `COLORS.canvas`; remove raw hex styles. Keep `GestureHandlerRootView` + bare-mode (the floating BackButton comes from `GamePlayerScreen`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (all references now resolved).

- [ ] **Step 3: Full test suite**

Run: `CI=1 npx jest --watchAll=false`
Expected: all suites pass (including the new `match` tests).

- [ ] **Step 4: Bundle check**

Run: `npx expo export --platform ios --output-dir /tmp/cm-export && rm -rf /tmp/cm-export`
Expected: "Exported" with no resolution errors.

- [ ] **Step 5: Commit the gameplay rework**

```bash
git add src/games/color-mixer/hooks src/games/color-mixer/types.ts \
  src/games/color-mixer/constants.ts src/games/color-mixer/index.tsx \
  src/games/color-mixer/components/MixingZone.tsx \
  src/games/color-mixer/components/ChallengeMode.tsx \
  src/games/color-mixer/components/ColorCollection.tsx \
  src/games/color-mixer/components/DiscoveryCelebration.tsx \
  src/games/color-mixer/components/ColorNamingDialog.tsx \
  src/games/color-mixer/components/ColorPalette.tsx
git commit -m "feat(color-mixer): hybrid model — closeness discoveries/challenges, working Save, two-shelf My Colors"
```

---

## Task 10: Config background + cleanup sweep + README

**Files:**
- Modify: `src/games/color-mixer/config.ts`
- Modify: `src/games/color-mixer/README.md`
- Possibly modify: `src/games/color-mixer/components/index.ts` (drop removed exports)

- [ ] **Step 1: `config.ts` background → canvas**

```ts
backgroundColor: '#FBF3E6',
```
(accent stays `'blue'`.)

- [ ] **Step 2: Dead-export sweep**

```bash
grep -rn "ChallengePicker\|ChallengeCard\|ColorCollection\|MixingZone\|DraggableColorBlob" src/games/color-mixer
```
Ensure `components/index.ts` exports match what `index.tsx` still imports; remove exports for any component no longer used. Do not delete `ChallengePicker`/`ChallengeCard` (still used for challenge selection) unless `index.tsx` no longer references them.

- [ ] **Step 3: Update README**

Rewrite the Features/Color-System sections to describe the hybrid model (continuous RGB blend, closeness-based discoveries + challenges, two-shelf My Colors), and remove the now-false "recipes" table (or recast it as "natural ingredient hints"). Update the file-structure notes for `utils/match.ts`.

- [ ] **Step 4: Typecheck + test + commit**

Run: `npx tsc --noEmit` → no output.
Run: `CI=1 npx jest --watchAll=false` → all pass.

```bash
git add src/games/color-mixer/config.ts src/games/color-mixer/README.md \
  src/games/color-mixer/components/index.ts
git commit -m "chore(color-mixer): canvas background, prune dead exports, refresh README"
```

---

## Final verification

- [ ] `npx tsc --noEmit` — clean
- [ ] `CI=1 npx jest --watchAll=false` — all suites pass (match reachability green)
- [ ] `npx expo export --platform ios` — bundles with no errors
- [ ] Manual smoke (if device available): mix red+yellow → discover Orange (once); open 📚 My Colors → Orange on the Famous shelf; mix + Save → appears under My creations; Challenges → meter fills, success at closeness.
