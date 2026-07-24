---
title: "Add A Game Asset"
summary: "How to add a new tagged sound effect to the shared audio manifest, and how to bundle a new emoji image via the fetch-emoji script."
topics: [guides, assets, audio]
sources:
  - id: manifest
    type: file
    path: src/sdk/assets/manifest.ts
  - id: types
    type: file
    path: src/sdk/assets/types.ts
  - id: use-sound
    type: file
    path: src/sdk/audio/useSound.ts
  - id: credits
    type: file
    path: CREDITS.md
  - id: fetch-emoji
    type: file
    path: scripts/fetch-emoji.mjs
  - id: images-ts
    type: file
    path: src/sdk/assets/emoji/images.ts
  - id: images-test
    type: file
    path: src/sdk/assets/emoji/__tests__/images.test.ts
---

"Add a game asset" covers two different procedures in this repo that share one
idea: games never reference a raw file, only a stable logical key that the SDK
resolves to bundled art or sound. Adding a sound effect means adding a tagged
entry to `src/sdk/assets/manifest.ts` so `useSound().play('<tag>')` can find
it [@manifest]. Adding an emoji image means fetching a Noto PNG with a script
and adding one line to `src/sdk/assets/emoji/images.ts` so it renders
consistently instead of falling back to the device's own emoji font
[@images-ts]. The two procedures are unrelated in mechanism but follow the same
license discipline: anything third-party gets an entry in `CREDITS.md` before
it's imported [@credits].

## Procedure A: Add A New Sound Effect

1. Drop the audio file(s) into `src/sdk/assets/<type>/`, following the existing
   folder convention (for example, `src/sdk/assets/audio/` holds the current
   `.wav` effects) [@manifest].
2. Add a tagged entry to the `ASSETS` object in `manifest.ts`. Each entry has a
   `modules: [require(...), ...]` array of one or more interchangeable
   variants and a `tags: string[]` array. Multiple variants exist so repeated
   taps or matches don't sound identical every time — `pickModule`/`pickAsset`
   choose a random variant per play [@manifest]. The `type` field is one of the
   `AssetType` values (`'audio' | 'image' | 'icon' | 'texture'`) defined in
   `src/sdk/assets/types.ts` [@types]. Tags should come from, or sensibly
   extend, the existing controlled vocabulary — see
   [Asset manifest tags](../reference/asset-manifest-tags) for the exact
   current list rather than guessing at what's already covered.
3. Games play the new sound only by intent string, never by file path or
   manifest key: `useSound().play('<tag>')`. `useSound` resolves the tag to a
   random module variant, respects the user's sound and haptics settings, and
   fails silently if the tag is unknown or sound is disabled, so a game never
   crashes over a missing asset [@use-sound]. See
   [Audio and speech](../architecture/audio-and-speech) for how this fits into
   the rest of the audio system.
4. If the asset is third-party, add an entry to `CREDITS.md` before merging,
   recording its source and license. The existing entries follow one pattern:
   a "Used for" line naming the concrete file path and the SDK primitive that
   consumes it, a "Source" line with the upstream project, a "License" line
   with the exact license and a link, and a "Terms honored" line stating what
   obligations (attribution, share-alike, etc.) apply. The Noto Emoji entry and
   the "Sound Effects Mini Pack 1.5" entry are the two existing examples to
   follow for wording and structure [@credits].

## Procedure B: Add A New Bundled Emoji Image

Emoji in this app render as bundled Noto PNGs rather than the device's live
system emoji font, specifically so the same glyph looks identical across
phones instead of varying by manufacturer font. The `EmojiImage`/
`getEmojiImage` layer looks up a glyph in the `EMOJI_IMAGES` map and falls back
to the system font only for glyphs that were never bundled [@images-ts].

1. Run `node scripts/fetch-emoji.mjs <emoji-glyph...>` with one or more literal
   emoji characters as arguments. For each glyph, the script computes its
   codepoints (uppercase hex, the `FE0F` variation selector stripped, joined
   with hyphens), downloads the matching PNG from the `googlefonts/noto-emoji`
   GitHub repo's raw `png/128` directory, and saves it to
   `src/sdk/assets/emoji/png/<CODE>.png` [@fetch-emoji]. The script fetches the
   **128px** variant specifically, not the 512px art also available in that
   repo — deliberately, since bundling smaller PNGs decodes faster at
   render time [@fetch-emoji]. Misses (glyphs Noto has no art for) are printed
   to stderr so the emoji can be swapped for one that exists [@fetch-emoji].
2. For each glyph fetched, the script prints a ready-to-paste line like
   `"🍎": require("./png/1F34E.png"),`. Paste that line into the `EMOJI_IMAGES`
   map in `src/sdk/assets/emoji/images.ts` [@images-ts] [@fetch-emoji].
3. If the emoji is a third-party asset in the licensing sense (it is — Noto
   Emoji is Apache-2.0), it's already covered by the existing Noto Emoji entry
   in `CREDITS.md`; a new glyph from the same source does not need a new
   `CREDITS.md` entry, only new third-party *sources* do [@credits].

## Verify

Run `npx tsc --noEmit` and `npm test` after either procedure. The emoji layer
has its own guard test, `src/sdk/assets/emoji/__tests__/images.test.ts`, which
asserts that a representative set of word-picture glyphs used by the
listen-and-find games all resolve through `getEmojiImage` — a newly bundled
glyph that's misspelled or pasted into the map incorrectly would surface as a
failure there if it's one of the glyphs that test covers [@images-test]. For a
new sound tag, there is no dedicated automated test; confirm it by actually
triggering the sound in the running app (see
[Test on a real device](../guides/test-on-a-real-device) for why sound assets
in particular need on-device confirmation rather than a Jest run).
