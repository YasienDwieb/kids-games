---
title: "Age Bands"
summary: "Four overlapping age bands — toddler, preschool, early, kids — group games for Home filtering and Settings, derived from each game's ageRange unless the game overrides them."
topics: [concepts, games, i18n]
sources:
  - id: bands-file
    type: file
    path: src/sdk/age/bands.ts
  - id: keys-test
    type: file
    path: src/sdk/i18n/__tests__/keys.test.ts
  - id: config-types
    type: file
    path: src/sdk/config/types.ts
---

Age bands are a fixed set of four named age ranges — `toddler`, `preschool`,
`early`, and `kids` — that group the catalog's games so a parent can filter
Home to activities suited to one child's age instead of scanning the full
list. `AGE_BANDS` defines the ranges directly in code, and they are deliberately
overlapping: a 3-year-old's games are meant to show up under both `toddler`
and `preschool` rather than being forced into exactly one bucket
[@bands-file].

| Band id | Age range | Display concept |
|---|---|---|
| `toddler` | 2–3 | Youngest players, simplest interactions |
| `preschool` | 3–5 | Early structured play |
| `early` | 5–7 | "Early years" — beginning school-age skills |
| `kids` | 7–10 | "Big kids" — the oldest, most complex games |

## Bands are derived, not assigned

A [game module](../concepts/game-module)'s `config.ts` does not usually pick
its own bands. Every `GameConfig` already carries a required `ageRange: {min,
max}` [@config-types], and `bandsForGame(config)` computes membership by
checking which of the four `AGE_BANDS` overlap that range — a `min <= band.max
&& band.min <= max` interval test, so a game spanning ages 4–6 lands in both
`preschool` (3–5) and `early` (5–7) automatically [@bands-file]. This means
band membership normally requires no extra authoring: set `ageRange`
correctly and the bands fall out of the overlap. `GameConfig` also has an
optional `bands: string[]` field, and when a game sets it, `bandsForGame`
returns that list untouched instead of deriving anything — the override exists
for a game whose `ageRange` is broad but that a designer wants to surface only
under a subset of the bands it technically overlaps [@bands-file].

`gamesForBand(bandId)` is the read side: it looks up the named band and
filters `getAllGames()` (the full [game registry](../architecture/game-registry))
down to whichever configs' `bandsForGame()` result includes that band id
[@bands-file]. This is the function Home's age filter and the Settings screen
both call — restricting to one band narrows the grid to that subset; leaving
the filter unset shows every registered game.

## Labels come from translation keys, not the band data

`AGE_BANDS` carries a `label` field ("Toddler", "Preschool", "Early years",
"Big kids"), but that field is not what the UI renders. Every place a band
name appears on screen resolves it through `t('ageBands.<id>')` in the `core`
i18n namespace instead, so the displayed label is always the current
language's translation, not the English string baked into `bands.ts`. The
i18n key guard `src/sdk/i18n/__tests__/keys.test.ts` asserts
`core:ageBands.toddler` and `core:ageBands.kids` resolve to real values in
both English and Arabic, which is the enforced proof that band labels are a
translation concern layered on top of the `id`/`min`/`max` data, not the raw
`label` string itself [@keys-test].

Because band membership is computed from the same `ageRange` every game
already declares for the [game registry](../architecture/game-registry), age
bands add no new authoring burden — they are a read-time grouping over data
that already exists. The [Games catalog](../reference/games-catalog)
reference lists each of the eleven games' `ageRange` and resulting band
membership directly.
