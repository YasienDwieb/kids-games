---
name: fastlane-release
description: Use when preparing OR shipping a store release for this Kids Games repo on EITHER Google Play OR the Apple App Store — updating release notes/changelogs, store descriptions/subtitle/title/keywords, or screenshots, and running the release lanes (fastlane supply for Play, EAS build/submit/metadata for iOS). Trigger whenever the user mentions a "new release", "release notes", "changelog", "what's new", "store listing", "Play Store metadata", "App Store", "App Store Connect", "TestFlight", "eas submit", "eas metadata", "fastlane", "supply", "submit to the store/app store", or updating app descriptions/screenshots — even if they don't name the tool. ALSO trigger when a release CI run failed or half-finished and the user wants to resume, re-submit, or "ship without rebuilding" (§6.3 — reuse the finished EAS build, never rebuild; covers the `This Edit has been deleted` Play error). Covers the bilingual metadata layout (Play uses `ar`, App Store uses `ar-SA`), per-field character limits, deriving "what's new" from the last release tag, real in-app game names, per-store screenshot rules, the release-aab GitHub workflow and Fastfile supply lanes, AND the full iOS App Store submission flow (§8: EAS credentials, store.config.json, eas build/submit, eas metadata:push, and the ASC manual fields).
---

# fastlane-release

Prepare and ship a new Google Play release for the Kids Zone app: refresh the Fastlane
store metadata (release notes, descriptions, screenshots) so it accurately reflects what
shipped, commit it on its own branch and open a PR, then get the binary and listing onto
Play (§6) — including resuming a release whose CI run died part-way (§6.3).

> **The store listing is bilingual: English (`en-US`) AND Arabic (`ar`).** Every text
> change must be made in BOTH locales — `supply` uploads each locale independently and
> a missing/stale Arabic file ships a worse listing to Arabic users. Arabic copy is
> warm and kid/parent-friendly (not literal machine translation) and uses Western
> digits, matching the in-app i18n contract.

## Where everything lives

```
fastlane/
├── Fastfile                      # supply lanes (see §6)
├── Appfile                       # package_name + json_key_file
└── metadata/android/
    ├── en-US/
    │   ├── title.txt             # ≤ 30 chars
    │   ├── short_description.txt # ≤ 80 chars
    │   ├── full_description.txt  # ≤ 4000 chars
    │   ├── changelogs/default.txt# release notes, ≤ 500 chars
    │   └── images/
    │       ├── icon/ featureGraphic/
    │       ├── phoneScreenshots/      # 2–8 images
    │       └── tenInchScreenshots/    # tablet
    └── ar/  … same structure
```

`changelogs/default.txt` is the **fallback** "What's new" applied to any release that
has no version-code-specific file. We keep release notes here (one evergreen "what's
new lately" message) rather than per-version-code files.

The in-app game names you should quote in copy live at
`src/games/<id>/locales/{en,ar}.ts` under `meta.name` / `meta.description` — always use
those exact names so the listing matches what players see in the app.

## The release-prep workflow

Do these in order. Steps 1–2 are what make the notes *accurate*; skipping them leads to
release notes that under- or over-claim.

1. **Start from the up-to-date default branch.** The notes describe what's merged, so
   base the work on the real `master`, not a stale local copy or a feature branch:
   ```bash
   git fetch origin --tags --prune
   git checkout -b chore/release-metadata origin/master
   ```
   (If the user has uncommitted screenshots in the working tree, `checkout -b` carries
   them over cleanly as long as the metadata files themselves weren't changed on master.)

2. **Compute "what's new" since the last release.** Find the last release tag and list
   the user-facing additions since then:
   ```bash
   git describe --tags --abbrev=0 origin/master           # last release tag, e.g. v1.1.2
   git log --oneline <tag>..origin/master | grep -iE 'feat|add'
   ```
   Then figure out which of those are genuinely **new to the listing** by checking which
   games already exist at the tag vs now, and which are already named in
   `full_description.txt`:
   ```bash
   for g in $(ls src/games | grep -vE '_template|index.ts|HOW_TO|registry|CONTRACT'); do
     git cat-file -e <tag>:src/games/$g/config.ts 2>/dev/null \
       && echo "$g: existed at <tag>" || echo "$g: NEW since <tag>"
   done
   ```
   The headline items are usually **new games** and **new modes/features** (e.g. the
   Guided Journey). Tags here can be loose (local vs origin may diverge) and `app.json`
   `version` can lag the latest tag — treat the tag as the signal for "what shipped",
   and flag a version bump to the user rather than guessing one.

3. **Update the release notes** — `changelogs/default.txt` in **both** locales. See
   §4 for the rules. Keep ≤ 500 chars (the validator in §7 checks this).

4. **Update the descriptions only if a game/feature is missing.** `full_description.txt`
   lists "a taste of what's inside" as themed bullets and is intentionally
   game-count-agnostic — add a bullet for a new game and a short section for a new
   feature, in both locales. `title.txt` / `short_description.txt` are evergreen; leave
   them unless the user asks. See §5.

5. **Handle screenshots** (§5). The user usually drops new image files in; your job is
   to make sure each locale ends up with a clean, ordered 2–8 set.

6. **Validate, then commit on a new branch and open a PR.**
   ```bash
   bash .claude/skills/fastlane-release/scripts/check-listing.sh   # §7
   git add -A fastlane/
   git commit -m "chore(store): <summary of listing/notes/screenshot changes>"
   git push -u origin chore/release-metadata
   gh pr create --base master --title "chore(store): …" --body-file <file>
   ```
   Follow the repo commit conventions: brief message, no co-authored trailer, and **ask
   before committing/pushing** unless the user has already said to proceed.

   This branch carries only store text/images — it does **not** need the app binary. The
   notes describe merged features, so confirm those features are actually on `master`
   before advertising them.

## 4. Writing release notes (`changelogs/default.txt`)

- **Audience is the parent**, content is about the child's experience. Warm, concrete,
  a little playful. Lead with a short header line, then bullets, then a friendly tagline.
- **Hard limit: 500 characters** (Play truncates beyond this). Verify with the validator.
- **Name new games with their real in-app names** (from `meta.name`) and a 2–4 word hint
  of what they do. Mention new modes/features explicitly.
- **Both en-US and ar.** Western digits in Arabic; flip naturally for RTL reading.
- Keep emoji literal and sparing (one per bullet is plenty).

**Example (en):**
```
What's new in Kids Zone 🎉

• Four new games! 🔺 Shape Detective (spot the pattern), 🏎️ Turbo Road (steer & race),
🔢 Count & Pop (counting & numbers), and 🔗 Match Up (connect what goes together).
• New Guided Journey 🧭 — a gentle, hands-off path from one activity to the next.
• Crisper artwork and lots of polish.

Big buttons, happy sounds, no reading needed, full English & Arabic. Enjoy! 💛
```

## 5. Descriptions & screenshots

**Descriptions** (`full_description.txt`): add a themed bullet per new game inside the
"taste of what's inside" list, and a short titled section for a substantial new feature
(e.g. a `🧭 GUIDED JOURNEY` paragraph). Mirror every edit in `ar`. Don't enumerate an
exact game count anywhere — the listing stays count-agnostic so it doesn't go stale.
Limits: full_description ≤ 4000, short_description ≤ 80, title ≤ 30.

**Screenshots** (`images/phoneScreenshots/`, `images/tenInchScreenshots/`):
- Each locale needs **2–8** phone screenshots.
- Files are ordered by filename (`01`, `02`, …). `supply` accepts `.jpg`, `.jpeg`,
  and `.png`, and mixed extensions are fine — but **never two files with the same index**
  (e.g. `01.jpg` and `01.jpeg`), which is ambiguous. When the user swaps an extension,
  make sure the old file is removed (`git status` should show the old one Deleted).
- en-US and ar may have different counts; both just need to be in 2–8.
- Run the validator (§7) to catch duplicate indices and out-of-range counts.

**The README shares these screenshots.** `docs/screenshots/*.jpg` are byte-identical copies
of the **en-US** phone set (`home-landscape.jpg` = `01.jpg`, and so on). When a phone
screenshot changes, refresh its `docs/` twin in the same PR or the README goes stale —
`md5sum docs/screenshots/*.jpg fastlane/metadata/android/en-US/images/phoneScreenshots/*.jpg`
shows at a glance which ones drifted. Also add the new game to the README games table and
the `src/games/` tree.

## 6. Pushing to Play

### 6.1 The normal path — the CI workflow

`.github/workflows/release-aab.yml` (**`workflow_dispatch`**, run it from the Actions tab)
is the whole release in one job, and it is the path to prefer:

It has **no inputs — it always ships to `production`**:

1. `eas build -p android --profile production` → AAB, capturing `BUILD_ID` + `VERSION_CODE`
2. `eas submit --profile production --id "$BUILD_ID"` → Play **production** track,
   **draft** (per `eas.json` `submit.production.android`)
3. `fastlane metadata  version_code:$VERSION_CODE track:production`
4. `fastlane changelog version_code:$VERSION_CODE track:production`

`releaseStatus: draft` means the release appears on production but stays behind
**"Start rollout"** in the Play Console — CI is never a one-way door.

Production-only is deliberate. Routing every release through internal → closed →
production is *not* required for an app that is already live, buys no review-time
advantage, and strands releases (1.2.0/vc=13 sat on internal+alpha for weeks while
production served 1.1.1). For a deliberate test build, submit by hand with the
`submit.internal` profile (`eas submit -p android --profile internal --id <BUILD_ID>`)
and move it over later with `fastlane promote` (§6.4) — never rebuild to change track.

Division of labour: **EAS owns `versionCode`** (remote autoIncrement — never hand-edit it);
`app.json` `expo.version` is the semver you bump. The workflow does not tag or bump semver.

Because steps 3–4 run only if step 2 succeeds, a failed submit leaves the **binary uploaded
but the listing untouched** — see §6.3.

### 6.2 Running the lanes by hand

```bash
fastlane tracks                                  # list tracks + version codes
fastlane validate version_code:<vc> track:<t>    # dry-run, no changes
fastlane metadata  version_code:<vc> track:<t>   # listing text + images (no notes)
fastlane changelog version_code:<vc> track:<t>   # release notes only
fastlane promote  version_code:<vc> track:<from> to:<to>   # move a release between tracks
fastlane pull                                    # pull live listing into metadata/
```

**Plain `fastlane`, not `bundle exec fastlane` — this repo has no Gemfile** (`bundle exec`
dies with "Could not locate Gemfile"). CI installs it with `gem install fastlane`.

`supply` uploads listing text + images + changelogs **per existing release version_code**
— there is no binary upload in these lanes, so each targets a release that already exists
on the track. **Always run `tracks` first and target the version code of the release you
mean.** `track` defaults to `production`, which is right for the normal flow but still
needs the *correct version code*: release notes are per-version-code, so aiming them at
the live production release stamps next version's notes onto the build users are already
running. The release you want is the one `tracks` shows as `[draft]` — check before every
run.

`fastlane tracks` is also the only honest answer to "what is actually live". A git tag or
an `app.json` version proves nothing shipped: production sat on `vc=11 name="1.1.1"` while
the repo had a `v1.1.2` tag and `app.json` said `1.2.0`.

Running a lane is an outward, publishing action — confirm with the user and prefer
`validate` first.

### 6.3 Recovering from a failed submit — do NOT rebuild

If the CI job fails at **Submit AAB to Play**, the EAS build already succeeded. Rebuilding
wastes ~1h and burns a `versionCode`. Reuse the finished build:

```bash
gh run view <run-id> --log-failed | tail -40        # confirm which step died
npx eas build:list --platform android --limit 5 --non-interactive --json \
  | jq -r '.[] | "\(.id)  vc=\(.appBuildVersion)  ver=\(.appVersion)  \(.status)"'
npx eas submit --platform android --profile production --id <BUILD_ID> --non-interactive
fastlane tracks                                     # confirm the vc landed as [draft]
fastlane metadata  version_code:<vc> track:internal
fastlane changelog version_code:<vc> track:internal
```

**`Google Api Error: This edit has expired` / `This Edit has been deleted`** (retried 5×,
then fatal) means the Play edit was invalidated *while the job was running* — classically
because someone discarded that release in the Play Console. It is not a credentials or
metadata fault; nothing is wrong with the repo. Just re-submit the existing build as above.

After a manual recovery the listing you pushed may come from an unmerged
`chore/release-metadata` branch — say so, and get the PR merged so Play and `master` agree.

### 6.4 Promoting a release between tracks — never rebuild for this

A build already sitting on a test track can be moved to production as-is:

```bash
fastlane tracks                                            # find the version code
fastlane promote version_code:<vc> track:internal to:production
fastlane tracks                                            # confirm it landed as [draft]
```

Defaults are `track:internal to:production status:draft`. Pass `status:completed` only if
you want it to go live without the Console click.

**Never discard a test release and rebuild just to "release directly to production".**
Review time is identical — Google reviews the artifact, not the route it took, and an AAB
already scanned for a test track is if anything reviewed faster. Rebuilding costs an hour,
burns a version code, and swaps a tested binary for an untested one. Discarding a release
mid-flight is also what produces the `This Edit has been deleted` failure in §6.3.

## 7. Validate before committing

`scripts/check-listing.sh` checks every locale for: per-field character limits, that
release notes exist and are ≤ 500 chars, screenshot counts in 2–8, and no duplicate
screenshot indices. Run it after editing and before the PR:

```bash
bash .claude/skills/fastlane-release/scripts/check-listing.sh
```

Exit code is non-zero on any hard failure, so it's safe to gate a commit on it.

## Gotchas

- **Don't write notes from a stale tree.** Always rebase the work on the real `master`
  so you advertise what actually merged (we've shipped notes describing features that
  were still on unmerged branches — base off `origin/master` and verify).
- **Local vs origin tags can diverge** (a plain `git fetch` won't clobber existing tags).
  Trust `origin` for the "last release" question; mention the discrepancy if it matters.
- **`app.json` `version` may lag the latest tag.** Don't silently bump it — flag it and
  let the user decide the new version for the build.
- **Both locales, every time.** A change in `en-US` with no matching `ar` edit is the
  most common defect here.
- **Don't judge locale coverage from `tail`.** `supply` uploads the two locales on
  concurrent threads, so the `ar` lines interleave unpredictably and a truncated tail can
  look exactly like Arabic was skipped. Confirm with
  `fastlane changelog … | grep -iE "language|Uploaded"` and check both `en-US` **and**
  `ar` appear, rather than re-running blind.
- **A tag is not a shipment.** Trust `fastlane tracks` over git tags and `app.json` for
  what is actually on Play.

---

# 8. iOS App Store release (EAS Build + Submit)

Everything above is **Google Play**. iOS ships through **EAS** (managed Expo workflow),
not fastlane deliver. There is no native `ios/` dir — EAS handles signing in the cloud.

## 8.1 Where iOS things live

```
app.json                       # expo.version (shared with Play), ios.bundleIdentifier,
                               #   ios.config.usesNonExemptEncryption:false
eas.json                       # submit.production.ios → ASC API key + team + ascAppId
store.config.json              # App Store listing text (en-US + ar-SA) — eas metadata
fastlane/metadata/ios/
├── AuthKey_<KEYID>.p8         # ASC API key — GITIGNORED via *.p8, NEVER commit
├── SUBMIT.md                  # step-by-step runbook
└── screenshots/README.md      # required sizes + capture guide
```

## 8.2 Identity & access (reference)

- Apple Team ID **J98M86H34Z**, Bundle ID **`dev.waybeyond.kidszone`**, ASC app ID
  (`ascAppId`) **6793942277** — all wired into `eas.json` / `app.json` already.
- ASC API key `fastlane/metadata/ios/AuthKey_FJS3Y8R9KM.p8` (gitignored via `*.p8`; keep a
  backup outside the repo — Apple lets you download it once).
- The EAS project is owned by the **`waybeyond` Expo org**. You must be a member to run
  `eas` — check `eas whoami` (Accounts must list `waybeyond`). `Entity not authorized:
  AppEntity[...]` means the logged-in account isn't a member → get an org invite.

## 8.3 store.config.json — the iOS listing (bilingual)

`configVersion: 0`, localized text under `apple.info.<locale>`. **iOS locale codes differ
from Play**: use `en-US` and **`ar-SA`** (NOT `ar` — that's Play's code; `eas metadata:lint`
rejects `ar`). Field limits: `title` ≤30, `subtitle` ≤30, `promoText` ≤170,
`description` ≤4000, `keywords` (comma-joined) ≤100. Adapt the Play `full_description` /
`short_description` copy; verify Arabic **character** counts (multibyte) not bytes.

`eas metadata:push` pushes ONLY text (name/subtitle/promo/description/keywords/releaseNotes
+ support/marketing/privacy URLs). It does **NOT** push screenshots, or the per-version
finish in §8.5 — do those in the ASC UI.

## 8.4 Ship a new iOS version — the recurring flow

```bash
npx eas whoami                                  # confirm waybeyond org access
npx eas metadata:lint                           # validate store.config.json (run before every push)

npx eas build   -p ios --profile production     # cloud build (signing is already set up)
npx eas submit  -p ios --profile production      # upload to ASC → TestFlight → "Ready to Submit"
npx eas metadata:push --profile production       # push en-US + ar-SA listing text
```

These are outward, publishing actions — confirm with the user; run `metadata:lint` first.
Bump `app.json` `expo.version` for the release (don't change it silently — flag to the
user; same rule as Play). Build number auto-increments remotely.

## 8.5 Per-version finish in App Store Connect (UI)

Screenshots and these steps happen in the ASC **Distribution / App Store** tab for the new
version, then **Add for Review → Submit**:

- **Attach the build** for this version; set **"What's New"** (release notes) and the
  version **Copyright** (`<year> Waybeyond`).
- **Screenshots:** upload the required sets (see §8.6 for sizes) if they changed.
- **Category / Age rating / App Privacy** normally **carry over** from the previous version
  — just confirm they're still set. (App is Education, 4+, "Data Not Collected", normal
  listing — NOT the Kids Category. App Privacy may need an ASC **Admin** to confirm.)
- **Pricing** is app-level (Free) — set once, carries over.

## 8.6 iOS rules & things to watch

- **`ar` vs `ar-SA`.** Play uses `ar`; App Store uses `ar-SA`. Using `ar` in
  `store.config.json` fails `eas metadata:lint`. Always lint before pushing.
- **Verify the English listing after `metadata:push`.** EAS metadata can occasionally
  populate one locale on the version page but not the other. After pushing, open the ASC
  version page and confirm the **en-US** Description/Keywords/Support URL are present; if a
  field is blank, paste it from `store.config.json` (hand-filling is quicker than
  re-pushing). To hand off exact values when the user can't copy from the terminal, write a
  throwaway text file at repo root — don't commit it, delete it after.
- **Screenshot sizes.** App is **landscape-only** → capture landscape. The unified
  **iPhone 6.9″** slot accepts 6.5″/6.7″/6.9″ sizes (e.g. 2796×1290 from a 6.7″/6.9″
  device), and one 6.9″ set scales to all smaller iPhones. An iPad **13″** set is required
  because `supportsTablet:true` (2752×2064 landscape). In the simulator, ⌘S saves at true
  device resolution.
- **If the simulator shows emoji as `?`-boxes, it's the runtime, not the app.** Some iOS
  simulator runtimes fail to render color emoji system-wide (it fails even in the sim's
  Safari). Real devices always render emoji. Diagnose by opening any emoji page in the
  sim's Safari; if it's tofu, switch to a different runtime version or a real device — never
  "fix" app code for this, and never ship screenshots captured from such a runtime.
- **Support URL must be an `https` page, not a `mailto:`.** Apple's support-email field is
  separate. A privacy policy URL is also required — both are hard submission blockers.
