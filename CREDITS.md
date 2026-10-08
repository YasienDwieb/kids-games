# Credits & Asset Licenses

A running log of third-party assets bundled in this app, with their source and
license. Add an entry **before** importing any new third-party asset.

## Visual assets

### Google Noto Emoji — emoji artwork

- **Used for:** match-up game tile icons (`src/sdk/assets/emoji/png/`), resolved
  via `src/sdk/assets/emoji/images.ts` and rendered through the `EmojiImage` SDK primitive.
- **Source:** https://github.com/googlefonts/noto-emoji — © Google Inc.
- **License:** Apache License 2.0 (emoji images). https://www.apache.org/licenses/LICENSE-2.0
- **Terms honored:** attribution (this entry). Commercial use permitted; no share-alike.

## Audio assets

### Higgsfield (Seed Audio 1.0) — spoken praise

- **Used for:** the voice that says the celebration praise lines
  (`src/sdk/assets/audio/voice/praise-{en,ar}-{1..8}.m4a`), played by `useCelebrate()`.
- **Source:** generated with Higgsfield AI (model: Seed Audio 1.0, preset voice "Pixie"),
  2026-10-08, on the project's Higgsfield account.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.
- **Processing:** trimmed of leading/trailing silence, converted to mono AAC, and
  loudness-normalized to the house level (≈ −25 dBFS RMS, peak ≤ −6 dBFS).

### Kenney — feedback SFX

- **Used for:** shared game sound effects (`src/sdk/assets/audio/cc0/`), via `useSound()`:
  `pop` (drop_*) and `balloon` (drop_003 pitched to 5 pentatonic notes), `success` (confirmation_*), `wrong` (error_*) from *Interface Sounds*;
  `win`, per-game win jingles + `transition` (jingles_PIZZI*/STEEL*/SAX*) from *Music Jingles*; `powerup`
  (phaserUp*) from *Digital Audio*; `hit` (impactGeneric_light_*) from *Impact Sounds*.
- **Source:** Kenney (www.kenney.nl) — https://kenney.nl/assets/interface-sounds,
  https://kenney.nl/assets/music-jingles, https://kenney.nl/assets/digital-audio,
  https://kenney.nl/assets/impact-sounds
- **License:** CC0 1.0 (public domain dedication). https://creativecommons.org/publicdomain/zero/1.0/
- **Terms honored:** no attribution required; credited here as a courtesy. Clips were
  converted to WAV, trimmed and loudness-normalized (CC0 permits modification).
