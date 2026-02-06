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
- `constants/` — colors, dimensions, app config
- `types/` — shared TypeScript definitions
- `hooks/` — shared hooks
- `utils/` — shared helpers

**Adding a new game:** copy `src/games/_template/` to `src/games/<game-name>/`, implement the game entry in `index.tsx`, and fill in `config.ts` with game metadata.

## Key Dependencies

- `@react-navigation/native` + `@react-navigation/native-stack` — navigation
- `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler` — navigation peer deps
- `expo-screen-orientation` — orientation control per game
- `expo-av` — sound effects and audio

## Configuration

- TypeScript strict mode enabled, extends `expo/tsconfig.base`
- New Architecture enabled (`newArchEnabled: true` in app.json)
- Android edge-to-edge rendering enabled
