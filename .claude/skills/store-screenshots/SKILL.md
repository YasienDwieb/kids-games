---
name: store-screenshots
description: Use when refreshing Kids Zone's store screenshots or feature graphic — Play phone/tablet galleries, iOS iPhone 6.9" / iPad 13" sets, en + ar. Covers the emulator capture pipeline (screenshots/capture.sh), the seeded demo state, the Pop Quest gallery composer (screenshots/render.js) and where each output goes. Trigger on "screenshots", "store images", "feature graphic", "update the shots".
---

# store-screenshots

Real captures of the release APK on a headless emulator, seeded with demo
state, composed into captioned galleries. Never the physical phone.

```bash
bash screenshots/capture.sh            # ~45 min: en+ar × phone, tablet, ipad (8 scenes each)
node screenshots/render.js             # ~1 min: galleries + feature graphics
```

Subsets: `--lang ar`, `--form tablet`, `--scenes "turbo maze"` (keeps the other
captures), `--keep` (leave the emulator running between runs), `--apk PATH`.
`node screenshots/render.js en` renders one language.

## Prerequisites

- Release APK at `android/app/build/outputs/apk/release/app-release.apk` with
  `lib/x86_64/` (a local `assembleRelease`; EAS/Play builds won't install).
  Check it's newer than the last source change: `find src -newer <apk>`.
  The user builds it — don't start gradle/EAS yourself.
- AVD `KidsZone_Shots` (android-34 google_apis x86_64, 1080×2340 @440, 6 cores,
  3 GB). Recreate with `source screenshots/android.sh; avd_ensure KidsZone_Shots`
  then set `hw.cpu.ncore = 6`, `hw.ramSize = 3072` in its config.ini.
- Everything targets `ANDROID_SERIAL=emulator-5580`; a USB phone is never touched.

## Outputs → destinations (only after the user has reviewed them)

| `screenshots/out/store/<lang>/…` | Destination |
|---|---|
| `play-phone/NN.png` (1920×1080) | `fastlane/metadata/android/<en-US\|ar>/images/phoneScreenshots/NN.jpg` — replace the whole set, saved as JPEG q92 |
| `play-tablet/NN.png` (2560×1600) | `…/images/tenInchScreenshots/` — replace the whole set |
| `play-tablet7/NN.png` (1920×1200, from the tablet captures) | `…/images/sevenInchScreenshots/` — replace the whole set |
| `featureGraphic.png` (1024×500) | `…/images/featureGraphic.png` |
| `ios-phone/NN.png` (2796×1290) | `fastlane/metadata/ios/screenshots/<en-US\|ar-SA>/iphone-NN.png` (RGB) |
| `ios-ipad/NN.png` (2752×2064) | `…/ipad-NN.png` — upload both with `fastlane ios screenshots` (ask first) |
| en phone `01…08.jpg` | `docs/screenshots/<name>.jpg` README twins, byte-identical (fastlane-release §5); names in the loop below |

```bash
S=screenshots/out/store
for pair in en:en-US ar:ar; do l=${pair%%:*}; d=fastlane/metadata/android/${pair#*:}/images
  rm -f "${d:?}"/phoneScreenshots/* "${d:?}"/tenInchScreenshots/* "${d:?}"/sevenInchScreenshots/*
  for p in $S/$l/play-phone/[0-9][0-9].png; do
    python3 -c "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=92)" \
      "$p" "$d/phoneScreenshots/$(basename "$p" .png).jpg"; done
  cp $S/$l/play-tablet/[0-9][0-9].png $d/tenInchScreenshots/
  mkdir -p $d/sevenInchScreenshots; cp $S/$l/play-tablet7/[0-9][0-9].png $d/sevenInchScreenshots/
  cp $S/$l/featureGraphic.png $d/featureGraphic.png
done
for pair in en:en-US ar:ar-SA; do l=${pair%%:*}; d=fastlane/metadata/ios/screenshots/${pair#*:}
  find $d -name '*.png' -delete
  for f in ios-phone:iphone ios-ipad:ipad; do for p in $S/$l/${f%%:*}/[0-9][0-9].png; do
    python3 -c "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],optimize=True)" \
      "$p" "$d/${f#*:}-$(basename "$p")"; done; done
done
P=fastlane/metadata/android/en-US/images/phoneScreenshots
i=1; for n in home-landscape level-up letter-land turbo-road color-mixer wardrobe match-up parent-corner; do
  cp $P/0$i.jpg docs/screenshots/$n.jpg; i=$((i+1)); done
```

If the Play phone order or a scene changes, rename to match and update the
README's `## Screenshots` grid (2 per row, `width="400"`).

Then run `bash .claude/skills/fastlane-release/scripts/check-listing.sh`.

## Changing things

- **Demo state** — `screenshots/seed.js` writes `kg:*` rows into AsyncStorage's
  `RKStorage` (anchored to today): level 7 / 48 stars, crown + sunglasses, a week
  of play time, 30-min limit. Values like the wardrobe caption's stars/level are
  read back from the captured Home text, so edit the seed, not the captions.
- **Scenes** — `scene_*` functions + `SCENES` in `capture.sh`; labels per
  language in `label()`. `name|regex` asserts on dumped UI text; `name|-` is for
  animated screens uiautomator can't dump (check those visually).
- **Captions & order** — `COPY` in `render.js`, en + ar (ar leads with letters:
  Arabic-first content is its hook). Keep the listing count-agnostic (no "12
  games") and don't claim what the listing doesn't. Order is the pitch: brand +
  "no ads" → celebration → learning → action → creativity → rewards → puzzle →
  grown-ups last. `extra: true` frames (numbers, maze) fill App Store / tablet
  slots only; galleries are capped per store (`FORMS.max`: Play 8, iOS 10).
- **Look** — Pop Quest tokens/fonts; motif = Lulu's star trail across seams.
  Each frame's stripe colour is its game's `ACCENTS` family (`bg`), brand yellow
  on the first and last frame. Avoid two adjacent frames with the same accent.

## Gotchas this project hit

- `-no-audio` makes API 34 `MediaSessionService` block → watchdog kills
  system_server (installs fail with "Can't find service: package" / broken
  pipe). Keep audio on, cold-boot with `-no-snapshot` (a snapshot saved from that
  state stays broken).
- 3D Lulu and the game loops never repeat a frame: `capture` accepts the last
  non-blank frame, and uiautomator dumps fail on those screens.
- Turbo Road's Race! moves between layouts → `tap_color` taps the largest coral
  blob. The seed switches it to the 3D road (`kg:turbo-road:prefs`): the 2D
  sprites overlap at the start line. Home's rail mirrors under RTL → `open_game` swipes the other way (`RTL=1`).
- Grown-ups gate is a random sum: `solve_gate` reads it from the dump.
- The emulator's JS lags taps by 1–2s and each `adb` call costs ~1s, so
  short-lived states (a Simple Pairs mismatch shows for 1s) need taps and a
  `screencap` burst in one on-device `adb shell`, read back afterwards.
- `pairs` = the LEVEL UP card: rewards are set to 55 stars (level 8 is 56),
  then Simple Pairs Easy is won in ≤ 3 moves by comparing flipped faces. It's
  captured last and rolls rewards back from a `shot_bak` table on every try.
- `matchup` identifies each tile against the bundled emoji PNGs and only makes
  correct drags: a wrong drop brings up Lulu's "Oops!". Round 1 is always the
  animal → food theme (`MATCHUP_PAIRS`). A retry hits the resume prompt.
- `mixer` holds blue mid-drag over a yellow pot (`input motionevent`) and snaps
  its own frame (`name|@`); a dropped mix merges too fast to catch.
- Count & Pop ignores a seeded `kg:progress:count-and-pop` level (stays on 1),
  so it isn't a scene.
- Demo mode shows only 9:41 + battery so the same captures pass on iPhone frames.
- The wardrobe and Color Mixer don't scale to tablet (phone-sized UI in empty space), so
  tablet/iPad galleries skip them (`phoneOnly`). Settings footer still says
  "Kids Games · v1.0" — an app bug, don't paint over it.
