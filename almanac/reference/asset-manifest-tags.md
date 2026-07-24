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
| `pickModule(intent)` | Calls `pickAsset(intent)`, then returns one random entry from that asset's `modules` array, or `undefined` if no asset matches [@asset-query]. |

Sound-effect entries carry five interchangeable `require()`'d `.wav` variants
in `modules` (drawn from the "Sound Effects Mini Pack 1.5" 8-bit pack)
specifically so `pickModule`'s random pick keeps repeated taps or matches from
sounding identical every time [@manifest]. The `animal.*` entries are the
exception: each maps to exactly one real animal-sound clip and is played by
its literal id (`useSound().play('animal.lion')`), not through the
tag/intent system [@manifest].

## Controlled tag vocabulary

| Asset id | Tags | Typical game use |
|---|---|---|
| `sfx.pop` | `pop`, `flip`, `tap`, `ui`, `select` | Generic tap/flip/select feedback |
| `sfx.success` | `success`, `match`, `reward`, `correct`, `collect` | Correct answer, matched pair, collected item |
| `sfx.win` | `win`, `celebration`, `complete`, `levelup` | Level or round complete |
| `sfx.wrong` | `wrong`, `mismatch`, `error`, `incorrect`, `lose` | Wrong answer, mismatch, failure |
| `sfx.powerup` | `powerup`, `boost`, `upgrade` | Power-up or upgrade pickup |
| `sfx.jump` | `jump`, `hop`, `bounce` | Character jump/hop/bounce |
| `sfx.transition` | `transition`, `teleport`, `whoosh`, `appear`, `next` | Scene/screen transitions, appear/next cues |
| `sfx.explosion` | `explosion`, `blast`, `boom`, `destroy`, `pop-big` | Big destructive impact |
| `sfx.hit` | `hit`, `bump`, `thud`, `hurt`, `damage` | Collision, bump, damage feedback |
| `sfx.laser` | `laser`, `shoot`, `zap`, `fire`, `beam` | Shooting/zap mechanics |
| `sfx.random` | `random`, `misc`, `surprise`, `blip-alt` | Miscellaneous/surprise cue with no better fit |

This vocabulary is intentionally closed: `CLAUDE.md` documents the same
eleven `sfx.*` tag sets as the controlled list for the manifest, and instructs
that adding a new sound effect means dropping the file under
`src/sdk/assets/<type>/` and adding a tagged `modules: [...]` entry rather than
inventing a new ad hoc tag [@claude-md]. `useSound` and `useLoopSound` both
resolve their `play(intent)` calls through this same `pickAsset`/`pickModule`
path, and both are described in full on the
[Audio and speech](../architecture/audio-and-speech) architecture page; the
[Add a game asset](../guides/add-a-game-asset) guide walks through adding a
new tagged entry to the manifest.
