---
title: "Games Catalog Reference"
summary: "The exact id, age range, accent, layout mode, and flow eligibility of all 11 games currently registered in src/games/index.ts, verified against each game's own config.ts."
topics: [reference, games, catalog]
sources:
  - id: games-index
    type: file
    path: src/games/index.ts
  - id: flow-registrar
    type: file
    path: src/flow/index.ts
  - id: simple-pairs-config
    type: file
    path: src/games/simple-pairs/config.ts
  - id: color-mixer-config
    type: file
    path: src/games/color-mixer/config.ts
  - id: mouse-maze-config
    type: file
    path: src/games/mouse-maze/config.ts
  - id: balloon-archer-config
    type: file
    path: src/games/balloon-archer/config.ts
  - id: shape-detective-config
    type: file
    path: src/games/shape-detective/config.ts
  - id: turbo-road-config
    type: file
    path: src/games/turbo-road/config.ts
  - id: count-and-pop-config
    type: file
    path: src/games/count-and-pop/config.ts
  - id: match-up-config
    type: file
    path: src/games/match-up/config.ts
  - id: letter-land-config
    type: file
    path: src/games/letter-land/config.ts
  - id: numbers-land-config
    type: file
    path: src/games/numbers-land/config.ts
  - id: animal-safari-config
    type: file
    path: src/games/animal-safari/config.ts
---

This page is a lookup table for the 11 games currently registered by
`src/games/index.ts`, one `import './<id>/config'` line per game
[@games-index]. Each row's age range, accent, layout mode, and `order` is
read directly from that game's own `config.ts`; each is a
[game module](../concepts/game-module) — a folder following that same shape. Flow eligibility is read from
`src/flow/index.ts`, the separate wiring file for the
[flow engine](../architecture/flow-engine) — a game listed there ships its
own `flow.tsx` adapter and can appear in a guided-play session
[@flow-registrar]. Age ranges here are the raw `ageRange` a game declares;
how those ranges map onto the [age bands](../concepts/age-bands) shown in
Home and Settings is a separate derivation covered on that page.

## The 11 registered games

Rows are listed in ascending `order` — the same sequence `getAllGames()`
returns, and so the same left-to-right/top-to-bottom sequence the games rail
on Home renders them in when no age-band filter is applied. See
[Game registry](../architecture/game-registry) for how `order` is enforced
and how ties or omissions are broken.

| id | order | ages | accent | layout mode | flow-eligible | mechanic |
|---|---|---|---|---|---|---|
| `animal-safari` | 10 | 3–7 | orange | shell | yes | Listen-and-find animals via spoken name or sound effect [@animal-safari-config] [@flow-registrar] |
| `mouse-maze` | 20 | 3–8 | orange | bare | no | Swipe-to-navigate maze (mouse to cheese) with procedurally generated levels [@mouse-maze-config] |
| `color-mixer` | 30 | 4–8 | blue | bare | no | Drag-and-drop color mixing and discovery sandbox [@color-mixer-config] |
| `turbo-road` | 40 | 4–12 | coral | bare | no | Steering/reflex road-trip racer with a garage and unlockable cars, tilt controls [@turbo-road-config] |
| `balloon-archer` | 50 | 5–8 | green | bare | no | Aim and shoot a bow-and-arrow to pop balloons [@balloon-archer-config] |
| `simple-pairs` | 60 | 2–5 | green | bare | no | Classic memory/matching card-flip pairs [@simple-pairs-config] |
| `match-up` | 70 | 3–7 | purple | bare | yes | Drag a line connecting each item to its match [@match-up-config] [@flow-registrar] |
| `shape-detective` | 80 | 3–10 | purple | shell | yes | Pattern-completion, odd-one-out, and sort-into-bins puzzles [@shape-detective-config] [@flow-registrar] |
| `count-and-pop` | 90 | 3–7 | pink | shell | yes | Counting: tap to pop N objects, or pick the numeral matching a shown group [@count-and-pop-config] [@flow-registrar] |
| `letter-land` | 100 | 3–7 | blue | shell | yes | Listen-and-find letters via text-to-speech, plus finger-trace letter shapes [@letter-land-config] [@flow-registrar] |
| `numbers-land` | 110 | 3–7 | orange | shell | yes | Listen-and-find digits, the audio-first sibling of Count & Pop [@numbers-land-config] [@flow-registrar] |

Each game's Home tile shows `gameShortName(game)` — the localized
`meta.shortName` string when the game's locale files declare one, falling
back to the full `gameName(game)` otherwise — because the landscape games
rail is only about 116dp wide and holds a single line of text; the full name
still reaches screen readers via the tile's `accessibilityLabel`. See the
[SDK public API](../reference/sdk-public-api) reference for where
`gameShortName` sits in the i18n exports.

`animal-safari` is fully shipped and registered — `src/games/index.ts`
contains `import './animal-safari/config';` alongside every other game's
import [@games-index]. It is easy to mistake for still-in-progress work
because sprint-planning documents under `docs/` (e.g.
`DOODLE_DOTS_SPRINTS.md`, `RHYTHM_TAP_SPRINTS.md`) describe two other games,
`doodle-dots` and `rhythm-tap`, that have no folder under `src/games/` and no
entry in `src/games/index.ts` — those two are planning documents only and are
not part of this catalog [@games-index].
