# Contributing

Kids Games is a multi-game Expo React Native app. The goal is a safe, controlled environment where parents and developers can build and share games for young children — all content goes through a review process and assets are curated in the SDK.

## Repo intent

- Parents and developers build self-contained games for children aged 2–10.
- Each game is a folder under `src/games/`. Games never share mutable state or import from one another.
- Audio and visual assets are managed centrally in `src/sdk/assets/` with a controlled tag vocabulary so games can reuse them by intent rather than by filename.

## The SDK contract

**All games import exclusively from `@/sdk`.** This is the stable public surface. Never reach into another game's folder, and never import from deep `src/` paths like `@/sdk/audio/useSound` or `../../components/common`.

The SDK surface covers:
- **Config & registry** — `registerGame`, `getGame`, `getAllGames`, `GameConfig`
- **Layout** — `GameShell`, `useGameShell` (setScore / showOverlay / hideOverlay), `OverlaySlot`
- **Audio** — `useSound` (play by intent string)
- **Storage** — `createStore` (AsyncStorage-backed typed store)
- **Settings** — `useSettings`, `settingsStore`, `DEFAULT_SETTINGS`
- **Age** — `AGE_BANDS`, `bandsForGame`, `gamesForBand`
- **Assets** — `ASSETS`, `getAsset`, `findAssets`, `pickAsset`
- **Design tokens** — `COLORS`, `SPACING`, `BORDER_RADIUS`, `TOUCH_TARGET`, `FONT_SIZES`

## How to add a game

See `src/games/HOW_TO_ADD_GAME.md` for the full walkthrough and checklist.

Short version:
1. `cp -r src/games/_template src/games/<your-id>`
2. Edit `config.ts` — set a unique kebab-case id, metadata, `ageRange`, and call `registerGame()` (imported from `@/sdk`).
3. Build the game component in `index.tsx`, importing only from `@/sdk`.
4. Add `import './<your-id>/config';` in `src/games/index.ts`.

## Running tests and typechecks

```bash
npm test              # Jest — all tests must pass (currently 26 tests)
npx tsc --noEmit      # TypeScript strict-mode typecheck — must produce no errors
```

Both must be green before submitting a PR.

## Asset tag vocabulary

Sounds are selected by intent string. The current controlled tags are:

| Intent tags | Meaning |
|---|---|
| `pop`, `flip`, `tap`, `ui` | Card flip, tapping, UI feedback |
| `success`, `match`, `reward` | Match found, correct answer |
| `win`, `celebration`, `complete` | Game won, level complete |
| `wrong`, `mismatch`, `error` | Mismatch, wrong answer |

Use `play('pop')` (from `useSound`) rather than referencing asset ids directly. To add a new asset, drop the file in `src/sdk/assets/<type>/` and register it in `src/sdk/assets/manifest.ts` with appropriate tags.

## Config validation rules

`registerGame` validates on call and throws with a clear message on failure:
- `id` must match `/^[a-z0-9]+(-[a-z0-9]+)*$/` (kebab-case)
- `name`, `description`, `icon`, `backgroundColor` must be non-empty strings
- `component` must be a React component function
- `ageRange.min` must be <= `ageRange.max`

## AI-assisted development

A Claude Code skill is included at `.claude/skills/kids-games-dev/SKILL.md`. It covers scaffolding, SDK usage, asset selection, layout modes, age bands, and the config schema. If you are using Claude Code on this repo the skill triggers automatically for game-related tasks.

## License of contributions

This project is licensed under the [Apache License 2.0](LICENSE). Unless you state
otherwise, any contribution you submit for inclusion (a game, code, or docs) is
provided under the same Apache-2.0 terms (see Section 5 of the license). Please
don't submit assets or code you don't have the rights to; log any third-party
asset in [CREDITS.md](CREDITS.md) before importing it.
