# Architecture

How the app is put together: the source layout, the boot/registration flow, and the
`@/sdk` surface every game builds on. For the authoritative contract see
[`CLAUDE.md`](../CLAUDE.md) and the `kids-games-dev` skill.

## Tech stack

- Expo SDK 57, React 19.2, React Native 0.86 (New Architecture)
- TypeScript (strict mode)
- React Navigation (native-stack)
- `react-native-safe-area-context`, `react-native-gesture-handler`, `expo-audio`, `expo-haptics`, `expo-speech`, `expo-screen-orientation`
- `react-native-reanimated` + `react-native-worklets` — UI-thread game motion (needs a native/EAS build, not OTA)
- i18n: `i18next` + `react-i18next` + `expo-localization` — English + Arabic with full RTL
- Fonts: Lilita One (display) + Nunito (body); Baloo Bhaijaan 2 + IBM Plex Sans Arabic (RTL) via `@expo-google-fonts/*`

## Source layout

```
App.tsx                     # Entry: loads fonts, SafeAreaProvider, NavigationContainer, game registration
src/
├── app/navigation/         # RootNavigator — screens: Home, GamePlayer, Settings, FlowPlayer, Wardrobe
├── screens/                # Home (Lulu + game rail), GamePlayer (loads game by id), Settings (behind ParentGate),
│                           #   FlowPlayer (Guided Journey), Wardrobe (Lulu's outfits), PlayLimitGate (daily limit break)
├── sdk/                    # SDK platform core — the single import surface for games (@/sdk)
│   ├── config/             # registerGame / getGame / getAllGames + GameConfig types
│   ├── layout/             # GameShell, useGameShell, useScreenBack
│   ├── audio/              # useSound (play SFX by intent, per-game win jingles)
│   ├── storage/            # createStore (AsyncStorage-backed)
│   ├── progress/           # levels & resume: useLevels, ResumePrompt
│   ├── feedback/           # useCelebrate (confetti, praise, combos, LEVEL UP card), useHintLadder
│   ├── mascot/             # Lulu the owl: 2D poses + interactive 3D Lulu3D
│   ├── player/             # player level from lifetime stars, wardrobe outfits
│   ├── rewards/            # stars and the sticker book
│   ├── playtime/           # play-time tracking and the optional daily limit
│   ├── adaptive/           # adaptive difficulty for the arcade games
│   ├── tutorial/           # first-run demos (DemoHand), idle hints
│   ├── settings/           # useSettings (sound / haptics / age band / language)
│   ├── age/                # AGE_BANDS, gamesForBand, bandsForGame
│   ├── i18n/               # useTranslation, registerTranslations, useLanguage (en + ar, RTL)
│   ├── flow/               # Guided Journey: sequencing, progress, scene backdrop
│   ├── motion/             # useGameLoop / useTilt (reanimated UI-thread motion)
│   ├── speech/             # useSpeech (spoken prompts for listen-and-find games)
│   └── assets/             # shared soft CC0 SFX manifest (Kenney; see CREDITS.md)
├── components/common/      # Design-system primitives (see below)
├── constants/              # Design tokens: COLORS, ACCENTS, SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, SHADOWS, TOUCH_TARGET
├── games/
│   ├── index.ts            # Side-effect imports that register each game
│   ├── _template/          # Copy this to start a new game
│   ├── _shared/            # Cross-game building blocks (listen-find board & round generator)
│   ├── simple-pairs/       # Memory matching card game
│   ├── color-mixer/        # Paint-mixing & color discovery
│   ├── mouse-maze/         # Swipe-to-solve maze with levels
│   ├── balloon-archer/     # Aim-and-pop balloon arcade game
│   ├── shape-detective/    # Shape pattern & logic puzzles
│   ├── turbo-road/         # Steer-and-dodge road-trip racing
│   ├── count-and-pop/      # Count objects and pop the number
│   ├── match-up/           # Draw a line from each thing to its match
│   ├── letter-land/        # Listen-and-find letters (phonics)
│   ├── numbers-land/       # Listen-and-find numbers
│   ├── animal-safari/      # Listen-and-find animals (first words)
│   └── candy-catch/        # Slide-the-basket catching arcade
├── types/                  # RootStackParamList, shared types
├── hooks/                  # Shared hooks
└── utils/                  # Shared helpers
```

**Flow:** `App.tsx` imports `src/games/index.ts` (triggers all game registrations via each game's `config.ts`) → `HomeScreen` calls `getAllGames()`/`gamesForBand()` to render the grid → tapping a card navigates to `GamePlayerScreen`, which loads the game component by id.

## The SDK (`@/sdk`)

Games import **only** from `@/sdk` — never from another game or deep `src/` paths. The SDK is the stable public surface:

- **Config & registry** — `registerGame`, `getGame`, `getAllGames`, `GameConfig`
- **Layout** — `GameShell` + `useGameShell` (shell mode); `useScreenBack` (intercept back to step up internal screens before exiting)
- **Audio** — `useSound().play('sfx.pop' | 'sfx.success' | 'sfx.win' | 'sfx.wrong' | …)`; each intent has several soft variants picked at random, and every game sets its own win jingle via `GameConfig.sounds`
- **Storage** — `createStore(namespace, defaultValue)`
- **Progress & levels** — `useLevels`, `levelsFromList`/`levelsFromGenerator`, `ResumePrompt`
- **Feedback** — `useCelebrate` (confetti + praise, resolves when done), `useHintLadder` (shared retry → highlight → reveal hints)
- **Mascot & player** — `Lulu3D` / `Mascot` / `MascotHelper`; `levelInfo(stars)`, `OUTFITS`, `useWearing`
- **Tutorials** — `useFirstRun`, `DemoHand`, `useIdle`
- **Settings / Age** — `useSettings`, `AGE_BANDS`, `gamesForBand`
- **i18n** — `useTranslation().t`, `registerTranslations`, `useLanguage` (English + Arabic, full RTL; per-game locale bundles)
- **Assets** — `ASSETS`, `findAssets`, `pickAsset`
