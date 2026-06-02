# Simple Pairs

A memory matching card game for young children (ages 2-5).

## How to Play

1. Pick a difficulty (Easy / Medium / Hard / Expert)
2. Tap a card to flip it and reveal the emoji
3. Tap a second card — if both match, they stay revealed
4. If they don't match, both flip back after a short delay
5. Find all pairs to win

## Difficulty Levels

| Level  | Pairs | Cards | Grid    |
|--------|-------|-------|---------|
| Easy   | 2     | 4     | 2x2     |
| Medium | 3     | 6     | 3x2     |
| Hard   | 4     | 8     | 3x3-ish |
| Expert | 9     | 18    | 3x6     |

## Architecture

```
simple-pairs/
├── components/
│   ├── Card.tsx              # Animated flip card (rotateY + opacity swap)
│   ├── DifficultySelect.tsx  # Pre-game difficulty picker
│   ├── GameBoard.tsx         # Responsive card grid (width + height aware)
│   ├── GameHeader.tsx        # Reset button (back button from GamePlayerScreen)
│   ├── MatchCelebration.tsx  # Brief sparkle overlay on match
│   └── WinScreen.tsx         # Full overlay with stars + play again
├── hooks/
│   └── useSimplePairs.ts     # Core game state machine
├── utils/
│   └── shuffle.ts            # Fisher-Yates shuffle
├── types.ts                  # Card, GameState, Difficulty
├── constants.ts              # Images, timing, layout, difficulty configs
├── config.ts                 # Game registry entry
└── index.tsx                 # Root component (difficulty select → game)
```

## Key Patterns

**Two-component root**: `SimplePairsGame` (phase manager) renders either `DifficultySelect` or `GameContent`. `GameContent` is keyed by difficulty so changing difficulty fully remounts with fresh hook state.

**Timer management**: `useSimplePairs` uses a centralized `addTimer`/`clearAllTimers` pattern with a `Set<timeout>` ref. All timers are auto-cleaned on unmount and reset.

**Flip animation**: Card uses `Animated.timing` with `rotateY` interpolation. Back face rotates 0→90deg while front rotates -90→0deg, with opacity switching at the midpoint for a clean 3D effect.

**Match detection via useEffect**: When `flippedCards.length === 2`, an effect schedules `resolveMatch` after `FLIP_DURATION` (lets the animation finish). No side effects inside `setState` updaters.

**Responsive card sizing**: `GameBoard` computes card size from `min(widthFit, heightFit, maxSize)` using `useWindowDimensions`, so grids adapt from 4-card easy to 18-card expert.

## Sound Effects

Uses `useSound` from `@/sdk`. Sounds are played by intent string — `play('pop')` on card flip, `play('success')` on match, `play('wrong')` on mismatch, `play('win')` on game complete. The SDK maps intents to shared audio assets in `src/sdk/assets/`, respects the user's sound/haptics settings, and degrades gracefully if audio is unavailable.

## TODOs

- Add dedicated sound files (current ones are placeholders)
- Mute toggle for parents
- Performance-based star rating on win screen
- Card entrance animation on game start
- Haptic feedback on match/mismatch
