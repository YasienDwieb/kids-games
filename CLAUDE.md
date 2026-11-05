# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kids Games — a multi-game Expo React Native app targeting children. Each game is a self-contained module under `src/games/`. Built with Expo SDK 57, React 19.2, React Native 0.86, TypeScript (strict mode).

## Commands

- `npm start` / `npx expo start` — start Metro dev server
- `npx expo start --android` — launch on Android
- `npx expo start --ios` — launch on iOS
- `npx expo start --web` — launch web version
- Install new packages with `npx expo install <pkg>` (ensures SDK compatibility)
- `eas update --channel <preview|production> --environment <same> -m "..."` — OTA JS/asset update (or the `release-ota.yml` workflow). `runtimeVersion` uses the fingerprint policy, so native changes need a store build; `preview` = GitHub APKs, `production` = store builds

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
- **Audio**: `useSound()` → `{ play(intent, options?) }` — plays assets by intent string, respects settings/haptics; `PlayOptions` type. Per-game swaps via `GameConfig.sounds` (`{ 'sfx.win': 'jingle.sax-10' }`), provided to `useSound` through `SoundOverridesContext` by `GamePlayerScreen`; `SoundOverrides` type
- **Speech**: `useSpeech()` → `{ speak(text, { language? }), stop() }` — plays the bundled clip for `"<lang>:<text>"` (Chirp 3 HD "Leda", `src/sdk/assets/audio/speech/`, map in `src/sdk/speech/clips.generated.ts`), falling back to device TTS; never muted by settings. Games build spoken text in a per-game `phrase.ts`, listed in `src/games/voiceCatalog.ts`; `npm run voice:catalog && npm run voice:generate` records clips (key `GOOGLE_TTS_API_KEY` in `.env.local`); `voiceClips.test.ts` guards coverage. `npm run voice:studio` opens the Voice Studio (listen per game, pick/re-record takes, record missing, flags with notes in `scripts/voice/flags.json` — Claude answers with `reply`, never unflags). Rules and workflow in `docs/VOICE.md`
- **Storage**: `createStore<T>(namespace, defaultValue)` → `Store<T>` with `get`/`set`/`subscribe`
- **Progress & levels**: `levelsFromList`/`levelsFromGenerator` → `LevelSource<T>`; `useLevels({ gameId, source })` → `{ status, level, data, score, isLast, start, startOver, advance, addScore, goTo }`; `createProgressStore`, `DEFAULT_PROGRESS`, `Progress`; `resumeStatusFor`, `ResumeStatus`; `ResumePrompt` (Continue/Start-over UI). Opt-in; coarse `{ level, score }` checkpoint persisted under `kg:progress:<gameId>`.
- **Feedback**: `useCelebrate()` → `celebrate('small'|'big', { praise? })` (confetti + random praise over the game, resolves when done; `CelebrationProvider` is mounted by `GamePlayerScreen`/`FlowPlayerScreen`, no-op without one) — use instead of a tap-to-continue modal after small wins. The provider also shows the comic praise burst, the `xN COMBO!` streak (`bumpCombo`/`breakCombo` in `feedback/combo.ts`; a miss through `useHintLadder` breaks it) and the full-screen "LEVEL UP!" card; `useHintLadder(roundKey)` → `{ miss(), step, firstTry, stars }` implementing the shared hint policy (`hintStepFor`: 1st miss `retry`, 2nd `highlight`, 3rd `reveal`; `starsForMisses`)
- **Tutorials**: `useFirstRun(id)` → `{ status: 'loading'|'show'|'done', complete }` (persisted under `kg:tutorial`); `<DemoHand mode="tap"|"drag" points={[{x,y}]} />` ghost-hand demo in the parent's physical coordinates (RTL-safe); `useIdle(ms, active)` → `{ idle, poke }` to re-show help when a child is stuck. Reference integrations: `mouse-maze` (first-run drag demo + idle hint), `count-and-pop` (hint ladder + celebrations)
- **Buddy & mascot**: the child picks a buddy on first launch — Lulu the owl (girl) or Zain the lion cub (boy) — via the Home `BuddyPicker`; `useBuddy()` / `useBuddyPicked()` / `chooseBuddy(id)` / `currentBuddy()` (`src/sdk/buddy`, stored as `settings.buddy`, null until picked). `Mascot` (2D poses `wave`/`cheer`/`point`/`encourage`, per buddy in `MASCOT_POSES`; `buddy` prop overrides), `MascotHelper` (corner pop-in by pose, null hides), `Lulu3D` / `Buddy3D` (each buddy's rigged semi-realistic model in `src/sdk/assets/models/`, animated by turning its bones in model space: `mood` idle/wave/cheer/encourage/point, `interactive` = tap to hop + giggle in EN/AR via `<buddy>.tap.<lang>.<n>`, drag to spin, head follows the finger; per-buddy size, wardrobe anchors and arm rest in `BUDDY_FIT`; `active={false}` pauses rendering). The 3D buddy cheers on every celebration and lives on Home and in the wardrobe; both buddies share the saved outfit (`wearing` prop overrides). Buddy-specific lines use `t(`buddy.${buddy}.…`)` (Arabic grammatical gender differs per buddy)
- **3D models** (`src/sdk/three/models.ts`): `useModel3D(source, size, fit?)` → a size-normalised clone of a bundled model (null while loading; keep a primitive fallback), `preloadModels3D(sources)`, `ModelSource` (`{ glb, rgba? }`). Textured models (e.g. Higgsfield Image to 3D) go through `Blender -b -P scripts/3d/prep_glb.py -- in.glb out.glb [--tris N] [--tex 256]`, which writes a texture-free GLB plus a raw `.rgba` texture (RN can't decode GLB images). 3D boards are drop-in renderers over the 2D game logic, lazy-loaded with the 2D view as the Suspense fallback (`mouse-maze/components/MazeStage.tsx`, Balloon Archer and Turbo Road `Playfield3D`, Simple Pairs `GameBoard3D`, Candy Catch `CatchScene3D` reading the reanimated loop's shared values, Animal Safari's `Animal3D` through ListenFindBoard's `renderImage` slot; Shape Detective uses pre-rendered clay sprites from `scripts/3d/render_shapes.py` — the cheap option when many small 3D objects share a screen). `sam_3_3d` (1 credit) is a cheap alternative to `image_to_3d` (30) for simple props; the prep script welds UV seams, smooths normals and bleeds texture islands so decimated meshes stay crack-free. Emoji art can be a texture: `new TextureLoader().load(getEmojiImage(e))` (react-three-fiber native patches TextureLoader for bundled images)
- **Levels & wardrobe** (`src/sdk/player/`): `levelInfo(stars)` (player level derived from lifetime stars; `onLevelUp` in rewards fires when it rises), `OUTFITS` / `useWearing()` / `wear(slot, id)` (hats and glasses unlocked by level, drawn on `Lulu3D`)
- **Settings**: `useSettings()` hook, `settingsStore`, `DEFAULT_SETTINGS`, `Settings` type (`soundEnabled`, `hapticsEnabled`, `ageBand`, `language`, `analyticsEnabled`)
- **Analytics**: `track(event, props)` (typed catalogue in `analytics/events.ts`), `usePlaySession(gameId, mode)` (game_start/game_end, mounted by `GamePlayerScreen`/`FlowPlayerScreen`); `round_complete` fires from `awardStars`. Vendor-neutral: backends are `AnalyticsSink`s in `src/sdk/analytics/sinks/` (only place a vendor SDK may be imported — guarded by a test), picked in `analytics/init.ts` from `EXPO_PUBLIC_ANALYTICS_*` EAS env vars (PostHog EU, anonymous). Parent opt-out in Settings. See `docs/ANALYTICS.md`
- **i18n**: `useTranslation()` → `{ t }` (call `t('<namespace>:key')`); `registerTranslations(namespace, { en, ar })` (mirrors `registerGame` — register from a per-game `i18n.ts` side-effect imported in that game's `config.ts`); `useLanguage()` → `{ language, meta, changeLanguage }`; `LANGUAGES`, `DEFAULT_LANGUAGE`, `languageMeta`, `isRTL`, `LanguageCode`; `gameName(config)`/`gameDescription(config)` (resolve `<id>:meta.name`/`meta.description`, fall back to config); `applyLanguage`/`bootstrapLanguage`/`currentLanguage`. See **Internationalization** below.
- **Age**: `AGE_BANDS` (toddler 2–3, preschool 3–5, early 5–7, kids 7–10), `bandsForGame(config)`, `gamesForBand(bandId)`, `AgeBand` type — band labels are translated via `t('ageBands.<id>')`, not the `label` field
- **Assets**: `ASSETS` manifest, `getAsset(id)`, `findAssets({ type?, tags? })`, `pickAsset(intent)`, `pickModule(intent)` (random variant), `AssetId`/`AssetEntry`/`AssetType` types
- **Design tokens** ("Pop Quest" comic-pop system): `COLORS` (cream canvas, one navy `ink` for every outline/shadow/label, grape `brand`), `POP` (named chrome colours: `zap` yellow, `grape`, `bubblegum`, `splash`, `lime`, `night`), `ACCENTS` (per-game accent families: `green`/`orange`/`coral`/`purple`/`blue`/`pink`, each `{ base, deep, tint }`) + `AccentName`, `OUTLINE` (`thin`/`base`/`thick` ink border widths + `color`), `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`, `SHADOWS` (hard offset ink `boxShadow` fragments `sm`/`md`/`lg`, no blur), `FONTS` (`display`=Lilita One, `body`/`bodySemi`/`bodyExtra`=Nunito 800/700/900; loaded in `App.tsx` via `useFonts`)
- **UI primitives**: `PressableButton` (outlined CTA that drops onto its hard shadow when pressed — the standard button) / `BigButton` (title wrapper over it), `IconButton` (outlined round control; `glyph` or `children`), `Icon` (Ionicons chrome icons; directional arrows mirror under RTL), `AppBar` (back · start-aligned title · action slot), `Chip` (pill filter), `HudPill` + `hudTextStyle` (in-game counters), `EmojiFrame` (tinted rounded emoji), `ClayEmoji` (an emoji as its 3D clay-toy picture from `src/sdk/assets/clay/`, `getClayImage`; falls back to `EmojiImage`), `Star`, `GameCard` (home tile; shows the game's illustrated `GameConfig.cover` art — or its `coverByLanguage` entry for the active language, via `gameCover(game)` — falling back to the `icon` emoji), `BackButton`, `SafeContainer`

**Design-system adherence (applies to all games & screens):** Build UI from the tokens and primitives above — do **not** hardcode hex colors, use system fonts, or hand-roll buttons/headers/shadows. Every card/panel/tile/dialog wears an ink outline (`borderWidth: OUTLINE.base`, `borderColor: OUTLINE.color`) plus a `SHADOWS.*` hard shadow; grown-up screens (Settings) keep the outline but stay calm (no motion, no loud fills). Looping motion goes through `useLoop` in `src/components/pop/motion.ts`, which honours Reduce Motion. Apply `FONTS.display` to headings/buttons and `FONTS.body*` to body text; use `SHADOWS.*` not inline shadow objects; use `ACCENTS`/`COLORS` not raw hex. Each game sets an `accent: AccentName` in its config (drives its home tile + themable controls). The chunky `PressableButton` is the default CTA; `AppBar` is the canonical header.

**Internationalization (`src/sdk/i18n/`) — English + Arabic, full RTL:**

Built on `i18next` + `react-i18next` + `expo-localization`. The app ships English and Arabic; Arabic runs with **full RTL layout mirroring**.

- **No hardcoded user-facing strings.** Every label/title/placeholder/`accessibilityLabel`/`<Text>` goes through `t()`. Keep emoji and asset-intent strings literal.
- **Per-game ownership (no shared catalog).** Each game owns `locales/en.ts` + `locales/ar.ts` + `i18n.ts`. `en.ts` exports `const en = {...} as const` plus the `GameTranslations` structural type; `ar.ts` is typed `: GameTranslations` so TS enforces matching keys (not values). `i18n.ts` calls `registerTranslations('<gameId>', { en, ar })` and is imported at the top of that game's `config.ts`. Register `meta.name`/`meta.description` so the home tile + header localize. Namespace = game `id`; call sites use `t('<id>:section.key')`. `src/games/index.ts` needs no edit.
- **Core (non-game) strings** live in `src/sdk/i18n/locales/{en,ar}.ts` under the `core` namespace (default ns — call `t('home.title')` without prefix from screens). Covers Home, Settings, GamePlayer, age-band labels, shared SDK chrome.
- **Language switch** (SettingsScreen): `useLanguage().changeLanguage(code)` persists to settings + applies to i18n; if RTL-ness changes it returns `needsReload` → show the "Switching…" notice + `reloadApp()` (`expo-updates` in prod, `DevSettings` in dev). `forceRTL` only takes effect after reload.
- **Fonts are language-aware** via `FONTS` — Latin (Lilita One/Nunito) for LTR, Baloo Bhaijaan 2 (display) + IBM Plex Sans Arabic (body) for RTL — keyed off `I18nManager.isRTL` (synchronously correct at `StyleSheet.create()` time; do **not** key UI off `i18n.language`, which isn't set until App's effect). Existing `FONTS.display` call sites need no change.
- **RTL rules for games:** absolute `left`/`right` → `start`/`end`; flip directional glyphs (`←`/`→`/`‹`/`›`) via `I18nManager.isRTL`; pin number/coordinate sequences (and physics/grid/drag coordinate math that assumes a left origin) with `direction: 'ltr'` or leave physically pinned — RN does **not** auto-mirror absolute coords or transforms.
- **Translate meaningfully, not literally** — warm, kid-friendly Arabic; Western digits for numbers.
- **Guard:** `src/sdk/i18n/__tests__/keys.test.ts` asserts every requested key resolves (≠ the raw key) in both languages — add new user-facing keys there.

**Asset manifest + tag vocabulary (`src/sdk/assets/manifest.ts`):**

Shared audio assets — soft CC0 clips from Kenney in `src/sdk/assets/audio/cc0/` (credited in root `CREDITS.md`) — referenced by intent string via `useSound().play(intent)`. Each intent carries **several interchangeable variants** in its `modules` list; `play()` picks one at random (via `pickModule`) so repeated sounds don't feel monotonous. All clips are normalized to one loudness (−25 dBFS active RMS, peak ≤ −6 dBFS) — keep new clips at that level. Controlled tags:
- `sfx.pop` — tags: `pop`, `flip`, `tap`, `ui`, `select`
- `sfx.success` — tags: `success`, `match`, `reward`, `correct`, `collect`
- `sfx.win` — tags: `win`, `celebration`, `complete`, `levelup`
- `sfx.wrong` — tags: `wrong`, `mismatch`, `error`, `incorrect`, `lose`
- `sfx.powerup` — tags: `powerup`, `boost`, `upgrade`
- `sfx.transition` — tags: `transition`, `teleport`, `whoosh`, `appear`, `next`
- `sfx.balloon` — tags: `balloon` (soft pentatonic bloop per pop)
- `sfx.hit` — tags: `hit`, `bump`, `thud`, `hurt`, `damage`
- `sfx.crash` — tags: `crash` (Turbo Road collision); `sfx.turbo` — tags: `turbo` (boost whoosh)
- `jingle.*` — 12 per-game win jingles `jingle.{pizzi,steel,sax}-{02,06,10,15}` (no tags; chosen by id in a game's `sounds` config). **Every game sets its own distinct `sounds: { 'sfx.win': 'jingle.…' }`** — guarded by `src/games/__tests__/winJingles.test.ts`.

To add an asset: drop the file(s) in `src/sdk/assets/<type>/` and add a tagged entry to `manifest.ts` with a `modules: [...]` list (one or more variants).

**Core types (`src/types/index.ts`):**

- `RootStackParamList` — navigation param list: `Home`, `GamePlayer` (takes `gameId`), `Settings`, `FlowPlayer`, `Wardrobe`
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

**Store screenshots:** `.claude/skills/store-screenshots/SKILL.md` — emulator capture (`screenshots/capture.sh`) + gallery composer (`screenshots/render.js`) for Play and App Store, en + ar.

**Wiki maintenance:** `.claude/skills/almanac-refresh/SKILL.md` — how to bring the `almanac/` CodeAlmanac wiki back in sync with the code (range ingests, sync, garden, validate).

## Key Dependencies

- `@react-navigation/native` + `@react-navigation/native-stack` — navigation
- `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler` — navigation peer deps
- `expo-screen-orientation` — orientation control per game
- `expo-audio` — sound effects and audio
- `expo-speech` — device-TTS fallback for spoken prompts without a bundled clip
- `react-native-reanimated` + `react-native-worklets` — UI-thread game motion (`@/sdk` `useGameLoop`); needs the `react-native-worklets/plugin` babel plugin last in the list, and ships only via a native/EAS build, never OTA

## HomeScreen

- Zap-yellow `PopBackdrop`; top bar: `LevelPill` (→ Wardrobe), stars pill (→ Wardrobe), sound, language, grown-ups (→ Settings)
- Start column: interactive `Lulu3D`, sized to the column
- One horizontal rail (sized by `onLayout`): the `FeaturedCard` "PLAY NOW" guided adventure, then column-major `GameCard` tiles; category `Chip`s (`GameConfig.category`: numbers/words/action/puzzles) filter it
- First launch (and once for existing players): the full-screen `BuddyPicker` until a buddy is chosen
- Portrait falls back to a stacked layout with a wrapping grid
- Navigation props typed via `NativeStackScreenProps<RootStackParamList, 'Home'>`

## Configuration

- TypeScript strict mode enabled, extends `expo/tsconfig.base`
- New Architecture enabled (`newArchEnabled: true` in app.json)
- Android edge-to-edge rendering enabled
- Web not configured (no `react-dom` / `react-native-web`)

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
