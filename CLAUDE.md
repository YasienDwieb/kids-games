# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kids Games — a multi-game Expo React Native app targeting children. Each game is a self-contained module under `src/games/`. Built with Expo SDK 54, React 19, React Native 0.81, TypeScript (strict mode).

## Commands

- `npm start` / `npx expo start` — start Metro dev server
- `npx expo start --android` — launch on Android
- `npx expo start --ios` — launch on iOS
- `npx expo start --web` — launch web version
- Install new packages with `npx expo install <pkg>` (ensures SDK compatibility)

## Architecture

**Entry flow:** `index.ts` → `App.tsx` (imports `src/games/` to trigger registrations) → `NavigationContainer` → `RootNavigator`

**`src/` structure follows a modular game pattern:**

- `app/navigation/` — React Navigation setup; `RootNavigator` uses native-stack with hidden headers, screens: `Home`, `GamePlayer`
- `games/` — each game is a self-contained folder with its own `index.tsx` (entry) and `config.ts` (metadata + `registerGame()` call); may also have `components/`, `hooks/`, `utils/`
- `games/_template/` — copy this folder to scaffold a new game (not imported in `src/games/index.ts`; scaffold only)
- `screens/` — `HomeScreen` (2-column game grid with empty state), `GamePlayerScreen` (loads game by `gameId` from registry; wraps in `GameShell` unless `layout.mode === 'bare'`)
- `components/common/` — reusable child-friendly UI: `BigButton` (animated press, 80px), `GameCard` (120x120, emoji+name), `BackButton` (absolute top-left, semi-transparent), `SafeContainer` (SafeAreaView wrapper)
- `components/layout/` — layout wrappers (placeholder)
- `constants/` — `COLORS`, `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES` (child-friendly design tokens; also re-exported from `@/sdk`)
- `sdk/` — SDK platform core (see below)
- `types/` — shared TypeScript definitions
- `hooks/` — shared hooks
- `utils/` — shared helpers

**SDK platform core (`src/sdk/`) — the single import surface for games:**

All games import exclusively from `@/sdk`. The SDK exports:
- **Config & registry**: `registerGame`, `getGame`, `getAllGames`, `getGamesForAge`, `validateGameConfig`, `GameConfig` type, `GameRegistry` type
- **Layout**: `GameShell` (title bar + back button + overlay slots), `GameOverlay`, `useGameShell()` hook → `{ setScore, showOverlay, hideOverlay }`, `GameShellApi`/`GameShellProps`/`OverlaySlot` types
- **Audio**: `useSound()` → `{ play(intent, options?) }` — plays assets by intent string, respects settings/haptics; `PlayOptions` type
- **Storage**: `createStore<T>(namespace, defaultValue)` → `Store<T>` with `get`/`set`/`subscribe`
- **Settings**: `useSettings()` hook, `settingsStore`, `DEFAULT_SETTINGS`, `Settings` type (`soundEnabled`, `hapticsEnabled`, `ageBand`)
- **Age**: `AGE_BANDS` (toddler 2–3, preschool 3–5, early 5–7, kids 7–10), `bandsForGame(config)`, `gamesForBand(bandId)`, `AgeBand` type
- **Assets**: `ASSETS` manifest, `getAsset(id)`, `findAssets({ type?, tags? })`, `pickAsset(intent)`, `AssetId`/`AssetEntry`/`AssetType` types
- **Design tokens**: `COLORS`, `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`

**Asset manifest + tag vocabulary (`src/sdk/assets/manifest.ts`):**

Shared audio assets (8-bit SFX from "Sound Effects Mini Pack 1.5"), referenced by intent string via `useSound().play(intent)`. Controlled tags:
- `sfx.pop` — tags: `pop`, `flip`, `tap`, `ui`, `select`
- `sfx.success` — tags: `success`, `match`, `reward`, `correct`, `collect`
- `sfx.win` — tags: `win`, `celebration`, `complete`, `levelup`
- `sfx.wrong` — tags: `wrong`, `mismatch`, `error`, `incorrect`, `lose`
- `sfx.powerup` — tags: `powerup`, `boost`, `upgrade`
- `sfx.jump` — tags: `jump`, `hop`, `bounce`
- `sfx.transition` — tags: `transition`, `teleport`, `whoosh`, `appear`, `next`

To add an asset: drop the file in `src/sdk/assets/<type>/` and add a tagged entry to `manifest.ts`.

**Core types (`src/types/index.ts`):**

- `RootStackParamList` — navigation param list: `Home`, `GamePlayer` (takes `gameId`), `Settings`
- `ChildProfile` — player profile (for future use)

`GameConfig` and `GameRegistry` are defined in `src/sdk/config/types.ts` and re-exported from `@/sdk`.

**Game registry (`src/sdk/config/registry.ts`):**

- `registerGame(config)` — validates then adds a `GameConfig` to the central registry
- `getGame(id)` / `getAllGames()` / `getGamesForAge(age)` — query helpers
- Games self-register: each game's `config.ts` calls `registerGame()` (from `@/sdk`), then is imported in `src/games/index.ts`

**Adding a new game:** copy `src/games/_template/` to `src/games/<game-name>/`, update `config.ts` (import `registerGame` from `@/sdk`), then import the config in `src/games/index.ts`. See `src/games/HOW_TO_ADD_GAME.md` for the full guide and checklist.

**Registration flow:** `App.tsx` imports `src/games/index.ts` → that file has side-effect imports for each game's `config.ts` → each config calls `registerGame()` → `HomeScreen` calls `getAllGames()` to render the grid.

**Template (`src/games/_template/`)** includes: root component (`index.tsx`) using `useSound` and `useGameShell` from `@/sdk`, and `config.ts` calling `registerGame` from `@/sdk`. The template is NOT imported in `src/games/index.ts`.

**Layout modes (controlled by `GameConfig.layout.mode`):**
- `shell` (default) — `GamePlayerScreen` wraps the game in `GameShell`; use `useGameShell()` for overlays/score
- `bare` — `GamePlayerScreen` renders only an absolute `BackButton`; game manages its own layout. Examples: `simple-pairs`, `color-mixer`

**AI skill:** `.claude/skills/kids-games-dev/SKILL.md` — covers scaffolding, SDK usage, asset selection, layout modes, age bands, and config schema. Triggers automatically in Claude Code for game-related tasks.

## Key Dependencies

- `@react-navigation/native` + `@react-navigation/native-stack` — navigation
- `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler` — navigation peer deps
- `expo-screen-orientation` — orientation control per game
- `expo-av` — sound effects and audio

## HomeScreen

- Uses `SafeContainer` for safe area insets
- 2-column `FlatList` grid of `GameCard` components
- Empty state: "No games yet! 🎮" when registry is empty
- Cards navigate to `GamePlayer` with `gameId` param
- Navigation props typed via `NativeStackScreenProps<RootStackParamList, 'Home'>`

## Configuration

- TypeScript strict mode enabled, extends `expo/tsconfig.base`
- New Architecture enabled (`newArchEnabled: true` in app.json)
- Android edge-to-edge rendering enabled
- Web not configured (no `react-dom` / `react-native-web`)
