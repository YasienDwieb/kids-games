---
title: "SDK Public API Reference"
summary: "Every symbol the @/sdk barrel exports, grouped by subsystem, with the test that guarantees none of them resolve to undefined."
topics: [reference, sdk]
sources:
  - id: sdk-barrel
    type: file
    path: src/sdk/index.ts
  - id: alias-test
    type: file
    path: src/sdk/__tests__/alias.test.ts
---

`src/sdk/index.ts` is the entire public surface of `@/sdk` — every symbol a
game or screen is allowed to import from the SDK is re-exported from this one
file, and `SDK_VERSION` (currently `'0.1.0'`) is exported alongside them as a
sanity constant [@sdk-barrel]. This page is a lookup table of that barrel,
organized by the subsystem each export belongs to, so a reader can find the
exact name, type, and origin of a symbol without opening the barrel file
itself. The subsystems mirror the architecture pages that explain *why* each
one exists: the [SDK boundary](../concepts/sdk-boundary) concept explains why
this single barrel is the only door into `@/sdk` in the first place.

## Config and registry

The registry turns a game's `config.ts` into a discoverable entry in the app's
game list; see the [Game registry](../architecture/game-registry) architecture
page for the mechanism.

| Export | Kind |
|---|---|
| `GameConfig`, `GameRegistry` | types (from `./config/types`) |
| `registerGame` | function — validates and adds a config to the registry |
| `getGame` | function — look up one game by id |
| `getAllGames` | function — every registered game |
| `getGamesForAge` | function — games matching an age |
| `validateGameConfig` | function — the validation rules `registerGame` runs |

## Design tokens

Re-exported from `src/constants/` so games have one surface instead of
reaching into `@/constants/*` directly: `COLORS`, `ACCENTS` (typed by
`AccentName`), `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`,
`SHADOWS`, and `FONTS` [@sdk-barrel].

## UI primitives

Re-exported from `@/components/common`: `PressableButton`, `BigButton`,
`IconButton`, `AppBar`, `Chip`, `HudPill` and `hudTextStyle`, `EmojiFrame`,
`EmojiImage`, `Star`, `GameCard`, `BackButton`, `SafeContainer`
[@sdk-barrel]. These are the components the `alias.test.ts` barrel-cycle guard
checks first, because `components/common` is the most cycle-prone corner of
the barrel [@alias-test].

## Assets

| Export | Kind |
|---|---|
| `ASSETS` | the manifest object, keyed by asset id |
| `AssetId` | type — union of manifest keys |
| `getAsset`, `findAssets`, `pickAsset`, `pickModule` | query functions over the manifest |
| `EMOJI_IMAGES`, `getEmojiImage` | bundled emoji PNG lookup |
| `AssetEntry`, `AssetType` | types describing one manifest entry |

The exact tag vocabulary and entry shape are documented in full on the
[Asset manifest tags](../reference/asset-manifest-tags) reference page.

## Storage

`createStore` and its `Store<T>` type are the one low-level primitive every
persisted value in the app funnels through; see
[Storage and progress](../architecture/storage-and-progress) and the
[Storage keys](../reference/storage-keys) reference for the concrete keys
built on top of it [@sdk-barrel].

## Settings

`settingsStore`, `DEFAULT_SETTINGS`, and the `Settings` type, plus the
`useSettings` hook exported further down the barrel. The exact field list and
defaults are on the [Settings schema](../reference/settings-schema) reference
page [@sdk-barrel].

## Audio and speech

| Export | Kind |
|---|---|
| `useSound` | hook — `{ play(intent, options?) }`; `PlayOptions` is its options type |
| `useLoopSound` | hook — looping variant of `useSound` |
| `useSpeech` | hook — text-to-speech wrapper; `SpeakOptions` is its options type |

Both resolve intent strings against the same asset manifest tag vocabulary;
see [Audio and speech](../architecture/audio-and-speech) [@sdk-barrel].

## Motion

`useTilt` — the one motion/orientation hook exported from the barrel
[@sdk-barrel].

## Layout

| Export | Kind |
|---|---|
| `GameShell`, `GameOverlay` | components — the shell chrome and its overlay slots |
| `useGameShell` | hook into shell state (`GameShellApi` is its return type) |
| `ScreenBackContext`, `useScreenBack`, `BackInterceptor` | the back-press interception protocol |
| `GameShellProps`, `OverlaySlot` | supporting types |

## Age

`AGE_BANDS`, `bandsForGame`, `gamesForBand`, and the `AgeBand` type — the
model that groups games for Home filtering and Settings [@sdk-barrel].

## Progress and levels

| Export | Kind |
|---|---|
| `levelsFromList`, `levelsFromGenerator` | build a `LevelSource<T>` from static data or a generator |
| `createProgressStore`, `DEFAULT_PROGRESS`, `Progress` | the per-game `{ level, score, updatedAt }` checkpoint |
| `resumeStatusFor`, `ResumeStatus` | decide whether a game should resume or start over |
| `useLevels`, `UseLevelsResult` | the level-driving hook a game's board wires into |
| `ResumePrompt`, `ResumePromptProps` | the Continue/Start-over UI |

## i18n

`useTranslation` and `Trans` are re-exported straight from `react-i18next` so
games do not need a second i18n dependency [@sdk-barrel]. Alongside them:
`registerTranslations`, `currentLanguage`, `LANGUAGES`, `DEFAULT_LANGUAGE`,
`languageMeta`, `isRTL`, `LanguageCode`, `LanguageMeta`, `useLanguage`,
`applyLanguage`, `bootstrapLanguage`, and `gameName`/`gameDescription` (which
resolve a game's localized name/description with a config fallback). See
[i18n and RTL](../architecture/i18n-and-rtl) for how the per-game
`registerTranslations` namespace pattern uses these.

## Flow engine

The barrel's last line, `export * from './flow'`, re-exports the entire
guided-play engine in one statement rather than naming each symbol
[@sdk-barrel]. That includes the adapter registry (`registerFlowAdapter`,
`eligibleGameIds`, `selectedAdapters`, `FlowAdapter`, `FlowUnit`), sequence
building (`sequenceLength`, `buildSequence`, `SeqStep`), the flow checkpoint
(`FlowProgress`, `DEFAULT_FLOW_PROGRESS`, `createFlowProgressStore`), and the
playback hooks and canvas (`useFlow`, `UseFlowResult`, `useFlowRound`,
`SceneCanvas`). The full contract for this subsystem is on the
[Flow engine](../architecture/flow-engine) architecture page.

## The barrel-cycle guard

`src/sdk/__tests__/alias.test.ts` is the enforcement mechanism behind this
whole page: it imports `@/sdk`, asserts `SDK_VERSION` equals `'0.1.0'`, and
then asserts that roughly twenty named exports — UI primitives, layout,
registry, tokens, and i18n — are all `!== undefined` immediately after the
barrel finishes loading [@alias-test]. This matters because a circular import
(an SDK-internal file importing a sibling back through the `@/sdk` barrel
instead of by direct path) does not throw at build time; it silently leaves
some exports `undefined` at access time, surfacing later as a runtime crash
like "Cannot read property 'IconButton' of undefined" [@alias-test]. The test
is the only automated guard against that failure mode, which is why every
export it names is drawn from the most cycle-prone parts of the barrel rather
than an exhaustive list of everything above.
