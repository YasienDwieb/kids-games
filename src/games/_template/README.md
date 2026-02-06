# Creating a New Game

## Steps

1. **Copy** the `_template/` folder to `src/games/<your-game-name>/`
2. **Update `config.ts`:**
   - Set a unique `id` (kebab-case, e.g. `color-match`)
   - Set `name`, `description`, `icon`, `ageRange`, `backgroundColor`
   - Point `component` to your game's root component
   - Call `registerGame(yourConfig)` to register it
3. **Build your game** in `index.tsx` using `GameArea` as the play surface
4. **Add game-specific components** in `components/`
5. **Add game-specific hooks** in `hooks/` (extend `useGameState` as needed)
6. **Register** by importing your config in `src/games/index.ts`:
   ```ts
   import './<your-game-name>/config';
   ```

## Checklist

- [ ] Folder copied and renamed
- [ ] `config.ts` updated with unique id and metadata
- [ ] `registerGame()` called in `config.ts`
- [ ] Game imported in `src/games/index.ts`
- [ ] Game component renders without errors
- [ ] Touch targets are at least 64px (use `TOUCH_TARGET.recommended`)
- [ ] Font sizes use `FONT_SIZES` constants (large enough for kids)
