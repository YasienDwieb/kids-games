---
title: Coverage Map
summary: Frozen page inventory for this first wiki build.
topics: [build, wiki, reference]
sources: []
---

# Coverage Map

This map is the frozen contract for the first CodeAlmanac wiki build of the
`kids-games` (shipped product name "Kids Zone") repository: a multi-game Expo
/ React Native app for children, built around a shared `@/sdk` platform core,
a per-game module pattern, and a separate cross-game "flow" guided-play
engine.

## Page Inventory

### Root

- path: `almanac/getting-started.md`
  slug: `getting-started`
  purpose: Front door for the wiki — orients a new agent to the repo's shape (games vs SDK vs flow), points to the densest clusters, and routes to the right page for common work (add a game, fix i18n, ship a build).
  planned links: concepts/sdk-boundary, concepts/game-module, concepts/flow, architecture/app-entry-and-navigation, guides/add-a-new-game, reference/games-catalog
  evidence: README.md, CLAUDE.md, src/games/index.ts, App.tsx

### concepts/

- path: `almanac/concepts/sdk-boundary.md`
  slug: `sdk-boundary`
  purpose: Explains the `@/sdk` single-import-surface rule that isolates every game from every other game and from deep `src/` paths, and the narrow `_shared/listen-find` exception.
  planned links: concepts/game-module, architecture/game-registry, decisions/sdk-only-import-boundary
  evidence: CLAUDE.md, CONTRIBUTING.md, src/games/_shared/listen-find/, src/sdk/index.ts

- path: `almanac/concepts/game-module.md`
  slug: `game-module`
  purpose: Defines what a "game" is in this codebase — a self-contained folder with `config.ts`, `index.tsx`, and per-game locale files that self-registers into a central registry.
  planned links: concepts/sdk-boundary, architecture/game-registry, guides/add-a-new-game, reference/game-config-schema, reference/games-catalog
  evidence: src/games/HOW_TO_ADD_GAME.md, src/games/_template/, src/games/index.ts, src/sdk/config/registry.ts

- path: `almanac/concepts/flow.md`
  slug: `flow`
  purpose: Defines the "flow" concept — a guided, scoreless, cross-game activity sequence distinct from picking and playing one game — and why the product needs it.
  planned links: concepts/game-module, architecture/flow-engine, decisions/flow-as-separate-engine, guides/add-a-game-to-flow
  evidence: src/flow/index.ts, src/sdk/flow/, src/screens/FlowPlayerScreen.tsx, docs/FOUR_NEW_GAMES_DESIGN.md

- path: `almanac/concepts/age-bands.md`
  slug: `age-bands`
  purpose: Explains the age-band model (toddler/preschool/early/kids) that groups games for Home filtering and Settings, and how bands are derived from or override a game's `ageRange`.
  planned links: concepts/game-module, reference/games-catalog, architecture/game-registry
  evidence: src/sdk/age/bands.ts, src/sdk/i18n/__tests__/keys.test.ts

### architecture/

- path: `almanac/architecture/app-entry-and-navigation.md`
  slug: `app-entry-and-navigation`
  purpose: Traces the boot sequence from `index.ts` through `App.tsx` (fonts, side-effect registration imports, orientation lock, language bootstrap) into `RootNavigator` and the four screens.
  planned links: concepts/game-module, concepts/flow, architecture/i18n-and-rtl, decisions/landscape-orientation-lock
  evidence: index.ts, App.tsx, src/app/navigation/RootNavigator.tsx, src/screens/HomeScreen.tsx, src/screens/GamePlayerScreen.tsx, src/screens/FlowPlayerScreen.tsx, app.json

- path: `almanac/architecture/game-registry.md`
  slug: `game-registry`
  purpose: Explains the in-memory game registry (`registerGame`/`getGame`/`getAllGames`/`getGamesForAge`), its validation rules, and how `src/games/index.ts` wires every game in via side-effect imports.
  planned links: concepts/game-module, concepts/sdk-boundary, reference/game-config-schema, guides/add-a-new-game
  evidence: src/sdk/config/registry.ts, src/sdk/config/types.ts, src/sdk/config/__tests__/validate.test.ts, src/games/index.ts

- path: `almanac/architecture/game-shell-and-back-navigation.md`
  slug: `game-shell-and-back-navigation`
  purpose: Explains `GameShell`/`useGameShell` chrome, the `shell` vs `bare` layout modes handled by `GamePlayerScreen`, and the `ScreenBackContext`/`useScreenBack` protocol that lets a game intercept both on-screen and Android hardware back presses.
  planned links: architecture/game-registry, reference/game-config-schema, concepts/game-module
  evidence: src/sdk/layout/GameShell.tsx, src/sdk/layout/ScreenBackContext.tsx, src/screens/GamePlayerScreen.tsx

- path: `almanac/architecture/audio-and-speech.md`
  slug: `audio-and-speech`
  purpose: Explains the intent-based sound system (`useSound`, `useLoopSound`) built on `expo-audio`, the `useSpeech` TTS wrapper, and how both resolve against the shared asset manifest's tag vocabulary.
  planned links: reference/asset-manifest-tags, architecture/storage-and-progress, guides/add-a-game-asset
  evidence: src/sdk/audio/useSound.ts, src/sdk/audio/useLoopSound.ts, src/sdk/speech/useSpeech.ts, src/sdk/assets/query.ts, src/sdk/assets/manifest.ts, CLAUDE.md

- path: `almanac/architecture/storage-and-progress.md`
  slug: `storage-and-progress`
  purpose: Explains the `createStore` AsyncStorage primitive and the two systems built on it — per-game level/resume progress (`useLevels`, `resumeStatusFor`, `ResumePrompt`) and app settings (`useSettings`).
  planned links: reference/storage-keys, reference/settings-schema, concepts/game-module
  evidence: src/sdk/storage/createStore.ts, src/sdk/progress/store.ts, src/sdk/progress/status.ts, src/sdk/progress/useLevels.ts, src/sdk/progress/source.ts, src/sdk/settings/store.ts

- path: `almanac/architecture/i18n-and-rtl.md`
  slug: `i18n-and-rtl`
  purpose: Explains the shared i18next instance, the per-game `registerTranslations` namespace pattern, RTL/Arabic support, and the `keys.test.ts` guard that catches typo'd translation keys statically-untypeable tools would miss.
  planned links: concepts/game-module, decisions/rtl-font-selection, guides/add-a-translated-string
  evidence: src/sdk/i18n/index.ts, src/sdk/i18n/useLanguage.ts, src/sdk/i18n/__tests__/keys.test.ts, src/games/I18N_CONTRACT.md, src/constants/typography.ts

- path: `almanac/architecture/flow-engine.md`
  slug: `flow-engine`
  purpose: Explains the guided-journey engine — flow adapters, sequence building, resumable seeded progress, and `FlowPlayerScreen` — as a system parallel to but independent from the per-game registry and progress store.
  planned links: concepts/flow, architecture/game-registry, architecture/storage-and-progress, decisions/flow-as-separate-engine, guides/add-a-game-to-flow
  evidence: src/sdk/flow/adapter.ts, src/sdk/flow/sequence.ts, src/sdk/flow/progress.ts, src/sdk/flow/useFlow.ts, src/flow/index.ts, src/screens/FlowPlayerScreen.tsx

- path: `almanac/architecture/design-system.md`
  slug: `design-system`
  purpose: Explains the warm-cream token system (`COLORS`, `ACCENTS`, `SPACING`, `FONTS`, `SHADOWS`, `TOUCH_TARGET`) and the shared component primitives every screen and game must build from instead of hand-rolled styling.
  planned links: concepts/game-module, architecture/i18n-and-rtl
  evidence: src/constants/colors.ts, src/constants/dimensions.ts, src/constants/typography.ts, src/components/common/PressableButton.tsx, src/components/common/GameCard.tsx, src/components/common/AppBar.tsx

### guides/

- path: `almanac/guides/add-a-new-game.md`
  slug: `add-a-new-game`
  purpose: Walks a maintainer through scaffolding, registering, and localizing a brand-new game from `src/games/_template`.
  planned links: concepts/game-module, architecture/game-registry, reference/game-config-schema, guides/add-a-translated-string
  evidence: src/games/HOW_TO_ADD_GAME.md, src/games/_template/, src/games/I18N_CONTRACT.md, src/games/index.ts

- path: `almanac/guides/add-a-game-to-flow.md`
  slug: `add-a-game-to-flow`
  purpose: Walks a maintainer through making an existing game flow-eligible by writing a `flow.tsx` adapter that reuses its board component in scoreless form.
  planned links: concepts/flow, architecture/flow-engine, guides/add-a-new-game
  evidence: src/games/animal-safari/flow.tsx, src/flow/index.ts, src/sdk/flow/adapter.ts, src/sdk/flow/useFlowRound.ts

- path: `almanac/guides/add-a-translated-string.md`
  slug: `add-a-translated-string`
  purpose: Walks a maintainer through adding a new user-facing string (per-game or core) and satisfying the `keys.test.ts` guard in both English and Arabic.
  planned links: architecture/i18n-and-rtl, guides/add-a-new-game
  evidence: src/games/I18N_CONTRACT.md, src/sdk/i18n/__tests__/keys.test.ts, src/sdk/i18n/locales/en.ts

- path: `almanac/guides/add-a-game-asset.md`
  slug: `add-a-game-asset`
  purpose: Walks a maintainer through adding a new tagged sound-effect asset to the manifest and adding a new bundled emoji image via the fetch script.
  planned links: architecture/audio-and-speech, reference/asset-manifest-tags
  evidence: src/sdk/assets/manifest.ts, scripts/fetch-emoji.mjs, CREDITS.md

- path: `almanac/guides/release-an-android-build.md`
  slug: `release-an-android-build`
  purpose: Walks a maintainer through producing a testable APK versus submitting a production AAB to Google Play using the two manual GitHub Actions release workflows.
  planned links: decisions/no-ci-quality-gate, reference/build-and-release-config, guides/update-the-play-store-listing
  evidence: .github/workflows/release-apk.yml, .github/workflows/release-aab.yml, eas.json, docs/SETUP.md

- path: `almanac/guides/update-the-play-store-listing.md`
  slug: `update-the-play-store-listing`
  purpose: Walks a maintainer through updating the Google Play store listing text, screenshots, and changelog with the fastlane `supply` lanes, independent of shipping a new binary.
  planned links: decisions/play-store-listing-as-code, guides/release-an-android-build, reference/licensing-and-attribution
  evidence: docs/PLAY_STORE.md, fastlane/Fastfile, fastlane/Appfile, fastlane/metadata/android/

- path: `almanac/guides/test-on-a-real-device.md`
  slug: `test-on-a-real-device`
  purpose: Walks a maintainer through verifying UI and behavior on a physical Android device via Expo Go and adb, since the repo has no automated e2e or screenshot tests.
  planned links: decisions/no-ci-quality-gate, architecture/app-entry-and-navigation
  evidence: docs/SETUP.md, jest.config.js, jest.setup.js

### decisions/

- path: `almanac/decisions/sdk-only-import-boundary.md`
  slug: `sdk-only-import-boundary`
  purpose: Records the decision that games may import only from `@/sdk` (never each other or deep `src/` paths) and the single sanctioned exception, `_shared/listen-find`.
  planned links: concepts/sdk-boundary, concepts/game-module, architecture/game-registry
  evidence: CONTRIBUTING.md, CLAUDE.md, src/games/_shared/listen-find/

- path: `almanac/decisions/flow-as-separate-engine.md`
  slug: `flow-as-separate-engine`
  purpose: Records the decision to build cross-game guided play as a parallel adapter registry and persisted checkpoint instead of extending the per-game registry or progress store.
  planned links: concepts/flow, architecture/flow-engine, architecture/game-registry, architecture/storage-and-progress
  evidence: src/sdk/flow/adapter.ts, src/sdk/flow/progress.ts, src/sdk/settings/store.ts

- path: `almanac/decisions/rtl-font-selection.md`
  slug: `rtl-font-selection`
  purpose: Records the decision to key font-family selection off `I18nManager.isRTL` rather than `i18n.language`, and the consequence that a language switch requires a full app reload.
  planned links: architecture/i18n-and-rtl, architecture/design-system
  evidence: src/constants/typography.ts, src/sdk/i18n/reload.ts, CLAUDE.md

- path: `almanac/decisions/landscape-orientation-lock.md`
  slug: `landscape-orientation-lock`
  purpose: Records the decision to lock the app to landscape using both `app.json`'s manifest-level orientation and a runtime `expo-screen-orientation` sensor-landscape lock, skipped on web.
  planned links: architecture/app-entry-and-navigation
  evidence: App.tsx, app.json

- path: `almanac/decisions/play-store-listing-as-code.md`
  slug: `play-store-listing-as-code`
  purpose: Records the decision to manage the Google Play listing (text, screenshots, changelog) as repo-committed fastlane metadata, decoupled from the EAS binary build/submit pipeline.
  planned links: guides/update-the-play-store-listing, reference/build-and-release-config
  evidence: docs/PLAY_STORE.md, fastlane/Fastfile, eas.json

- path: `almanac/decisions/no-ci-quality-gate.md`
  slug: `no-ci-quality-gate`
  purpose: Records that this repo runs no automated PR/push CI for typecheck or tests — the two GitHub Actions workflows are manual release pipelines only — and that quality checks are a documented developer responsibility before pushing.
  planned links: guides/release-an-android-build, guides/test-on-a-real-device
  evidence: .github/workflows/release-apk.yml, .github/workflows/release-aab.yml, CONTRIBUTING.md, docs/SETUP.md

- path: `almanac/decisions/kids-zone-product-name.md`
  slug: `kids-zone-product-name`
  purpose: Records that the shipped app trades under the name "Kids Zone" (`dev.waybeyond.kidszone`, Xcode project `KidsZone`) while the repository, license, and trademark notice use the name "Kids Games."
  planned links: reference/licensing-and-attribution, reference/build-and-release-config
  evidence: app.json, android/app/build.gradle, ios/KidsZone.xcodeproj, NOTICE

### reference/

- path: `almanac/reference/game-config-schema.md`
  slug: `game-config-schema`
  purpose: Exact `GameConfig` field list, validation rules enforced by `registerGame`, and the `layout.mode` enum.
  planned links: architecture/game-registry, architecture/game-shell-and-back-navigation, guides/add-a-new-game
  evidence: src/sdk/config/types.ts, src/sdk/config/registry.ts, src/sdk/config/__tests__/validate.test.ts

- path: `almanac/reference/games-catalog.md`
  slug: `games-catalog`
  purpose: Exact table of all 11 registered games with id, age range, accent, layout mode, and flow eligibility.
  planned links: concepts/game-module, concepts/age-bands, architecture/flow-engine
  evidence: src/games/index.ts, src/flow/index.ts, individual games' config.ts files

- path: `almanac/reference/sdk-public-api.md`
  slug: `sdk-public-api`
  purpose: Organized lookup of everything the `@/sdk` barrel exports, grouped by subsystem.
  planned links: concepts/sdk-boundary, architecture/game-registry, architecture/audio-and-speech, architecture/storage-and-progress, architecture/i18n-and-rtl, architecture/flow-engine
  evidence: src/sdk/index.ts, src/sdk/__tests__/alias.test.ts

- path: `almanac/reference/settings-schema.md`
  slug: `settings-schema`
  purpose: Exact `Settings` type fields and defaults persisted by the settings store.
  planned links: architecture/storage-and-progress, architecture/flow-engine, reference/storage-keys
  evidence: src/sdk/settings/store.ts, src/screens/SettingsScreen.tsx

- path: `almanac/reference/storage-keys.md`
  slug: `storage-keys`
  purpose: Exact list of AsyncStorage namespace keys (`kg:settings`, `kg:progress:<gameId>`, `kg:flow:progress`) and which subsystem owns each.
  planned links: architecture/storage-and-progress, architecture/flow-engine, reference/settings-schema
  evidence: src/sdk/storage/createStore.ts, src/sdk/progress/store.ts, src/sdk/flow/progress.ts, src/sdk/settings/store.ts

- path: `almanac/reference/asset-manifest-tags.md`
  slug: `asset-manifest-tags`
  purpose: Exact sound-intent tag vocabulary and asset-entry shape used by `useSound`/`useLoopSound`/`pickAsset`.
  planned links: architecture/audio-and-speech, guides/add-a-game-asset
  evidence: src/sdk/assets/manifest.ts, src/sdk/assets/types.ts, src/sdk/assets/query.ts, CLAUDE.md

- path: `almanac/reference/build-and-release-config.md`
  slug: `build-and-release-config`
  purpose: Exact EAS build profiles, key `app.json` fields, and package.json scripts relevant to building and releasing the app.
  planned links: guides/release-an-android-build, decisions/play-store-listing-as-code, decisions/kids-zone-product-name
  evidence: eas.json, app.json, package.json

- path: `almanac/reference/licensing-and-attribution.md`
  slug: `licensing-and-attribution`
  purpose: Exact Apache-2.0 terms, the "Kids Games" trademark reservation, the NOTICE attribution requirement, and the third-party asset credits.
  planned links: decisions/kids-zone-product-name, guides/update-the-play-store-listing
  evidence: LICENSE, NOTICE, CREDITS.md

## Removed Pages

None removed during Phase 1. All planned pages above were written in Phase 2
unless a later note in this section records a repo-evidence reason for
dropping one.
