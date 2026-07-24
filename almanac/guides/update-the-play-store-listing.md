---
title: "Update The Play Store Listing"
summary: "How to change the Google Play listing text, screenshots, and release notes with fastlane supply lanes, independent of shipping a new binary."
topics: [guides, release, play-store]
sources:
  - id: play-store-docs
    type: file
    path: docs/PLAY_STORE.md
  - id: fastfile
    type: file
    path: fastlane/Fastfile
  - id: appfile
    type: file
    path: fastlane/Appfile
  - id: metadata-dir
    type: file
    path: fastlane/metadata/android/
  - id: eas-json
    type: file
    path: eas.json
  - id: aab-workflow
    type: file
    path: .github/workflows/release-aab.yml
---

Kids Zone's Google Play listing — title, descriptions, screenshots, and
release notes — is managed as code under `fastlane/` and pushed with
`fastlane supply` lanes, separately from building or submitting the app binary
[@play-store-docs]. That separation means the listing text can change (a typo
fix, a better description, new screenshots) without triggering a new EAS build
at all; it only needs an existing release on the target track to attach to.

## Preconditions

You need a Play Console service-account JSON saved at
`fastlane/play-store-key.json` (gitignored, referenced by
`fastlane/Appfile`'s `json_key_file`) [@appfile], and an existing release
already present on the track you want to edit — `fastlane supply` attaches
listing text, images, and changelogs to a release it finds by version code, so
it has nothing to attach to if the track is empty [@play-store-docs]
[@fastfile]. Run `fastlane tracks` first; it's read-only and lists every track
with its releases and version codes, which is the only reliable way to know
what version code and track to target before editing anything
[@fastfile] [@play-store-docs].

## Steps

1. Edit the relevant file(s) under `fastlane/metadata/android/{en-US,ar}/`
   [@metadata-dir]: `title.txt` (30-character limit), `short_description.txt`
   (80-character limit), `full_description.txt` (4000-character limit), or
   `changelogs/default.txt` / `changelogs/<versionCode>.txt` (500 characters
   per entry) [@play-store-docs]. To replace a screenshot or graphic, replace
   the file under the matching `images/{icon,featureGraphic,phoneScreenshots,
   tenInchScreenshots,...}` subfolder; filenames are zero-padded so fastlane's
   alphabetical upload order matches display order [@play-store-docs].
2. Run `fastlane validate version_code:<vc> track:<track>` first. It's a dry
   run against the Play API — listing text, images, and changelogs are
   checked but nothing is actually pushed [@fastfile] [@play-store-docs].
3. Run `fastlane metadata version_code:<vc> track:<track>` to push listing
   text and images without touching changelogs, or
   `fastlane changelog version_code:<vc> track:<track>` to push only release
   notes [@fastfile]. Both lanes require `version_code:` and `track:`
   explicitly — the Fastfile's `require_version_code` helper raises a clear
   error if `version_code` is missing, and `track` otherwise defaults to
   `production` [@fastfile]. Because `eas.json`'s `cli.appVersionSource` is
   `"remote"`, EAS — not this repo — assigns each build's Android version
   code, so most listing edits in practice rely on the single
   `changelogs/default.txt` fallback per locale rather than a
   version-code-pinned changelog file, unless a maintainer deliberately wants
   to pin notes to one specific release [@play-store-docs] [@eas-json].
4. If the Play Console listing was ever edited directly in the console rather
   than through this workflow, run `fastlane pull` to download the live
   listing back into `fastlane/metadata/` so the repo stays the source of
   truth [@fastfile] [@play-store-docs].

Which track to target is not fixed. The automated
[Release an Android build](../guides/release-an-android-build) AAB workflow
always pushes to the `internal` track as part of a production submission
[@aab-workflow]. But `docs/PLAY_STORE.md`'s own worked example of
`fastlane tracks` output shows the closed-testing release actually living on
the `alpha` track with `production` empty at that time [@play-store-docs] —
a reminder that the right track for a listing-only edit is whatever
`fastlane tracks` reports right now, not whatever track a workflow file
happens to mention.

The Arabic listing under `fastlane/metadata/android/ar/` is a complete,
independently written listing (title, both descriptions, changelog, images),
not a stub of the English one — it reads right-to-left and only omits the
optional `sevenInchScreenshots` folder that the English listing also leaves
empty [@play-store-docs] [@metadata-dir].

## Verify

After a `metadata` or `changelog` run, check the listing preview in the Play
Console for the track you targeted, or run `fastlane pull` again and diff the
freshly pulled files against what you just edited to confirm they match
[@fastfile] [@play-store-docs]. See
[Licensing and attribution](../reference/licensing-and-attribution) if a
listing change involves updating credited third-party assets that also appear
in a screenshot.
