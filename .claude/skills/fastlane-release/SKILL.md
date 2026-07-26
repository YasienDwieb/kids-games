---
name: fastlane-release
description: Use when preparing a new store release for this Kids Games repo on EITHER Google Play OR the Apple App Store — updating release notes/changelogs, store descriptions/subtitle/title/keywords, or screenshots, and running the release lanes (fastlane supply for Play, EAS build/submit/metadata for iOS). Trigger whenever the user mentions a "new release", "release notes", "changelog", "what's new", "store listing", "Play Store metadata", "App Store", "App Store Connect", "TestFlight", "eas submit", "eas metadata", "fastlane", "supply", "submit to the store/app store", or updating app descriptions/screenshots — even if they don't name the tool. Covers the bilingual metadata layout (Play uses `ar`, App Store uses `ar-SA`), per-field character limits, deriving "what's new" from the last release tag, real in-app game names, per-store screenshot rules, the Fastfile supply lanes, AND the full iOS App Store submission flow (§8: EAS credentials, store.config.json, eas build/submit, eas metadata:push, and the ASC manual fields).
---

# fastlane-release

Prepare a new Google Play release for the Kids Zone app: refresh the Fastlane store
metadata (release notes, descriptions, screenshots) so it accurately reflects what
shipped, then commit it on its own branch and open a PR.

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

## 6. Pushing to Play (Fastfile lanes)

`supply` uploads listing text + images + changelogs **per existing release version_code**
— there is no binary upload in these lanes, so each one targets a release that already
exists on the track. Look codes up first:

```bash
bundle exec fastlane tracks                                  # list tracks + version codes
bundle exec fastlane validate version_code:<vc> track:<t>    # dry-run, no changes
bundle exec fastlane metadata  version_code:<vc> track:<t>   # listing text + images (no notes)
bundle exec fastlane changelog version_code:<vc> track:<t>   # release notes only
bundle exec fastlane pull                                    # pull live listing into metadata/
```

`track` defaults to `production`. The binary (AAB) is built/uploaded separately (EAS or
manual); these lanes only refresh the store listing for that release. Running a lane is
an outward, publishing action — confirm with the user and prefer `validate` first.

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

## 8.2 Fixed identity facts (this app)

- Apple Team ID: **J98M86H34Z** (an Individual team — NOT the `waybeyond` domain).
- Bundle ID: **`dev.waybeyond.kidszone`** (registered under that team; bundle IDs don't
  require domain ownership).
- ASC app ID (`ascAppId`): **6793942277**.
- ASC API key: `fastlane/metadata/ios/AuthKey_FJS3Y8R9KM.p8`, Key ID `FJS3Y8R9KM`,
  Issuer ID `39271b7c-fb0c-4b41-91d1-377b65e44696`. **`.p8` is downloadable once — keep a
  backup outside the repo. It is gitignored; never let it enter git history.**
- EAS project owner is the **`waybeyond` Expo org** (`app.json` → `owner`,
  `extra.eas.projectId`). To run any `eas` command against it you must be a MEMBER of the
  `waybeyond` org — check `eas whoami` (the Accounts list must include `waybeyond`). If a
  command returns `Entity not authorized: AppEntity[...]`, the logged-in account isn't a
  member; the fix is an org invite, not switching accounts.

## 8.3 store.config.json — the iOS listing (bilingual)

`configVersion: 0`, localized text under `apple.info.<locale>`. **iOS locale codes differ
from Play**: use `en-US` and **`ar-SA`** (NOT `ar` — that's Play's code; `eas metadata:lint`
rejects `ar`). Field limits: `title` ≤30, `subtitle` ≤30, `promoText` ≤170,
`description` ≤4000, `keywords` (comma-joined) ≤100. Adapt the Play `full_description` /
`short_description` copy; verify Arabic **character** counts (multibyte) not bytes.

EAS metadata pushes ONLY text: name/subtitle/promo/description/keywords/releaseNotes +
support/marketing/privacy URLs. It does **NOT** push: category, age rating, privacy label,
pricing, content rights, or screenshots — those are ASC-UI manual (§8.6).

Always run before pushing: `npx eas metadata:lint` (validates schema + locale codes + limits).

## 8.4 The iOS release flow (order matters)

```bash
# 0. Be a member of the waybeyond Expo org, then:
npx eas whoami                                  # confirm access
npx eas metadata:lint                           # validate store.config.json

# 1. Build (first run is INTERACTIVE — Apple login to create signing)
npx eas build -p ios --profile production
#    Prompts "Generate a new Apple Distribution Certificate? / Provisioning Profile?"
#    → answer Y to BOTH the first time (none exist yet; EAS-managed).

# 2. Upload the build to ASC (non-interactive, uses the .p8)
npx eas submit -p ios --profile production      # → appears in TestFlight, "Ready to Submit"

# 3. Push listing text (en-US + ar-SA)
npx eas metadata:push --profile production
```

The build/submit/push commands are outward, publishing actions — confirm with the user and
prefer `metadata:lint` first. `metadata:push` needs the ASC app to exist (it does: 6793942277).

## 8.5 Version

`app.json` `expo.version` is shared with Play. iOS build number auto-increments remotely
(`eas.json` cli.appVersionSource:remote + production.autoIncrement). Bump `version` for a
real release; don't silently change it — flag to the user (same rule as Play).

## 8.6 Manual finish in App Store Connect (not automatable)

After metadata + build are up, in the ASC **Distribution / App Store** tab:

- **Category:** Education. **Age rating:** run the questionnaire — Kids Zone answers
  **NONE / NO to every content question** → **4+**. On the final page choose **Not
  Applicable** (normal listing), NOT "Made for Kids" (we deliberately avoid the Kids
  Category program). Leave Age Suitability URL blank.
- **App Privacy:** "Data Not Collected" (no ads/tracking/accounts/network). Requires an
  ASC **Admin** to confirm — a Developer role can set answers but may not finalize.
- **Pricing:** set **Free** (USD 0.00) — required or submit is blocked.
- **Content Rights:** App Information → confirm you have rights (emoji art is
  Noto/OpenMoji Apache/CC + own art).
- **Attach the build** for this version, set the version's Copyright (`<year> Waybeyond`),
  then **Add for Review → Submit**.

## 8.7 iOS rules & things to watch

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
