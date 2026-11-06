---
title: "Licensing and Attribution Reference"
summary: "The PolyForm Shield 1.0.0 noncompete license the code ships under today (Apache-2.0 only for versions up to the last-apache tag), the NOTICE attribution and reserved-asset terms layered on top of it, and the license terms of individual bundled third-party assets."
topics: [licensing, reference]
sources:
  - id: license
    type: file
    path: LICENSE
  - id: notice
    type: file
    path: NOTICE
  - id: credits
    type: file
    path: CREDITS.md
  - id: animal-credits
    type: file
    path: src/sdk/assets/audio/animals/CREDITS.md
---

This page is lookup material for one question: what can you legally do with this
repository's code and its bundled assets, and what must you preserve if you copy,
fork, or redistribute any of it. The repository's code is currently licensed as a
whole under the PolyForm Shield License 1.0.0, copyright 2026 Yasien Dwieb
[@license]. Layered on top of that grant is a separate `NOTICE` file that
restates an attribution requirement, names the licensor's line of business, and
reserves a list of specific assets and trademarks outside the license entirely
[@notice]. A third file, `CREDITS.md`, tracks the license terms of individual
third-party assets bundled inside the app, which is where you have to look before
reusing an emoji image or a sound effect on its own [@credits].

## The code license: PolyForm Shield, not Apache-2.0

The project switched licenses partway through its history. `NOTICE` itself
records the boundary: "Versions up to and including the commit tagged
`last-apache` were released under the Apache License 2.0 ... and remain
available under those terms" [@notice], with the old license text kept at
`LICENSES/Apache-2.0.txt`. Every commit after that relicensing point — which
is every commit this wiki otherwise describes as "current" — is under the
PolyForm Shield License 1.0.0 instead [@license] [@notice].
This is not a permissive open-source license: PolyForm Shield grants a copyright
and patent license to use, modify, and distribute the software for "any
permitted purpose," but its **Noncompete** clause excludes one purpose
specifically — "providing any product that competes with the software or any
product the licensor or any of its affiliates provides using the software"
[@license]. The license's **Competition** clause defines that broadly: goods
and services can compete "even when they provide functionality through
different kinds of interfaces or for different technical platforms," and
"even when provided free of charge" [@license]. `NOTICE`
makes the scope of that exclusion concrete with a `Licensor Line of Business:`
line naming "Kids Zone, an educational games app for children on mobile app
stores, published by the licensor or a company the licensor controls (currently
waybeyond)" [@notice] — under PolyForm's **Discontinued Products** clause, that
line is what would keep a fork from competing with Kids Zone even if the
licensor stopped shipping it. A forker's normal use (personal, family, school,
or research use that is not itself a competing children's games product) is
unaffected by Noncompete; it is specifically a product that competes with Kids
Zone, or with another product the licensor ships using this code, that the
license does not permit.

## The NOTICE requirement

PolyForm Shield's own **Notices** clause is the mechanism that keeps `NOTICE`
binding: anyone who receives a copy of the software from you must also get a
copy of the license terms (or their URL) plus "copies of any plain-text lines
beginning with `Required Notice:`" that the licensor included [@license].
`NOTICE` supplies exactly one such line: "Required Notice: Copyright 2026 Yasien
Dwieb (https://github.com/YasienDwieb/kids-games)" [@notice]. Unlike the
project's earlier Apache-2.0 `NOTICE`, the current one does not separately ask a
distributor to restate a "Based on..." attribution sentence — the `Required
Notice:` line itself is the whole attribution obligation, carried forward
verbatim rather than paraphrased.

## Reserved assets and the trademark list

PolyForm Shield's grant covers the *code*; it says nothing about trademarks or
about specific creative assets, so `NOTICE` reserves both unilaterally, outside
the license, under a "RESERVED ASSETS (all rights reserved)" heading [@notice].
Four asset groups are named explicitly: the buddies — Lulu the owl and Zain the
lion cub, meaning their characters, names, and designs, the pose art under
`src/sdk/assets/images/mascot/`, their rigged 3D models under
`src/sdk/assets/models/`, and their likeness as drawn by `Lulu3D` — the
`@react-three/fiber` component that renders those rigged models at runtime,
covered in full on [Buddy, mascot, and wardrobe](../architecture/buddy-and-wardrobe);
game art, meaning every game's home-tile cover image
(`src/games/*/cover.jpg`), the clay-toy pictures under `src/sdk/assets/clay/`,
and the 3D models and painted backdrops under `src/games/*/assets/` that
`CREDITS.md` doesn't separately credit to a third party; voice recordings under
`src/sdk/assets/audio/voice/` and `src/sdk/assets/audio/speech/`; and the app
icon, splash art, and Play Store listing text and graphics [@notice]. None of
these may be copied, modified, or distributed outside an official Kids Zone
build without written permission, regardless of what the PolyForm license
itself would otherwise allow for the surrounding code [@notice]. `NOTICE`
separately lists "Kids Zone", "Kids Games", "Lulu", "Zain", and the Kids Zone
logo and app icon as unlicensed trademarks of the licensor, and states that
"Forks and derivative works must use a different name and branding" [@notice].
This is distinct from the app's own shipped market name; see
[Kids Zone product name](../decisions/kids-zone-product-name) for how the
current build already trades under a different, unrelated brand.

## Third-party asset credits

`CREDITS.md` is the running log the project keeps for every third-party asset
bundled into the app, and it is authoritative for what license terms apply to
each one individually — the PolyForm Shield grant on the repository's own code
does not automatically relicense assets the project merely bundled from
elsewhere [@credits]. The Animal Safari sound clips keep a second, separate
credits log at `src/sdk/assets/audio/animals/CREDITS.md` instead of an entry in
the root file, since it needs a per-clip table (one row per animal, each with
its own Wikimedia Commons source file) rather than the single "used for"
paragraph the root file's entries use [@animal-credits].

`CREDITS.md` has grown well past sound effects: it also logs the Higgsfield
AI image/3D-model generations behind the buddies, game covers, clay pictures,
and several games' 3D models, plus the Higgsfield, Google AI Studio, and
Google Cloud Text-to-Speech voice generations behind spoken praise and
prompts [@credits]. Crediting the *generation tool* in `CREDITS.md` is not the
same claim as licensing the *generated artwork* — those specific outputs are
exactly the "buddies" and "game art" categories `NOTICE` reserves above, all
rights reserved, regardless of what tool produced them [@notice] [@credits].
The table below covers only the openly-licensed assets that are not also
reserved by `NOTICE`; see `CREDITS.md` directly for the full, current list.

| Asset | Bundled at | License | Attribution required? |
|---|---|---|---|
| Google Noto Emoji artwork | `src/sdk/assets/emoji/png/`, resolved via `src/sdk/assets/emoji/images.ts` and rendered through the `EmojiImage` SDK primitive | Apache License 2.0 | Yes — commercial use is permitted and there is no share-alike obligation, but the project honors attribution via the `CREDITS.md` entry itself [@credits] |
| Kenney feedback SFX and jingles (Interface Sounds, Music Jingles, Digital Audio, Impact Sounds) | `src/sdk/assets/audio/cc0/`, played through `useSound()` for `pop`/`success`/`win`/`wrong`/`powerup`/`transition`/`hit`/`balloon`, plus the twelve `jingle.*` per-game win-jingle assets | CC0 1.0 public domain dedication | No — no attribution required; credited as a courtesy. Clips were converted to WAV, trimmed, and loudness-normalized, which CC0 permits [@credits] |
| Animal Safari sound clips (lion, elephant, dog, cat, frog, horse, sheep, rooster, duck, bird, bee) | `src/sdk/assets/audio/animals/`, played by literal id (`useSound().play('animal.lion')`) in Animal Safari's "which sound" rounds | CC0 or Public Domain per clip (recorded individually on Wikimedia Commons) | No — recorded here as a courtesy, same as the Kenney set [@animal-credits] |
| Kenney Background Elements | `src/sdk/assets/backdrop/png/` — the parallax hills and clouds behind games | CC0 1.0 public domain dedication | No — recolored from the original, which CC0 permits [@credits] |
| Kenney Car Kit & Racing Kit (3D models) | `src/games/turbo-road/assets/models/` — Turbo Road's player/rival/oncoming vehicles, traffic cones, and the finish arch, loaded by the game-local loader covered on [3D rendering in games](../architecture/3d-rendering) | CC0 1.0 public domain dedication | No — the palette texture was baked into vertex colors and meshes deduplicated, which CC0 permits [@credits] |
| Kenney Nature Kit (3D models) | `src/games/turbo-road/assets/models/` — Turbo Road's per-theme roadside scenery (oak/round/palm/pine trees, cacti, rocks) | CC0 1.0 public domain dedication | No [@credits] |

The animal clips were originally Ogg Vorbis and were re-encoded to AAC
(`.m4a`, mono 96 kbps) because iOS only plays Ogg starting at version 18.4 and
this app supports older iPhones; CC0/public-domain terms permit that kind of
re-encoding the same way they already permitted the trimming and fade-in/out
each clip received [@animal-credits]. See
[Add a game asset](../guides/add-a-game-asset) for the resulting rule on new
audio: short SFX ship as WAV, longer clips ship as `.m4a`, and Ogg is never
used for a new asset.

Every bundled sound-*effect* clip (the table above; not the spoken-word voice
and speech clips `CREDITS.md` logs separately) is now sourced from Kenney. Two
earlier non-Kenney sound-effect sources were replaced, not merely trimmed: an
8-bit chiptune pack, "Sound Effects Mini Pack 1.5" by phoenix1291 (Swiss Arcade
Game Entertainment, also CC0), was removed because its style read as harsh to
children, and a single OpenGameArt balloon-pop recording ("Balloon Sounds" by
AntumDeluge) was replaced by a Kenney `drop_003` clip pitched to five
pentatonic notes for the `sfx.balloon` intent; neither replaced source has a
remaining `CREDITS.md` entry [@credits]. See
[Asset manifest tags](../reference/asset-manifest-tags) for the tag
vocabulary the current set uses.

The Kenney entry records the exact source URL and license URL alongside the
terms honored, which is the pattern `CONTRIBUTING.md` asks every new
third-party asset entry to follow before it is imported into the codebase.

If you are changing what the Play Store listing itself says about licensing or
credits, that text lives outside this reference; see
[Update the Play Store listing](../guides/update-the-play-store-listing).
