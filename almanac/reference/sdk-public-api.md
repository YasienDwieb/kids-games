---
title: "SDK Public API Reference"
summary: "Every symbol the @/sdk barrel exports, grouped by subsystem, with the test that guarantees none of them resolve to undefined."
topics: [reference, sdk, motion]
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
`AccentName`), `POP` (named chrome colors — `zap`, `grape`, `bubblegum`,
`splash`, `lime`, `night`, and their soft/deep variants), `SPACING`,
`BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`, `SHADOWS`, `OUTLINE` (ink
border widths), and `FONTS` [@sdk-barrel]. The barrel also re-exports
`bestTextOn` and `contrastRatio`, the two contrast-math functions behind the
[WCAG AA contrast floor](../decisions/wcag-aa-contrast-floor) — any component
drawing text on an arbitrary or game-supplied fill should call `bestTextOn`
rather than hardcoding a label color [@sdk-barrel]. See
[Design system](../architecture/design-system) for what each token actually
looks like under the current "Pop Quest" visual language.

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
| `SoundOverrides` | type — `Partial<Record<AssetId, AssetId>>`, a per-game swap map used by `GameConfig.sounds` |
| `EMOJI_IMAGES`, `getEmojiImage` | bundled emoji PNG lookup |
| `CLAY_IMAGES`, `getClayImage` | bundled clay-toy PNG lookup — Higgsfield-rendered clay-toy art, resolved through the `ClayEmoji` component and used across several games (Trace It, Match Up, Count & Pop, Letter Land, Numbers Land) as an alternative to the plain emoji set; see [Licensing and attribution](../reference/licensing-and-attribution) for the generation provenance |
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
| `useSound` | hook — `{ play(intent, options?), prewarm(intents) }`; `PlayOptions` is its options type |
| `useLoopSound` | hook — looping variant of `useSound` |
| `useSpeech` | hook — text-to-speech wrapper; `SpeakOptions` is its options type |
| `SoundOverridesContext` | React context carrying the active game's `GameConfig.sounds`; provided by `GamePlayerScreen`, read by `useSound` |

Both `useSound` and `useLoopSound` resolve intent strings against the same
asset manifest tag vocabulary; see
[Audio and speech](../architecture/audio-and-speech) [@sdk-barrel]. Games
never touch `SoundOverridesContext` directly — it exists only so
`GamePlayerScreen` can hand a game's own `sounds` override map to `useSound`
without every game wiring the provider itself.

## Motion

| Export | Kind |
|---|---|
| `useTilt` | hook — device-tilt input |
| `useGameLoop` | hook — runs a worklet `step(dt, elapsed)` on every frame, on the UI thread; `GameLoopStep` and `GameLoopOptions` are its callback and options types |
| `MAX_DT`, `clampDt`, `clamp`, `lerp`, `approach`, `wrap` | worklet-safe motion math from `frame.ts` |

`useGameLoop` and the `frame.ts` helpers are the newer half of this section;
see [Motion and the game loop](../architecture/motion-and-game-loop) for the
frame-loop contract, the dt-clamp invariant, and `candy-catch` as the
reference consumer [@sdk-barrel].

## Layout

| Export | Kind |
|---|---|
| `GameShell`, `GameOverlay` | components — the shell chrome and its overlay slots |
| `useGameShell` | hook into shell state (`GameShellApi` is its return type) |
| `ScreenBackContext`, `useScreenBack`, `BackInterceptor` | the back-press interception protocol |
| `GameShellProps`, `OverlaySlot` | supporting types |

## Feedback

| Export | Kind |
|---|---|
| `CelebrationProvider` | component — mounted once by `GamePlayerScreen`/`FlowPlayerScreen`; renders every burst, the cheering mascot, and the reward toasts |
| `useCelebrate` | hook — returns `celebrate(size?, options?)`; a no-op resolving immediately when no provider is mounted |
| `PRAISE_COUNT` | the number of recorded praise lines per language `celebrate()` picks from |
| `Celebrate`, `CelebrationSize`, `CelebrateOptions` | types for the function above |
| `hintStepFor`, `starsForMisses` | pure functions implementing the shared miss-escalation and stars-per-attempt policy |
| `HintStep` | type — `'retry' \| 'highlight' \| 'reveal'` |
| `useHintLadder` | hook — per-round miss counter wired to the policy above; resets when its `roundKey` argument changes |
| `UseHintLadderResult` | its return type |

See [Celebration, combo streaks, and the hint ladder](../architecture/celebration-and-hints)
for how these fit together and what a burst actually renders.

## Tutorials

| Export | Kind |
|---|---|
| `DemoHand` | component — looping ghost-hand demo (`mode="tap"\|"drag"`), physical (non-mirrored) coordinates |
| `DemoPoint` | type — `{ x, y }` |
| `useFirstRun` | hook — persisted once-per-id gate (`status: 'loading'\|'show'\|'done'`, `complete()`) |
| `tutorialStore` | the underlying `kg:tutorial` store, `{ seen: string[] }` |
| `FirstRunStatus`, `TutorialProgress` | supporting types |
| `useIdle` | hook — `{ idle, poke }`; flips `idle` after `ms` without a `poke()` while `active` |

See [First-run tutorials](../architecture/first-run-tutorials) for how
`mouse-maze` wires all three together.

## Rewards

| Export | Kind |
|---|---|
| `rewardsStore`, `DEFAULT_REWARDS`, `Rewards` | the single `kg:rewards` record — lifetime stars, owned/unseen stickers, today's star count, stars by game |
| `awardStars` | function — the one entry point a game calls to grant stars; serialized so concurrent calls never lose a star |
| `useRewards` | hook — live, subscribed `Rewards` for a screen |
| `markStickersSeen` | clears the `unseen` list once the collection screen has been opened |
| `onStickerUnlocked` | listener registration — called with a sticker id, or the `DAILY_GOAL_EVENT` sentinel |
| `onLevelUp` | listener registration — called with the new player level whenever `awardStars` makes lifetime stars cross into it; consumed by the full-screen "LEVEL UP!" card. See [Buddy, mascot, and wardrobe](../architecture/buddy-and-wardrobe) for how player level drives outfit unlocks |
| `DAILY_GOAL`, `DAILY_GOAL_EVENT` | the gentle daily-goal threshold and its unlock-listener sentinel |
| `starsToday`, `localDay` | derive today's star count and today's `YYYY-MM-DD` key from local wall-clock time |
| `STICKER_SETS`, `StickerSetId`, `ALL_STICKERS`, `STARS_PER_STICKER` | the per-game sticker catalog and the stars-per-sticker constant |
| `nextSticker`, `stickerId`, `stickerEmoji`, `setOf` | catalog helpers — which sticker a game's next star pays for, and how to read an id apart |
| `Sticker` | component — a die-cut sticker card, locked (`?`) or showing its glyph |

See [Rewards, stars, and stickers](../architecture/rewards-and-stickers) for
the full economy, including what later grew on top of `awardStars` that
this reference does not cover.

## Buddy, mascot, and wardrobe

| Export | Kind |
|---|---|
| `BUDDIES`, `DEFAULT_BUDDY` | the two-item buddy roster (`'lulu' \| 'zain'`) and its default |
| `useBuddy`, `useBuddyPicked`, `currentBuddy`, `chooseBuddy` | hooks/functions over the child's persisted buddy choice (`settings.buddy`) |
| `BuddyId` | type |
| `Mascot`, `MASCOT_POSES`, `MascotPose` | the cheap 2D mascot (four poses, plain `Animated.Image`) and its pose names |
| `MascotHelper` | component — `Mascot` plus slide animation and a speech bubble, for a buddy that pops in to react |
| `Lulu3D`, `Buddy3D` (alias), `LULU_TAP_LINES`, `LuluMood` | the rigged, bone-animated `@react-three/fiber` model shared by both buddies, and its mood type |

See [Buddy, mascot, and wardrobe](../architecture/buddy-and-wardrobe) for how
these fit together, including why `Lulu3D`, unlike the rest of this barrel's
3D-adjacent exports, is not behind any `lazy()`/`Suspense` boundary at its
call sites.

## Player level and wardrobe

| Export | Kind |
|---|---|
| `levelInfo`, `starsForLevel`, `LevelInfo` | pure functions deriving player level from lifetime stars, never stored |
| `OUTFITS`, `Outfit`, `OutfitSlot`, `OutfitId` | the static, level-gated outfit catalog (`'hat' \| 'glasses'`) |
| `outfitById`, `unlocksAt`, `isUnlocked` | catalog lookup helpers |
| `outfitStore`, `DEFAULT_WEARING`, `Wearing`, `wear`, `useWearing` | the single `kg:outfit` record (one hat/glasses slot, shared by both buddies) and its mutator/hook |

See [Buddy, mascot, and wardrobe](../architecture/buddy-and-wardrobe) for the
full stars → level → unlock chain and `WardrobeScreen`'s own shape.

## Store review

| Export | Kind |
|---|---|
| `maybeAskForReview` | function — the automatic path; shows the native rating sheet if `shouldAskForReview` and `expo-store-review`'s `hasAction()` both allow it |
| `openStoreReview` | function — opens the app's store listing page directly, for a manual "Rate" button |
| `shouldAskForReview` | pure function — the stars/days-played/cooldown threshold `maybeAskForReview` checks before asking |
| `ReviewState` | type — `{ askedAt: number \| null }`, the shape persisted at `kg:review` |

Both functions are only ever called from behind the
[parent gate](../decisions/parent-gate-for-settings) — see
[Store review prompt](../architecture/store-review-prompt) for why and for
the exact thresholds [@sdk-barrel].

## Play time

| Export | Kind |
|---|---|
| `playtimeStore`, `DEFAULT_PLAYTIME`, `Playtime` | the single `kg:playtime` record — seconds played per day and per game, plus granted extra minutes per day |
| `usePlaytime` | hook — live, subscribed `Playtime` |
| `usePlaytimeTracker` | hook — `usePlaytimeTracker(trackId \| null)`; accumulates seconds for `trackId` while mounted and the app is foregrounded, `null` to pause |
| `addPlaytime`, `grantExtraTime` | functions — log elapsed seconds for a day/game, and add `EXTRA_MINUTES` to a day's granted extra |
| `secondsToday`, `secondsThisWeek`, `overLimit` | pure functions over a `Playtime` value — today's total, the trailing 7-day total, and the daily-limit check |
| `EXTRA_MINUTES` | the extra minutes (`15`) one `grantExtraTime()` call adds |

See [Play time limit](../architecture/play-time-limit) for how `PlayLimitGate`
wires these together with `settings.dailyLimitMin` and the parent gate.

## Analytics

| Export | Kind |
|---|---|
| `track` | function — `track(event, props)`, typed against the `AnalyticsEvents` catalogue; queues until setup finishes, then fans out to every configured sink |
| `trackRound` | function — `trackRound(gameId, stars)`; called from `awardStars` itself, not normally from game code |
| `flushAnalytics` | function — flushes every sink; called automatically on app background |
| `usePlaySession` | hook — `usePlaySession(gameId \| null, mode)`; fires `game_start` on mount and `game_end` on unmount |
| `AnalyticsEvents`, `EventName`, `PlayMode` | types — the event catalogue and its event-name union and `'free' \| 'journey'` mode |
| `AnalyticsSink`, `EventProps` | types — the interface a backend (`sinks/*.ts`) implements |

`setupAnalytics` and the sink implementations themselves are intentionally
**not** exported from the barrel — they are wired once from `App.tsx` via
`analytics/init.ts`, which stays outside `@/sdk` so no test importing the
barrel can transitively load a vendor SDK [@sdk-barrel]. See
[Analytics: anonymous usage events](../architecture/analytics) for the full
module shape, the parent opt-out, and the
[tested vendor boundary](../decisions/analytics-vendor-boundary) that keeps a
vendor import confined to `sinks/`.

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
`i18n` (the configured i18next instance itself), `registerTranslations`,
`currentLanguage`, `LANGUAGES`, `DEFAULT_LANGUAGE`,
`languageMeta`, `isRTL`, `LanguageCode`, `LanguageMeta`, `useLanguage`,
`applyLanguage`, `bootstrapLanguage`, and `gameName`/`gameDescription`/
`gameShortName` — resolving a game's localized name, description, and short
Home-tile label, each falling back to the config's own English string, with
`gameShortName` falling back one step further to `gameName` when a game has
no `meta.shortName` key at all. See
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
