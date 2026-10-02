---
title: "Asset Manifest Tags Reference"
summary: "The AssetEntry shape and the controlled sound-effect tag vocabulary that useSound, useLoopSound, and pickAsset resolve against."
topics: [reference, assets, audio]
sources:
  - id: manifest
    type: file
    path: src/sdk/assets/manifest.ts
  - id: asset-types
    type: file
    path: src/sdk/assets/types.ts
  - id: asset-query
    type: file
    path: src/sdk/assets/query.ts
  - id: claude-md
    type: file
    path: CLAUDE.md
  - id: config-types
    type: file
    path: src/sdk/config/types.ts
  - id: win-jingles-test
    type: file
    path: src/games/__tests__/winJingles.test.ts
---

`src/sdk/assets/manifest.ts` is a single object, `ASSETS`, mapping asset ids
like `'sfx.pop'` to an `AssetEntry` — `{ modules: number[], type: AssetType,
tags: string[] }`, where `AssetType` is `'audio' | 'image' | 'icon' |
'texture'` [@asset-types]. Games never call `ASSETS['sfx.pop']` directly;
instead code plays sound by *intent* — a plain string like `'success'` or
`'wrong'` — and the query layer in `src/sdk/assets/query.ts` resolves that
intent against each entry's `tags` array [@asset-query]. This page is the
exact, controlled vocabulary of tags currently defined, so adding a new sound
effect or picking the right intent string for a new game doesn't require
re-reading the manifest from scratch.

## Query functions

| Function | Behavior |
|---|---|
| `getAsset(id)` | Direct lookup of one `AssetEntry` by its manifest id. |
| `findAssets({ type?, tags? })` | Returns every asset id whose `type` matches (if given) and whose `tags` include *all* of the requested tags — an AND match, not OR [@asset-query]. |
| `pickAsset(intent)` | Returns the first asset id in `ASSETS` whose `tags` array includes the intent string. This is a match against an entry's `tags`, not against the manifest key — `pickAsset('correct')` returns `'sfx.success'`, not a key literally named `'correct'` [@asset-query]. |
| `modulesFor(intent, overrides?)` | Resolves `intent` to an asset id via `pickAsset`, then returns `getAsset(overrides[id] ?? id).modules` — the asset's own modules unless `overrides` redirects that id to a different one [@asset-query]. |
| `pickModule(intent, overrides?)` | Calls `modulesFor(intent, overrides)`, then returns one random entry from the result, or `undefined` if no asset matches [@asset-query]. |

`overrides` is a `SoundOverrides` value, `Partial<Record<AssetId, AssetId>>`
— a map from one asset id to another, not from an intent string to an asset
id [@asset-query]. A game sets one through its own `config.ts`'s `sounds`
field (see [Game config schema](../reference/game-config-schema)); every
`useSound().play(intent)` call inside that game then resolves through this
override automatically, described in full on the
[Audio and speech](../architecture/audio-and-speech) architecture page
[@config-types].

Sound-effect entries carry one to several interchangeable `require()`'d
`.wav` variants in `modules`, so `pickModule`'s random pick keeps repeated
taps or matches from sounding identical every time [@manifest]. Every clip in
the manifest is a soft CC0 recording, entirely from Kenney's "Interface
Sounds," "Music Jingles," "Digital Audio," and "Impact Sounds" packs,
loudness-normalized to one level (−25 dBFS active RMS, peak ≤ −6 dBFS) so no
intent jumps out over another; this replaced an earlier 8-bit chiptune pack
("Sound Effects Mini Pack 1.5") that was pulled for sounding harsh to
children, and separately replaced a one-off OpenGameArt balloon-pop recording
with a Kenney `drop_003` clip pitched to five pentatonic notes (see
`sfx.balloon` below) [@manifest]. See
[Licensing and attribution](../reference/licensing-and-attribution) for the
exact credit entries. The `animal.*` and `jingle.*` entries are the
exceptions to the tag/intent pattern: `animal.*` maps to exactly one real
animal-sound clip and is played by its literal id
(`useSound().play('animal.lion')`), and `jingle.*` entries carry `tags: []`
and are never matched by any intent at all — they are reached only when a
game's own `sounds` override redirects `'sfx.win'` to one of them, covered
after the main tag table below [@manifest].

## Controlled tag vocabulary

| Asset id | Tags | Typical game use |
|---|---|---|
| `sfx.pop` | `pop`, `flip`, `tap`, `ui`, `select` | Generic tap/flip/select feedback |
| `sfx.success` | `success`, `match`, `reward`, `correct`, `collect` | Correct answer, matched pair, collected item |
| `sfx.win` | `win`, `celebration`, `complete`, `levelup` | Level or round complete |
| `sfx.wrong` | `wrong`, `mismatch`, `error`, `incorrect`, `lose` | Wrong answer, mismatch, failure |
| `sfx.powerup` | `powerup`, `boost`, `upgrade` | Power-up or upgrade pickup |
| `sfx.transition` | `transition`, `teleport`, `whoosh`, `appear`, `next` | Scene/screen transitions, appear/next cues |
| `sfx.balloon` | `balloon` | Popping a balloon — one of 5 soft bloops on a major-pentatonic note, picked at random; because the notes share a scale, a level that pops many balloons in a row always sounds consonant rather than noisy [@manifest] |
| `sfx.hit` | `hit`, `bump`, `thud`, `hurt`, `damage` | Collision, bump, damage feedback |

The old `sfx.jump`, `sfx.explosion`, `sfx.laser`, and `sfx.random` entries were
removed along with the 8-bit pack; no current game intent maps to them
[@manifest]. A future mechanic that needs one of those behaviors (jump,
explosion, laser, misc blip) should add a soft CC0 clip under a new or
existing tag rather than reviving the old intent names.

## Per-game win jingles (`jingle.*`)

Twelve entries, `jingle.pizzi-02`/`jingle.pizzi-06`/`jingle.pizzi-10`/
`jingle.pizzi-15`, and the same four numeric suffixes under `jingle.steel-*`
and `jingle.sax-*`, each wrap one Kenney "Music Jingles" clip (a
rising/happy fanfare) on one of three instruments [@manifest]. None of the
twelve carry any tags, so none of them is ever reachable through
`play(intent)` directly — a game reaches one only by setting its own
`config.ts`'s `sounds: { 'sfx.win': 'jingle.<id>' }`, which redirects that
one game's `play('win')` (and `play('celebration')`, since both tags resolve
to `sfx.win`) to the chosen jingle instead of `sfx.win`'s own three-clip pool
[@manifest] [@config-types]. Three of the twelve ids (`jingle.pizzi-02`, `jingle.pizzi-10`,
`jingle.steel-10`) happen to wrap the same clips already in `sfx.win`'s own
three-clip default pool, so a game that sets one of those three overrides
hears a clip it could also have heard without any override — the difference
is that the override pins the game to that one fixed clip every time, instead
of a random pick among `sfx.win`'s three [@manifest]. `winJingles.test.ts`
guards the point of this feature: every
registered game that calls `play('win')` must set a `jingle.*` override, and
no two games may set the same one, so the fanfare that plays at the end of
one game never also plays at the end of another [@win-jingles-test] — see
[Game config schema](../reference/game-config-schema) for the exact
validation and test contract, and
[Audio and speech](../architecture/audio-and-speech) for how
`SoundOverridesContext` carries the override from `config.ts` into a running
game's `useSound()` calls.

This vocabulary is intentionally closed: `CLAUDE.md` documents the same
`sfx.*` tag sets as the controlled list for the manifest, and instructs
that adding a new sound effect means dropping the file under
`src/sdk/assets/<type>/` and adding a tagged `modules: [...]` entry rather than
inventing a new ad hoc tag [@claude-md]. `useSound` and `useLoopSound` both
resolve their `play(intent)` calls through this same `pickAsset`/`pickModule`
path, and both are described in full on the
[Audio and speech](../architecture/audio-and-speech) architecture page; the
[Add a game asset](../guides/add-a-game-asset) guide walks through adding a
new tagged entry to the manifest.
