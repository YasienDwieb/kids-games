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

**Entry flow:** `index.ts` → `App.tsx` (registers root component via Expo)

**`src/` structure follows a modular game pattern:**

- `app/navigation/` — React Navigation setup (native-stack navigator)
- `games/` — each game is a self-contained folder with its own `index.tsx` (entry), `config.ts` (metadata: name, icon, age range), `components/`, `hooks/`, and `assets/`
- `games/_template/` — copy this folder to scaffold a new game
- `screens/` — app-level screens (home, settings — not game screens)
- `components/common/` and `components/layout/` — shared UI (buttons, cards, headers, containers)
- `constants/` — `COLORS`, `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES` (child-friendly design tokens)
- `types/` — shared TypeScript definitions (see below)
- `hooks/` — shared hooks
- `utils/` — shared helpers

**Core types (`src/types/index.ts`):**

- `GameConfig` — metadata + component for a game module (id, name, description, icon, ageRange, component, backgroundColor)
- `GameRegistry` — `Record<string, GameConfig>`, the central registry all games register into
- `RootStackParamList` — navigation param list: `Home`, `GamePlayer` (takes `gameId`), `Settings`
- `ChildProfile` — player profile (for future use)

**Game registry (`src/games/registry.ts`):**

- `registerGame(config)` — adds a `GameConfig` to the central registry
- `getGame(id)` / `getAllGames()` / `getGamesForAge(age)` — query helpers
- Games self-register: each game's `config.ts` calls `registerGame()`, then is imported in `src/games/index.ts`

**Adding a new game:** copy `src/games/_template/` to `src/games/<game-name>/`, update `config.ts` with unique id/metadata and call `registerGame()`, then import the config in `src/games/index.ts`. See `src/games/_template/README.md` for full checklist. Navigation routes to games via `GamePlayer` screen with a `gameId` param.

**Template (`src/games/_template/`)** includes: root component (`index.tsx`), `GameArea` container component, `useGameState` hook (isPlaying/score/start/pause/reset), and example config.

## Key Dependencies

- `@react-navigation/native` + `@react-navigation/native-stack` — navigation
- `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler` — navigation peer deps
- `expo-screen-orientation` — orientation control per game
- `expo-av` — sound effects and audio

## Configuration

- TypeScript strict mode enabled, extends `expo/tsconfig.base`
- New Architecture enabled (`newArchEnabled: true` in app.json)
- Android edge-to-edge rendering enabled
