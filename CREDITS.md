# Credits & Asset Licenses

A running log of third-party assets bundled in this app, with their source and
license. Add an entry **before** importing any new third-party asset.

## Visual assets

### Google Noto Emoji — emoji artwork

- **Used for:** emoji drawn as images across the app's games and screens, including Animal Safari's animal pictures (`src/sdk/assets/emoji/png/`), resolved
  via `src/sdk/assets/emoji/images.ts` and rendered through the `EmojiImage` SDK primitive.
- **Source:** https://github.com/googlefonts/noto-emoji — © Google Inc.
- **License:** Apache License 2.0 (emoji images). https://www.apache.org/licenses/LICENSE-2.0
- **Terms honored:** attribution (this entry). Commercial use permitted; no share-alike.

### Kenney — Background Elements (backdrop)

- **Used for:** the parallax hills and clouds behind games (`src/sdk/assets/backdrop/png/`).
- **Source:** Kenney (www.kenney.nl) — https://kenney.nl/assets/background-elements
- **License:** CC0 1.0 (public domain dedication). https://creativecommons.org/publicdomain/zero/1.0/
- **Processing:** recolored (CC0 permits modification).

### Higgsfield (Nano Banana Pro + Image to 3D) — Lulu and Zain, the buddies

- **Used for:** each buddy's four 2D poses
  (`src/sdk/assets/images/mascot/{owl,lion}-{wave,cheer,point,encourage}.png`, drawn by
  `Mascot`) and their rigged 3D models (`src/sdk/assets/models/{lulu,zain}.*`, drawn by
  `Lulu3D`).
- **Source:** redrawn in a semi-realistic style with Higgsfield AI (Nano Banana Pro) from the
  original 2D art, 2026-10-29, on the project's Higgsfield account; backgrounds removed with
  Higgsfield's background remover. The 3D models are Higgsfield Image to 3D (Meshy) meshes
  with its auto-rig, made from a front-view A-pose of each buddy.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.
- **Processing:** poses trimmed to 480×480 and quantised with pngquant; models decimated and
  split into a GLB plus raw RGBA texture with `scripts/3d/prep_glb.py`.

### Kenney — Car Kit & Racing Kit (3D models)

- **Used for:** Turbo Road's 3D road (`src/games/turbo-road/assets/models/`): the
  player, rival and oncoming vehicles, traffic cones (Car Kit 3.1), and the trees and
  finish arch (Racing Kit 2.0).
- **Source:** Kenney (www.kenney.nl) — https://kenney.nl/assets/car-kit,
  https://kenney.nl/assets/racing-kit
- **License:** CC0 1.0 (public domain dedication). https://creativecommons.org/publicdomain/zero/1.0/
- **Processing:** the Car Kit's palette texture was baked into vertex colors and the
  meshes deduplicated/welded (CC0 permits modification), so the app needs no textures.

### Kenney — Nature Kit (3D models)

- **Used for:** Turbo Road's per-theme roadside scenery
  (`src/games/turbo-road/assets/models/`): oak, round, palm and pine trees, cacti and
  rocks (`tree_*`, `cactus_*`, `rock_largeA`).
- **Source:** Kenney (www.kenney.nl) — https://kenney.nl/assets/nature-kit
- **License:** CC0 1.0 (public domain dedication). https://creativecommons.org/publicdomain/zero/1.0/

### Higgsfield (Nano Banana Pro) — home tile covers

- **Used for:** the illustrated home-tile art of every game (`src/games/<id>/cover.jpg`,
  `GameConfig.cover`).
- **Source:** generated with Higgsfield AI (Nano Banana Pro), 2026-10-29, on the project's
  Higgsfield account; resized to 400×400 JPEG.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.

### Higgsfield (Nano Banana Pro + Image to 3D) — 3D game models

- **Used for:** Mouse Maze's 3D board (`src/games/mouse-maze/assets/models/`): the mouse
  and the cheese; Candy Catch's wicker basket (`src/games/candy-catch/assets/models/`);
  Animal Safari's 12 animals (`src/games/animal-safari/assets/models/`, lifted to 3D with
  Higgsfield's SAM 3D Objects instead of Image to 3D);
  Balloon Archer's painted meadow backdrop
  (`src/games/balloon-archer/assets/meadow.jpg`, an image only).
- **Source:** each model's reference image was generated with Higgsfield AI (Nano Banana
  Pro) and turned into a textured mesh with Higgsfield's Image to 3D (Meshy), 2026-10-29,
  on the project's Higgsfield account.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.
- **Processing:** decimated and split into a texture-free GLB plus a raw RGBA texture
  with `scripts/3d/prep_glb.py` (Blender), so React Native can load them.

## Audio assets

### Higgsfield (Seed Audio 1.0) — spoken praise (English)

- **Used for:** the English voice that says the celebration praise lines
  (`src/sdk/assets/audio/voice/praise-en-{1..8}.m4a`), played by `useCelebrate()`,
  the "new sticker" announcement (`sticker-new-en.m4a`), and Lulu's tap lines
  (`lulu-tap-en-{1..3}.m4a`).
- **Source:** generated with Higgsfield AI (model: Seed Audio 1.0, preset voice "Pixie"),
  2026-10-08, on the project's Higgsfield account.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.
- **Processing:** trimmed of leading/trailing silence, converted to mono AAC, and
  loudness-normalized to the house level (≈ −25 dBFS RMS, peak ≤ −6 dBFS).

### Google AI Studio (Gemini 3.8 Flash TTS) — spoken praise (Arabic)

- **Used for:** the Arabic praise lines (`praise-ar-{1..8}.m4a`), the "new sticker"
  announcement (`sticker-new-ar.m4a`), and Lulu's tap lines (`lulu-tap-ar-{1..3}.m4a`).
- **Source:** generated in Google AI Studio (model `gemini-3.8-flash-tts`, voice "Sola",
  cheerful kids'-owl style prompt, fully vowelled Arabic text), 2026-10-09.
- **License:** generated output used under the Gemini API / Google AI Studio terms,
  which assign no ownership claim to Google over generated content.
- **Processing:** trimmed of silence, resampled to 44.1 kHz mono AAC 64 kbps, and
  loudness-matched to the English clips (−23.7 LUFS integrated, peak ≤ −6 dBFS).

### Google Cloud Text-to-Speech (Chirp 3 HD) — spoken prompts

- **Used for:** every phrase the games speak — letters, numbers, animals, colour goals and
  Trace It names, in English and Arabic (`src/sdk/assets/audio/speech/*.m4a`), played by
  `useSpeech()`.
- **Source:** generated with Google Cloud Text-to-Speech, Chirp 3 HD voice "Leda"
  (`en-US-Chirp3-HD-Leda`, `ar-XA-Chirp3-HD-Leda`), 2026-10-24, on the project's Google
  Cloud account, via `scripts/voice/generate.mjs`.
- **License:** generated output used under the Google Cloud terms, which assign no
  ownership claim to Google over generated content.
- **Processing:** median-length take of three, loudness-normalized to the house level
  (≈ −25 dBFS active RMS, peak ≤ −6 dBFS), mono AAC 64 kbps.

### Higgsfield (Seed Audio 1.0) — Zain's tap lines (English and Arabic)

- **Used for:** what Zain says when a child taps him (`src/sdk/assets/audio/voice/zain-tap-{en,ar}-{1..3}.m4a`).
- **Source:** generated with Higgsfield AI (model: Seed Audio 1.0, preset voice "Benji"),
  2026-10-18, on the project's Higgsfield account; Arabic lines from fully vowelled text.
- **License:** generated content used under the Higgsfield account's terms, which the
  project owner confirmed permit commercial use in this app.
- **Processing:** trimmed of silence, mono AAC 64 kbps at 44.1 kHz, loudness-matched to the
  Arabic clips (−23.7 LUFS integrated, peak ≤ −6 dBFS).

### Kenney — feedback SFX

- **Used for:** shared game sound effects (`src/sdk/assets/audio/cc0/`), via `useSound()`:
  `pop` (drop_*) and `balloon` (drop_003 pitched to 5 pentatonic notes), `success` (confirmation_*), `wrong` (error_*) from *Interface Sounds*;
  `win`, per-game win jingles + `transition` (jingles_PIZZI*/STEEL*/SAX*) from *Music Jingles*; `powerup`
  (phaserUp*) from *Digital Audio*; `hit` (impactGeneric_light_*) from *Impact Sounds*;
  Turbo Road's `crash` (impactMetal/Plate_heavy_* from *Impact Sounds* layered with
  explosionCrunch_* from *Sci-fi Sounds*) and `turbo` (thrusterFire_* from *Sci-fi Sounds*).
- **Source:** Kenney (www.kenney.nl) — https://kenney.nl/assets/interface-sounds,
  https://kenney.nl/assets/music-jingles, https://kenney.nl/assets/digital-audio,
  https://kenney.nl/assets/impact-sounds, https://kenney.nl/assets/sci-fi-sounds
- **License:** CC0 1.0 (public domain dedication). https://creativecommons.org/publicdomain/zero/1.0/
- **Terms honored:** no attribution required; credited here as a courtesy. Clips were
  converted to WAV, trimmed and loudness-normalized (CC0 permits modification).

### Wikimedia Commons — animal sounds

- **Used for:** Animal Safari's animal calls (`src/sdk/assets/audio/animals/`).
- **Source:** Wikimedia Commons — per-clip files and URLs in `src/sdk/assets/audio/animals/CREDITS.md`.
- **License:** CC0 1.0 or public domain (per clip). No attribution required.
- **Processing:** trimmed and re-encoded to AAC (`.m4a`).

## Original assets

### Turbo Road engine loop

- **Used for:** the engine rumble (`src/sdk/assets/audio/EngineLoop.wav`), via `useLoopSound`.
- **Source:** synthesized for this project by `scripts/gen_engine_loop.py`. No third-party material.
