# Kids Games

A multi-game Expo React Native app for young children (ages 2-6). Each game is a self-contained module that plugs into a shared shell with navigation, shared components, and a kid-friendly design system.

## Getting Started

```bash
npm install
npx expo start
```

Then open in Expo Go on your device, or press `a` for Android emulator / `i` for iOS simulator.

## Tech Stack

- Expo SDK 54, React 19, React Native 0.81
- TypeScript (strict mode)
- React Navigation (native-stack)

## Architecture

```
App.tsx                     # Entry: NavigationContainer + game registration
src/
├── app/navigation/         # RootNavigator (Home, GamePlayer screens)
├── screens/                # HomeScreen (game grid), GamePlayerScreen (loads game by id)
├── components/common/      # BigButton, GameCard, BackButton, SafeContainer
├── constants/              # COLORS, SPACING, FONT_SIZES, TOUCH_TARGET
├── types/                  # GameConfig, GameRegistry, RootStackParamList
├── games/
│   ├── registry.ts         # registerGame / getAllGames / getGame
│   ├── index.ts            # Side-effect imports that register each game
│   ├── _template/          # Copy this to start a new game
│   ├── simple-pairs/       # Memory matching card game
│   └── color-mixer/        # Color theory mixing game
├── hooks/                  # Shared hooks
└── utils/                  # Shared helpers
```

**Flow:** `App.tsx` imports `src/games/index.ts` (triggers all game registrations) → `HomeScreen` calls `getAllGames()` to render the grid → tapping a card navigates to `GamePlayerScreen` which loads the game component by id.

## Games

| Game | Ages | Theme | Description |
|------|------|-------|-------------|
| **Simple Pairs** | 2-5 | Memory | Find matching pairs of cards with difficulty levels |
| **Color Mixer** | 4-8 | Color theory | Drag and mix paint colors to discover new ones |

## Adding a New Game

See [src/games/HOW_TO_ADD_GAME.md](src/games/HOW_TO_ADD_GAME.md) for a step-by-step guide.

**TL;DR:**

1. Copy `src/games/_template` to `src/games/your-game`
2. Update `config.ts` with your game's metadata and call `registerGame()`
3. Build your game in `index.tsx`
4. Import your config in `src/games/index.ts`

The game automatically appears on the home screen.
