# Kids Games — SDK Platform Core Design

**Date:** 2026-06-02
**Status:** Approved (design)

## Goal

Evolve Kids Games from a loose collection of self-contained game modules into a
**platform** where each game is a **plugin** consuming one stable, documented
surface — the **Game SDK**. This serves three long-term goals:

1. **AI-built games** — a single, discoverable contract plus an asset registry
   that can be queried by intent, so an AI assistant can scaffold games and pick
   the right assets reliably.
2. **Parental control & open-source contribution** — parents can build, control,
   and share games for their children; contributed games must register safely.
3. **Consistency with low boilerplate** — shared layout, audio, and persistence
   remove the per-game duplication that exists today.

## Architectural principle

A thin **Game SDK platform core** (`src/sdk/`) re-exports every shared
capability behind one import surface. Games depend **only** on `@/sdk` — never on
another game, never deep into `src/`. This applies the open/closed plugin pattern:
the platform is closed for modification by games, open for extension via new game
plugins and new asset entries.

Rejected alternatives:
- **Loose shared utilities** (helpers scattered across existing folders) — no single
  contract surface; weak for AI discovery and contributor onboarding.
- **Formal plugin framework** (per-game JSON manifests, filesystem/dynamic
  registration, lifecycle hooks) — over-engineered for a kids' app; violates YAGNI.

## Scope

In scope (all confirmed):
- Unified layout (`GameShell`) with per-piece overrides + bare-mode escape hatch.
- Typed asset registry + manifest with an intent **tag vocabulary**.
- Shared sound/haptics service.
- Shared persistence helper.
- Settings & parental controls (minimal: sound/haptics toggles + age-band filter).
- Contribution & schema guardrails (hand-rolled validation + docs).
- Age bands layered over the existing numeric `ageRange`.
- An AI skill (knowledge + decision guidance) shipped in the repo.

Out of scope (deferred): i18n/localization, per-game lifecycle hooks, dynamic
filesystem game discovery, CI pipeline, child-profile/multi-user features,
analytics, a `zod` dependency.

---

## 1. SDK platform core — directory & surface

```
src/sdk/
  index.ts            single import surface: re-exports everything below
  layout/             GameShell + primitives (GameHeader, GameOverlay), useGameShell
  assets/             manifest.ts (typed registry) + query helpers + media files
                        audio/  images/  icons/  textures/
  audio/              useSound() — sound + haptics service
  storage/            createStore<T>() AsyncStorage wrapper
  age/                bands.ts + helpers
  config/             GameConfig type, validateGameConfig, registry (registerGame, getGame, ...)
```

- Games import from one place: `import { GameShell, useSound, createStore } from '@/sdk'`.
- The SDK **re-exports** existing design tokens (`COLORS`, `SPACING`, `BORDER_RADIUS`,
  `TOUCH_TARGET`, `FONT_SIZES`) so games have a single surface; `src/constants`
  remains the implementation.
- The existing registry (`src/games/registry.ts`) moves under `sdk/config/` keeping
  its current API (`registerGame`, `getGame`, `getAllGames`, `getGamesForAge`).
- Add a `@/sdk` (and `@/*`) path alias in `tsconfig.json`, plus
  `babel-plugin-module-resolver` if Metro requires it for runtime resolution.

**Contract rule:** games depend only on `@/sdk`. Cross-game imports and deep
`src/` reaches are disallowed (documented in the skill and CONTRIBUTING).

---

## 2. Unified layout — `GameShell`

`GamePlayerScreen` renders the shell by default, driven by each game's optional
`layout` config. Games override per-piece or take full control via bare mode.

```tsx
<GameShell
  title="Color Mixer"        // optional header title
  background="#F5F5F5"
  showBack                   // default true
  header={<ScoreBadge />}    // optional custom header slot
  onPause={...}              // shows pause button when provided
>
  {children /* the game */}
</GameShell>
```

**Pushing state up into the shell** (score, progress, overlays) via a light context:

```tsx
const { setScore, showOverlay, hideOverlay } = useGameShell();
```

Standardized overlay slots: `loading`, `win`, `pause`, `error`. Games call
`showOverlay('win', <WinScreen/>)` instead of re-implementing modal logic.

**Override model:**
- Default: `GamePlayerScreen` wraps the game in `GameShell` using `config.layout` props.
- Opt-out: `config.layout = { mode: 'bare' }` → game receives a raw safe-area canvas
  and composes `GameShell` / primitives itself for full control.

Eliminates today's duplication where each game re-implements safe area, back button,
and win modal, while keeping an escape hatch for rich custom UIs.

---

## 3. Asset registry + manifest

Consolidate assets (delete the leftover `.zip`, move game sounds out of
`src/games/assets/`):

```
src/sdk/assets/
  audio/  images/  icons/  textures/
  manifest.ts
```

`manifest.ts` exports typed entries carrying intent **tags** so both code and AI
pick by meaning, not filename:

```ts
export const ASSETS = {
  'sfx.pop':     { module: require('./audio/Blip1.wav'),        type: 'audio', tags: ['pop','flip','tap','ui'] },
  'sfx.success': { module: require('./audio/Powerup3.wav'),     type: 'audio', tags: ['success','match','reward'] },
  'sfx.win':     { module: require('./audio/Laser-weapon1.wav'),type: 'audio', tags: ['win','celebration','complete'] },
  'sfx.wrong':   { module: require('./audio/sfx-jump.wav'),     type: 'audio', tags: ['wrong','mismatch','error'] },
} as const;
```

Query helpers:
```ts
getAsset('sfx.success')                        // by id, typed
findAssets({ type: 'audio', tags: ['win'] })   // by intent
pickAsset('celebration')                       // best single match for an intent
```

The skill documents a **controlled tag vocabulary** (e.g. `success`, `wrong`, `pop`,
`win`, `celebration`, `tap`, `ui`, `reward`, `error`) so picks stay consistent as
the library grows. Adding an asset = adding a tagged manifest entry.

---

## 4. Audio + haptics service

One hook resolving intents through the manifest, respecting global settings:

```ts
const sound = useSound();
sound.play('success');                 // resolves via tag → plays + default haptic
sound.play('pop', { haptic: false });
```

- Wraps `expo-av` + `expo-haptics` (`npx expo install expo-haptics`).
- Owns load/cache/unload once (logic currently duplicated in
  `simple-pairs/useGameSounds`).
- Reads sound/haptics on-off from storage-backed settings; silently no-ops when off
  (graceful degradation, matching today's behaviour — games work without sound).
- `simple-pairs` migrates: `playFlip()` → `play('pop')`, `playMatch()` → `play('success')`,
  `playMismatch()` → `play('wrong')`, `playWin()` → `play('win')`.

---

## 5. Storage helper

Typed, namespaced wrapper over AsyncStorage so contributed games can't collide:

```ts
const store = createStore('color-mixer', { savedColors: [] as Color[] });
await store.get();      // typed, returns default if unset
await store.set({ ... });
store.subscribe(fn);    // optional reactivity
```

- Auto-namespaces keys (e.g. `kg:color-mixer:savedColors`) preventing cross-game clashes.
- Settings uses the same helper under a reserved `settings` namespace.
- `color-mixer` migrates its hand-rolled AsyncStorage usage to this helper.

---

## 6. Age bands + `GameConfig` enrichment + validation

Named bands layered over the existing numeric `ageRange` (kept as source of truth):

```ts
// src/sdk/age/bands.ts
export const AGE_BANDS = [
  { id: 'toddler',   label: 'Toddler',     min: 2, max: 3 },
  { id: 'preschool', label: 'Preschool',   min: 3, max: 5 },
  { id: 'early',     label: 'Early years', min: 5, max: 7 },
  { id: 'kids',      label: 'Big kids',    min: 7, max: 10 },
] as const;

bandsForGame(config)   // derive overlapping bands from ageRange
gamesForBand(bandId)   // for Home filtering
```

`GameConfig` gains optional, backward-compatible fields (existing games unchanged):

```ts
type GameConfig = {
  id; name; description; icon; ageRange; component; backgroundColor;
  tags?: string[];                // content tags ('colors','memory','no-reading')
  layout?: GameLayoutOptions;     // shell overrides / { mode: 'bare' }
  bands?: string[];               // optional explicit band override
  version?: string; author?: string;  // open-source provenance
};
```

**Validation:** `registerGame()` runs a small hand-rolled `validateGameConfig()` —
checks required fields, id uniqueness + format, valid `ageRange` (min ≤ max),
component present — throwing a clear, contributor-friendly error. No `zod`
dependency (keeps bundle lean); trivially swappable later.

---

## 7. Settings & Home filter (minimal)

- **`SettingsScreen`** (route already in `RootStackParamList`): sound on/off,
  haptics on/off, age-band filter. Persisted via the storage helper. Reachable from
  Home via a gear icon.
- **HomeScreen**: optional age-band filter chips; respects the saved band filter via
  `gamesForBand()`. Existing empty state ("No games yet! 🎮") preserved.

Deliberately minimal — no further settings surface.

---

## 8. The AI skill (knowledge + decision guidance)

Lives in the repo at `.claude/skills/kids-games-dev/SKILL.md` (version-controlled,
ships with the open-source repo so contributors' AI assistants inherit it). Teaches:

- The SDK contract & import surface; the plugin/platform model and the
  "depend only on `@/sdk`" rule.
- How to scaffold a game from `_template` (updated to use the SDK).
- How to pick assets: query the manifest by intent/tag, the controlled vocabulary,
  and when to reuse vs. add a new tagged asset.
- Age bands, the config schema, validation rules, and the add-a-game checklist.
- Layout decisions: default shell vs. bare mode.

The skill guides decisions; actual asset selection runs against the typed registry.

---

## 9. Migration & sequencing

Existing games migrate as proof the SDK works:
- `simple-pairs` → `useSound`, `GameShell`.
- `color-mixer` → storage helper, `GameShell` (likely bare mode given its rich UI).
- `_template` → rewritten against the SDK as the canonical reference.
- Delete `src/games/assets/` (including the `.zip`) after moving sounds into the SDK.

**Phased implementation (each phase independently reviewable):**
1. SDK skeleton + path alias + config/validation (move registry).
2. Assets (move + manifest + query helpers) + audio/haptics service + storage helper.
3. `GameShell` + layout primitives + `useGameShell` + `GamePlayerScreen` integration.
4. Age bands + Settings screen + Home filter.
5. Migrate `simple-pairs`, `color-mixer`, and `_template`.
6. AI skill + CONTRIBUTING / HOW_TO_ADD_GAME docs update.

---

## Testing

- `validateGameConfig` — unit tests for required fields, id format/uniqueness,
  invalid `ageRange`.
- Asset query helpers (`getAsset`, `findAssets`, `pickAsset`) — unit tests over a
  fixture manifest.
- Storage helper — namespacing, default fallback, get/set round-trip.
- Age helpers (`bandsForGame`, `gamesForBand`) — boundary cases at band edges.
- Migrated games — manual verification that sound, layout, and persistence behave as
  before (existing graceful-degradation when sound is off must hold).

## Risks & mitigations

- **Path-alias runtime resolution** under Metro — verify `@/sdk` resolves at runtime,
  add `babel-plugin-module-resolver` if needed (Phase 1 gate).
- **Bundling moved audio assets** — confirm Metro picks up `require()` from the new
  manifest location before deleting the old folder.
- **Scope creep in Settings** — hold the line at sound/haptics + age filter.
