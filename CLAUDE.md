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
- **Progress & levels**: `levelsFromList`/`levelsFromGenerator` → `LevelSource<T>`; `useLevels({ gameId, source })` → `{ status, level, data, score, isLast, start, startOver, advance, addScore, goTo }`; `createProgressStore`, `DEFAULT_PROGRESS`, `Progress`; `resumeStatusFor`, `ResumeStatus`; `ResumePrompt` (Continue/Start-over UI). Opt-in; coarse `{ level, score }` checkpoint persisted under `kg:progress:<gameId>`.
- **Settings**: `useSettings()` hook, `settingsStore`, `DEFAULT_SETTINGS`, `Settings` type (`soundEnabled`, `hapticsEnabled`, `ageBand`, `language`)
- **i18n**: `useTranslation()` → `{ t }` (call `t('<namespace>:key')`); `registerTranslations(namespace, { en, ar })` (mirrors `registerGame` — register from a per-game `i18n.ts` side-effect imported in that game's `config.ts`); `useLanguage()` → `{ language, meta, changeLanguage }`; `LANGUAGES`, `DEFAULT_LANGUAGE`, `languageMeta`, `isRTL`, `LanguageCode`; `gameName(config)`/`gameDescription(config)` (resolve `<id>:meta.name`/`meta.description`, fall back to config); `applyLanguage`/`bootstrapLanguage`/`currentLanguage`. See **Internationalization** below.
- **Age**: `AGE_BANDS` (toddler 2–3, preschool 3–5, early 5–7, kids 7–10), `bandsForGame(config)`, `gamesForBand(bandId)`, `AgeBand` type — band labels are translated via `t('ageBands.<id>')`, not the `label` field
- **Assets**: `ASSETS` manifest, `getAsset(id)`, `findAssets({ type?, tags? })`, `pickAsset(intent)`, `pickModule(intent)` (random variant), `AssetId`/`AssetEntry`/`AssetType` types
- **Design tokens**: `COLORS` (warm cream/ink/violet system), `ACCENTS` (per-game accent families: `green`/`orange`/`coral`/`purple`/`blue`/`pink`, each `{ base, deep, tint }`) + `AccentName`, `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`, `SHADOWS` (RN shadow fragments `sm`/`md`/`lg`), `FONTS` (`display`=Fredoka, `body`/`bodySemi`/`bodyExtra`=Nunito; loaded in `App.tsx` via `useFonts`)
- **UI primitives**: `PressableButton` (chunky tactile CTA — the standard button) / `BigButton` (title wrapper over it), `IconButton` (circular surface control), `AppBar` (back · centered title · action slot), `Chip` (pill filter), `HudPill` + `hudTextStyle` (in-game counters), `EmojiFrame` (tinted rounded emoji), `Star`, `GameCard` (home tile), `BackButton`, `SafeContainer`

**Design-system adherence (applies to all games & screens):** Build UI from the tokens and primitives above — do **not** hardcode hex colors, use system fonts, or hand-roll buttons/headers/shadows. Apply `FONTS.display` to headings/buttons and `FONTS.body*` to body text; use `SHADOWS.*` not inline shadow objects; use `ACCENTS`/`COLORS` not raw hex. Each game sets an `accent: AccentName` in its config (drives its home tile + themable controls). The chunky `PressableButton` is the default CTA; `AppBar` is the canonical header.

**Internationalization (`src/sdk/i18n/`) — English + Arabic, full RTL:**

Built on `i18next` + `react-i18next` + `expo-localization`. The app ships English and Arabic; Arabic runs with **full RTL layout mirroring**.

- **No hardcoded user-facing strings.** Every label/title/placeholder/`accessibilityLabel`/`<Text>` goes through `t()`. Keep emoji and asset-intent strings literal.
- **Per-game ownership (no shared catalog).** Each game owns `locales/en.ts` + `locales/ar.ts` + `i18n.ts`. `en.ts` exports `const en = {...} as const` plus the `GameTranslations` structural type; `ar.ts` is typed `: GameTranslations` so TS enforces matching keys (not values). `i18n.ts` calls `registerTranslations('<gameId>', { en, ar })` and is imported at the top of that game's `config.ts`. Register `meta.name`/`meta.description` so the home tile + header localize. Namespace = game `id`; call sites use `t('<id>:section.key')`. `src/games/index.ts` needs no edit.
- **Core (non-game) strings** live in `src/sdk/i18n/locales/{en,ar}.ts` under the `core` namespace (default ns — call `t('home.title')` without prefix from screens). Covers Home, Settings, GamePlayer, age-band labels, shared SDK chrome.
- **Language switch** (SettingsScreen): `useLanguage().changeLanguage(code)` persists to settings + applies to i18n; if RTL-ness changes it returns `needsReload` → show the "Switching…" notice + `reloadApp()` (`expo-updates` in prod, `DevSettings` in dev). `forceRTL` only takes effect after reload.
- **Fonts are language-aware** via `FONTS` — Latin (Fredoka/Nunito) for LTR, IBM Plex Sans Arabic for RTL — keyed off `I18nManager.isRTL` (synchronously correct at `StyleSheet.create()` time; do **not** key UI off `i18n.language`, which isn't set until App's effect). Existing `FONTS.display` call sites need no change.
- **RTL rules for games:** absolute `left`/`right` → `start`/`end`; flip directional glyphs (`←`/`→`/`‹`/`›`) via `I18nManager.isRTL`; pin number/coordinate sequences (and physics/grid/drag coordinate math that assumes a left origin) with `direction: 'ltr'` or leave physically pinned — RN does **not** auto-mirror absolute coords or transforms.
- **Translate meaningfully, not literally** — warm, kid-friendly Arabic; Western digits for numbers.
- **Guard:** `src/sdk/i18n/__tests__/keys.test.ts` asserts every requested key resolves (≠ the raw key) in both languages — add new user-facing keys there.

**Asset manifest + tag vocabulary (`src/sdk/assets/manifest.ts`):**

Shared audio assets (8-bit SFX from "Sound Effects Mini Pack 1.5"), referenced by intent string via `useSound().play(intent)`. Each intent carries **5 interchangeable variants** in its `modules` list; `play()` picks one at random (via `pickModule`) so repeated sounds don't feel monotonous. Controlled tags:
- `sfx.pop` — tags: `pop`, `flip`, `tap`, `ui`, `select`
- `sfx.success` — tags: `success`, `match`, `reward`, `correct`, `collect`
- `sfx.win` — tags: `win`, `celebration`, `complete`, `levelup`
- `sfx.wrong` — tags: `wrong`, `mismatch`, `error`, `incorrect`, `lose`
- `sfx.powerup` — tags: `powerup`, `boost`, `upgrade`
- `sfx.jump` — tags: `jump`, `hop`, `bounce`
- `sfx.transition` — tags: `transition`, `teleport`, `whoosh`, `appear`, `next`
- `sfx.explosion` — tags: `explosion`, `blast`, `boom`, `destroy`, `pop-big`
- `sfx.hit` — tags: `hit`, `bump`, `thud`, `hurt`, `damage`
- `sfx.laser` — tags: `laser`, `shoot`, `zap`, `fire`, `beam`
- `sfx.random` — tags: `random`, `misc`, `surprise`, `blip-alt`

To add an asset: drop the file(s) in `src/sdk/assets/<type>/` and add a tagged entry to `manifest.ts` with a `modules: [...]` list (one or more variants).

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
