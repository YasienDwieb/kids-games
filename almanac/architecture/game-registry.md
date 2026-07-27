---
title: "Game Registry Architecture"
summary: "The in-memory registry that validates and stores every GameConfig, and the single wiring file, src/games/index.ts, that imports each game's config for its registration side effect."
topics: [architecture, games, registry]
sources:
  - id: registry-ts
    type: file
    path: src/sdk/config/registry.ts
  - id: types-ts
    type: file
    path: src/sdk/config/types.ts
  - id: validate-test
    type: file
    path: src/sdk/config/__tests__/validate.test.ts
  - id: games-index
    type: file
    path: src/games/index.ts
  - id: bands-ts
    type: file
    path: src/sdk/age/bands.ts
  - id: order-test
    type: file
    path: src/sdk/config/__tests__/order.test.ts
---

The game registry is the single source of truth for "which games exist in
this app." It is a bare in-memory object, populated once at boot by a chain
of side-effect imports, and read by `HomeScreen` and `GamePlayerScreen`
through four functions: `registerGame`, `getGame`, `getAllGames`, and
`getGamesForAge` [@registry-ts]. There is no database and no persistence
layer behind it — the registry exists only as long as the JS process does,
which is why the boot ordering in
[App entry and navigation](../architecture/app-entry-and-navigation) matters:
if a game's config module never gets imported, that game silently does not
exist for the rest of the session.

## Storage and query surface

`registry.ts` declares `const registry: GameRegistry = {}` — a plain
`Record<string, GameConfig>` closed over by the module's exported functions,
with no external way to reach the object directly [@registry-ts]. `getGame(id)`
returns `registry[id]` or `undefined`; `getAllGames()` and `getGamesForAge(age)`
both run their `Object.values(registry)` result through a shared `byOrder()`
sort before returning it — `getGamesForAge` filters to games whose `ageRange`
brackets the given age first, then applies the same ordering [@registry-ts].
`byOrder()` sorts ascending by each game's optional `order` field, treats a
missing `order` as `Number.MAX_SAFE_INTEGER` so unordered games sort behind
every ordered one, and breaks ties (including between two unordered games) by
original registration order, so the result is stable across repeated calls
[@registry-ts]. `src/sdk/config/__tests__/order.test.ts` pins all four of
these behaviors directly against `getAllGames()` [@order-test]. This exists
because only two or three tiles are visible at once on a landscape phone's
games rail — see [App entry and navigation](../architecture/app-entry-and-navigation)
— so the first few games in registration order used to decide the app's first
impression by accident, as a side effect of which `import` line in
`src/games/index.ts` happened to run first, rather than by design. A fourth
function, `_resetRegistry()`, deletes every key — its own comment marks it
"Test-only," and it exists purely so test suites can reset registry state
between runs rather than accumulate every test's game across a whole process
[@registry-ts]. A closely related query, `gamesForBand(bandId)`, filters the
same `getAllGames()` output by the age-band membership computed in
`src/sdk/age/bands.ts` [@bands-ts] — the age-band model itself is a distinct
concept, covered by its own page rather than repeated here.

## Registration and its invariants

`registerGame(config)` does two things in order: it calls
`validateGameConfig(config)`, then checks `if (registry[config.id]) throw`
before writing `registry[config.id] = config` [@registry-ts]. Validation runs
strictly before the duplicate check and before the write, so an invalid
config never reaches the registry even under a colliding id. The test suite
in `validate.test.ts` pins down exactly what "invalid" means:

- `id` must be non-empty and match a kebab-case pattern — `'Bad Id!'` is
  rejected with an error matching `/id/` [@validate-test].
- `ageRange.min` must not exceed `ageRange.max` — `{min: 8, max: 3}` throws,
  matching `/ageRange/` [@validate-test].
- `component` must be present — omitting it throws, matching `/component/`
  [@validate-test].

`registerGame` itself adds the duplicate-id invariant on top of those field
checks: calling it twice with the same `id` throws
`"duplicate id"` [@registry-ts]. Together these invariants mean every entry
that reaches `getAllGames()` has a well-formed id, a sane age range, and an
actual renderable component — `HomeScreen` and `GamePlayerScreen` never have
to re-validate what they read back out.

The shape being validated is `GameConfig`: required fields `id`, `name`,
`description`, `icon`, `ageRange: {min, max}`, `component`, and
`backgroundColor`, plus optional enrichment fields `accent`, `order`, `tags`,
`layout`, `bands`, `version`, and `author` [@types-ts]. `order` is the field
`byOrder()` reads, described above; it is not checked by
`validateGameConfig` at all, so an omitted `order` is a valid config that
simply sorts last. The
[Game config schema](../reference/game-config-schema) reference page is the
field-by-field contract for this type; this page is only concerned with how
the registry enforces and stores it.

## `src/games/index.ts`: the one file that changes

`src/games/index.ts` re-exports the four registry functions and then imports
every game's `config.ts` purely for its registration side effect — one line
per game, such as `import './letter-land/config';` [@games-index]. This file
is deliberately the *only* place that changes when a new game is added to the
app. Concentrating every registration behind one line, in one file, means
adding an eleventh or twelfth game is a single-line diff rather than a change
that touches routing, a manual game list, or any other file that multiple
contributors might be editing at once — it avoids parallel-edit collisions
across the games that already exist. This is the mechanism the
[Add a new game](../guides/add-a-new-game) guide walks through in practice,
and it is what makes a folder under `src/games/` a real
[Game module](../concepts/game-module): a folder that exists on disk but
isn't imported here has no way to reach `registerGame()`, and so does not
exist for `HomeScreen` or `GamePlayerScreen` no matter how complete its code
is.

## Consequence: registry state is boot-order-dependent

Because registration happens as an import side effect rather than through an
explicit initialization call, the registry's contents at any point in the
render lifecycle depend entirely on which imports have already executed. The
[app entry](../architecture/app-entry-and-navigation) page traces why
`App.tsx` imports `'./src/games'` — and therefore this file — before
rendering anything that could call `getAllGames()`. Any code path that reads
the registry before that import chain completes would see a registry with
some or all games missing; nothing in `registry.ts` itself defends against
that ordering mistake, which is why it is enforced by import placement in
`App.tsx` instead.
