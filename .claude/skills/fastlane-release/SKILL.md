---
name: fastlane-release
description: Use when preparing a new Google Play release for this Kids Games repo — updating Fastlane release notes (changelogs), the store descriptions/short description/title, or screenshots, or running the fastlane supply lanes. Trigger whenever the user mentions a "new release", "release notes", "changelog", "what's new", "store listing", "Play Store metadata", "fastlane", "supply", or updating app descriptions/screenshots — even if they don't name fastlane explicitly. Covers the bilingual (en-US + ar) metadata layout, the per-field character limits, deriving "what's new" from the last release tag, using the real in-app game names, screenshot rules, and the Fastfile lanes.
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
