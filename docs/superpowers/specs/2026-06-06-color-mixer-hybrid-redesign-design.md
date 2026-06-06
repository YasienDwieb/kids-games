# Color Mixer — Hybrid Redesign Design Spec

**Date:** 2026-06-06
**Status:** Approved (design phase)

## Problem

`color-mixer` accreted **two parallel mixing engines**, and the older one is stranded:

- **Continuous RGB blend** (works) — dragging a color into the zone averages its hex into a running `currentMixHex`. Undo/Clear work.
- **Discrete recipe engine** (dead) — `red + yellow → Orange`, named colors, unlocking. Its resolver `mixColors()` **is never called**, so `resultColor` is always `null`.

Because the discrete engine never runs, three features are currently **non-functional**:

1. **Challenges** — success is `resultColor === target`, but `resultColor` is always `null`, so a challenge can never complete.
2. **Collection** (📚) — colors unlock only inside `mixColors()`, so it is stuck at the 5 primaries; the other 6 read `???` forever.
3. **"My Colors" saving** — `saveCurrentMix()` and `ColorNamingDialog` exist but are never rendered; you can blend a color but cannot save it.

There is also a **naming clash**: the 📚 modal is titled "My Colors" but shows the *named-recipe sticker book*, while the real saved-RGB colors are a separate (also unreachable) concept.

The visual layer also predates the project's warm design system (raw hex, system fonts, ad-hoc controls).

This redesign unifies the game on the continuous engine, makes the goal/collection/save features actually work, and applies the design system — in one pass, so we don't reskin dead UI.

## Goals

- One coherent **Hybrid** model on the continuous RGB engine:
  - Blending near a "famous" color **discovers** it (learning milestone, celebrated once).
  - **Challenges** = "make this color", judged by **closeness** to a target, with a live meter.
  - **My Colors** = save & name your custom blends.
- A single **"My Colors" book** with two shelves: *Famous colors* (discovery set, locked slots) and *My creations* (saved customs). Resolves the naming clash.
- Persist discoveries alongside saved colors.
- Apply the design system (tokens, `FONTS`, **blue** accent, shared primitives).
- Retire the dead discrete-recipe code. Net simpler.

## Non-Goals

- New famous colors beyond the current 6 (orange, green, purple, pink, light-blue, brown).
- Sound/asset changes; navigation/shell changes (stays bare-mode).
- A "collect-then-press-Mix" interaction — we keep the tactile continuous running blend.
- Pigment-accurate (subtractive) color science. We use a tuned RGB blend + generous threshold.

## Color model & matching

**Famous set** = the 6 non-primary `ColorId`s. Targets carry a canonical hex (in `COLORS`).

Add a pure helper module `utils/match.ts`:

- `colorDistance(a: string, b: string): number` — perceptual-ish weighted RGB distance ("redmean" approximation) over two hex strings.
- `nearestFamous(hex, withinThreshold): ColorId | null` — closest famous color whose distance is under `MATCH_THRESHOLD`, else `null`.
- `closeness(hex, targetHex): number` — `0..1` (1 = exact) derived from `colorDistance`, used **only** for the challenge meter's display.

A single `MATCH_THRESHOLD` (in `constants.ts`, tuned **generously** for ages 4–8) governs both discovery and challenge success — a blend "matches" when `colorDistance < MATCH_THRESHOLD`. `closeness()` is presentation-only and does not define success.

### Calibration (known risk)

A naive 0.5 average makes some pairs muddy (yellow+blue → olive, not vivid green), which could make a famous color hard to reach or ugly. Mitigations, applied during implementation and validated by a unit test:

1. Re-tune each famous **target hex** in `COLORS` to what the blend actually yields for its intuitive recipe, and/or
2. Adjust the blend weight / add a slight saturation boost so mixes stay vivid.

**Acceptance:** a unit test asserts each of the 6 famous colors is reachable — i.e. there exists a 2-color average within `MATCH_THRESHOLD` of its target hex. If any fails, tune target/threshold until it passes. This test is the guard rail for the calibration.

## Mixing interaction (continuous stays)

`useColorMixer` keeps `currentMixHex`, `addColorToContinuousMix`, `undoLastMix`, `clearContinuousMix`, `savedColors`, `saveCurrentMix`, `deleteSavedColor`.

New behavior:

- A `discoveries: ColorId[]` state, hydrated from the store.
- After each blend update, compute `nearestFamous(currentMixHex)`. If it returns a color **not yet in `discoveries`**, add it, persist, and set `newDiscovery` to trigger `DiscoveryCelebration` (once per color, ever).
- **Wire up saving:** the result blob gets a **Save** affordance → renders the existing `ColorNamingDialog` → `saveCurrentMix(name)`.

Removed: `addColorToZone`, `colorsInZone`, `mixColors`, `findRecipe`, `discoveredRecipes`, `mixFailed`, and the recipe constants — the discrete path.

## Challenges (closeness-based)

`useChallengeMode` keeps challenge selection/completion tracking. `CHALLENGES` stays (6 puzzles, each targeting a famous color).

- `ChallengeMode` receives `currentMixHex` (not `resultColor`).
- Success = `colorDistance(currentMixHex, targetHex) < MATCH_THRESHOLD` (same rule as discovery). On success: celebrate, mark complete.
- Live **closeness meter** under the target swatch ("Keep mixing… Getting warmer… So close!") driven by `closeness()`.
- Hints unchanged.

`completedChallenges` persists to the store (today it is in-memory only) so progress survives relaunch.

## "My Colors" book — one book, two shelves

`ColorCollection` → renamed/retitled **My Colors**, a single modal with two sections:

- **Famous colors** — 6 slots; discovered show the swatch + name, undiscovered show a locked `?` with the existing `DISCOVERY_HINTS`. Header progress "`n`/6 found".
- **My creations** — saved custom blends (swatch + name), each deletable (`deleteSavedColor`). Empty state invites: "Mix a color and tap Save!"

Driven by `discoveries` + `savedColors` from the hook.

## Persistence

Extend the existing `color-mixer` store value:

```ts
createStore('color-mixer', {
  savedColors: [] as SavedColor[],
  discoveries: [] as ColorId[],
  completedChallenges: [] as string[],
})
```

Loaded on mount; written on discovery, save, delete, and challenge completion. Back-compat: missing keys default to `[]`.

## Visual redesign (design system)

Apply per the documented adherence rules (CLAUDE.md / kids-games-dev skill), **blue** accent (the game's config accent):

- Background → `COLORS.canvas`; text → `FONTS` + ink tokens.
- Header → title + a **My Colors** `IconButton` (📚). Bare-mode floating `BackButton` stays.
- Mode toggle (Free Play / Challenges) → `Chip` segmented row.
- Result + celebrations (`DiscoveryCelebration`, challenge success) → design modal style: `surface` card, `SHADOWS.lg`, `BORDER_RADIUS.tile`, `FONTS`, `Star` where stars apply, `PressableButton` (blue) CTAs, `COLORS.overlay` scrim.
- Action buttons (Undo/Clear/Save) → consistent token-based styling; Save is the primary (blue) action.
- `MixingZone` → keep the drop target + running-blend blob; drop the pre-mix ingredient orbit and spin.

## Code cleanup (retire dead discrete path)

Remove: `mixColors`, `findRecipe`, `makeRecipeKey`, `allSameColor`, `addColorToZone`, `discoveredRecipes`, `mixFailed`, `MixFailReason`; `COLOR_RECIPES`; discrete fields on the `MixingZone` type and component (`colorsInZone`, `resultColor`, `isMixing` pre-mix orbit). Keep `COLORS`, `DISCOVERY_HINTS`, `CHALLENGES`, `DIMENSIONS`, `TIMING`. The **Famous shelf** derives its 6 entries directly from the non-primary `ColorId`s (the `isPrimary === false` colors), so `COLOR_GROUPS` can be dropped.

## File-by-file impact

| File | Change |
|------|--------|
| `utils/match.ts` (new) | `colorDistance`, `nearestFamous`, `closeness` |
| `utils/index.ts` | export match helpers |
| `constants.ts` | add `MATCH_THRESHOLD`, tune famous hexes; remove `COLOR_RECIPES`/`COLOR_GROUPS`; `GAME_BG` → canvas |
| `hooks/useColorMixer.ts` | add `discoveries` + persistence; closeness-based discovery; drop discrete engine |
| `hooks/useChallengeMode.ts` | closeness success; persist `completedChallenges` |
| `index.tsx` | wire Save dialog; pass `currentMixHex` to challenge; design-system layout; remove discrete drops |
| `components/MixingZone.tsx` | running-blend only; Save affordance; restyle |
| `components/ChallengeMode.tsx` | closeness meter + success on closeness; restyle |
| `components/ColorCollection.tsx` | → "My Colors" two-shelf book; restyle |
| `components/DiscoveryCelebration.tsx` | restyle to design modal |
| `components/ColorNamingDialog.tsx` | wire in; restyle |
| `config.ts` | `backgroundColor` → canvas |

## Testing

- `utils/match` unit tests: distance symmetry; `nearestFamous` threshold; **reachability** of all 6 famous colors (calibration guard).
- `useChallengeMode` (or a pure closeness helper) test: success fires when within threshold, not before.
- Existing suite stays green; `npx tsc --noEmit` clean; `npx expo export` bundles.

## Open risks

- **Color reachability/calibration** (above) — the unit test is the guard; may require a couple of hex/threshold iterations.
- **Path-dependence** of the running blend (adding a 3rd color muddies). Acceptable: Clear resets; the challenge meter guides. Not solving mid-mix history beyond existing Undo.
