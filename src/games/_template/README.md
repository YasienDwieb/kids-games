# Creating a New Game

This template is the canonical starting point. Everything a game needs comes from
the SDK barrel `@/sdk` — never import another game or reach into deep `src/` paths.

## Steps

1. **Copy** the `_template/` folder to `src/games/<your-game-name>/`
2. **Update `config.ts`:**
   - Set a unique `id` (kebab-case, e.g. `color-match`)
   - Set `name`, `description`, `icon`, `ageRange`, `backgroundColor`
   - Point `component` to your game's root component
   - `registerGame()` (imported from `@/sdk`) validates the config on registration
3. **Build your game** in `index.tsx`:
   - Sounds: `const { play } = useSound();` then `play('pop' | 'success' | 'wrong' | 'win')`
   - Overlays/score: `const shell = useGameShell();` then `shell.showOverlay('win', node)` / `shell.setScore(n)`
   - Persistence: `const store = createStore('<your-game-name>', defaultValue);`
   - **Text: `const { t } = useTranslation();`** then `t('<your-id>:key')` — NEVER hardcode a string
   - Styling: `COLORS`, `SPACING`, `FONT_SIZES`, etc. — all from `@/sdk`
   - **i18n (required):** edit `locales/en.ts` + `locales/ar.ts` (same keys, typed by `GameTranslations`) and keep the `import './i18n'` line in `config.ts`. Write meaningful, kid-friendly Arabic — not literal translation. For RTL, use `start`/`end` (not `left`/`right`) and flip directional glyphs via `I18nManager.isRTL`. Full contract: SKILL.md §7.
4. **Choose a layout mode** in `config.ts`:
   - Default (omit `layout`) — wrapped in `GameShell` (title bar, back button, overlay slots)
   - `layout: { mode: 'bare' }` — full custom canvas; only an absolute back button is provided
5. **Pick assets by intent**, not filename: `pickAsset('success')` / `findAssets({ type, tags })`.
   To add an asset, drop the file in `src/sdk/assets/<type>/` and add a tagged entry to `manifest.ts`.
6. **Register** by importing your config in `src/games/index.ts`:
   ```ts
   import './<your-game-name>/config';
   ```

See `src/games/HOW_TO_ADD_GAME.md` for the full guide, and the `kids-games-dev`
skill for AI-assisted contribution.

## Checklist

- [ ] Folder copied and renamed
- [ ] `config.ts` updated with unique kebab-case id and metadata
- [ ] `registerGame()` (from `@/sdk`) called in `config.ts`
- [ ] Game built using `@/sdk` (no deep imports, no cross-game imports)
- [ ] Assets picked by intent via `pickAsset` / `findAssets`
- [ ] Layout mode chosen (default shell or `bare`)
- [ ] `locales/en.ts` + `locales/ar.ts` filled (incl. `meta.name`/`meta.description`); every string via `t()`
- [ ] Arabic is meaningful & kid-friendly (not literal MT); RTL handled (start/end, flipped glyphs)
- [ ] Game keys added to `src/sdk/i18n/__tests__/keys.test.ts`
- [ ] Game imported in `src/games/index.ts`
- [ ] Touch targets at least 64px (`TOUCH_TARGET.recommended`)
- [ ] Font sizes use `FONT_SIZES` constants (large enough for kids)
- [ ] `npx tsc --noEmit` clean and `npm test` passing
