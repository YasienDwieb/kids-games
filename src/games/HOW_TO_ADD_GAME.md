# How to Add a New Game

## Quick Start

1. **Copy the template**

   ```bash
   cp -r src/games/_template src/games/my-game
   ```

2. **Update `config.ts`** — set your game's metadata and call `registerGame()`:

   ```ts
   import { registerGame } from '../registry';
   import MyGame from './index';

   registerGame({
     id: 'my-game',              // unique kebab-case id
     name: 'My Game',            // shown on home screen card
     description: 'A fun game',
     icon: '🎯',                 // emoji for the card
     ageRange: { min: 2, max: 6 },
     component: MyGame,
     backgroundColor: '#FF6B6B', // card color (pick from COLORS.primary)
   });
   ```

3. **Build your game** in `index.tsx` — this is the root component that renders when the game is launched.

4. **Register** by importing your config in `src/games/index.ts`:

   ```ts
   import './my-game/config';
   ```

   That's it — the game will now appear on the home screen.

## Folder Structure

```
src/games/my-game/
├── index.tsx        # Root game component
├── config.ts        # Metadata + registerGame() call
├── components/      # Game-specific UI components
│   ├── GameArea.tsx  # Play surface (from template)
│   └── index.ts
├── hooks/           # Game-specific hooks
│   ├── useGameState.ts  # Score, play state (from template)
│   └── index.ts
└── assets/          # Game-specific assets
    └── index.ts
```

## Design Guidelines

- **Touch targets**: minimum 64px (`TOUCH_TARGET.recommended`) — kids need large tap areas
- **Font sizes**: use `FONT_SIZES` constants — they're already sized for young children
- **Colors**: pick from `COLORS.primary` for a cheerful palette
- **Layout**: use `GameArea` as your play surface, it handles padding and rounded corners
- **State**: extend `useGameState` hook for score tracking and play/pause/reset

## Shared Utilities

| Import from | What's available |
|---|---|
| `../../constants` | `COLORS`, `SPACING`, `FONT_SIZES`, `BORDER_RADIUS`, `TOUCH_TARGET` |
| `../../components/common` | `BigButton`, `GameCard`, `BackButton`, `SafeContainer` |
| `../../types` | `GameConfig`, `RootStackParamList` |

## Example

See `src/games/example/` for a minimal working game that demonstrates registration and rendering.

## Checklist

- [ ] Folder created from template
- [ ] `config.ts` has unique `id` and calls `registerGame()`
- [ ] Config imported in `src/games/index.ts`
- [ ] Game component renders without errors
- [ ] Touch targets >= 64px
- [ ] Fonts use `FONT_SIZES` constants
