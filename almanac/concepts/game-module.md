---
title: "Game Module"
summary: "A game is a self-contained folder under src/games/ with a config.ts that self-registers, an index.tsx entry component, and its own EN/AR locale files."
topics: [concepts, games, i18n]
sources:
  - id: how-to-add
    type: file
    path: src/games/HOW_TO_ADD_GAME.md
  - id: template-dir
    type: file
    path: src/games/_template/
  - id: games-index
    type: file
    path: src/games/index.ts
  - id: registry
    type: file
    path: src/sdk/config/registry.ts
  - id: config-types
    type: file
    path: src/sdk/config/types.ts
---

A "game" in this codebase is a folder under `src/games/` that owns everything
about one activity — its component tree, its metadata, and its own English and
Arabic strings — and makes itself known to the rest of the app through exactly
one side effect: calling `registerGame()` when its `config.ts` module loads
[@how-to-add]. Nothing outside `src/games/index.ts` needs to change to add a
game; the folder is self-contained and the registration is a one-line
side-effect import [@games-index]. This is the unit the rest of the app is
built around — `HomeScreen` renders one tile per registered game, and
`GamePlayerScreen` loads whichever one the player tapped by id.

## The required shape

Every game folder follows the same minimal shape, visible in the scaffold at
`src/games/_template/`: an `index.tsx` root component that imports only from
`@/sdk`, and a `config.ts` that imports `./i18n` for its side effect (this
registers the game's translation bundle before anything else runs) and then
calls `registerGame({...})` [@template-dir]. The config object is typed as
`GameConfig`: required fields `id`, `name`, `description`, `icon`, `ageRange:
{min, max}`, `component`, and `backgroundColor`, plus optional fields `accent`,
`tags`, `layout: {mode}`, `bands`, `version`, and `author` [@config-types].
Beyond `config.ts` and `index.tsx`, a game typically adds `locales/en.ts` +
`locales/ar.ts` + `i18n.ts` (its own translation namespace, keyed by the
game's `id`) and, optionally, its own scoped `components/`, `hooks/`, and
`utils/` folders [@how-to-add]. Nothing under those folders is visible outside
the game — that scoping is what the [SDK boundary](../concepts/sdk-boundary)
enforces from the other direction, by giving the game nothing to import except
`@/sdk`.

## Registration is the only wiring point

`registerGame()` calls `validateGameConfig()` and then adds the config to an
in-memory registry keyed by `id`; a duplicate `id` throws
[@registry]. A game folder existing on disk does nothing by itself — the
`config.ts` module has to actually load, and that only happens because
`src/games/index.ts` has a side-effect import for it (`import
'./<game-id>/config'`). That file is the single place in the whole app where a
new game plugs in: `App.tsx` imports `src/games/index.ts`, which imports every
game's `config.ts`, which each call `registerGame()`, and only after all of
that has run does `HomeScreen` call `getAllGames()` to build its grid
[@games-index]. This means "does this game exist for the app" is answered
entirely by whether its `config.ts` is imported from `src/games/index.ts` —
the [Game registry](../architecture/game-registry) page traces this
registration flow and its validation rules in full, and the
[Game config schema](../reference/game-config-schema) page gives the exact
field-by-field contract.

## Twelve games, one pattern

Twelve games exist in this shape today: `simple-pairs`, `color-mixer`,
`mouse-maze`, `balloon-archer`, `shape-detective`, `turbo-road`,
`count-and-pop`, `match-up`, `letter-land`, `numbers-land`, `animal-safari`,
and `candy-catch` [@games-index]. Each is a game in the sense defined here —
independently playable from Home, with its own score/level progression if it
opts into one — which is a narrower idea than a "flow unit." A
[Flow](../concepts/flow) unit reuses a game's existing content inside a
different, scoreless playback mode; the game module concept describes the
thing being reused, not the reused form. The
[Add a new game](../guides/add-a-new-game) guide walks through creating one of
these folders end to end, and the
[Games catalog](../reference/games-catalog) reference lists all twelve with
their exact metadata.
