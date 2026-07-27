---
title: "Play Store Listing As Code"
summary: "The Google Play listing text, screenshots, and changelogs are committed to the repo as fastlane metadata and managed separately from the EAS binary pipeline."
topics: [decisions, release, play-store]
sources:
  - id: play-store-doc
    type: file
    path: docs/PLAY_STORE.md
  - id: fastfile
    type: file
    path: fastlane/Fastfile
  - id: eas-json
    type: file
    path: eas.json
  - id: release-aab-workflow
    type: file
    path: .github/workflows/release-aab.yml
  - id: store-config-json
    type: file
    path: store.config.json
---

The project ships in two languages, English and Arabic, and Google Play asks
for a title, short description, full description, changelog, and screenshot
set per language per release. EAS builds and can submit the Android app
binary, but it has no first-class way to keep that listing content
version-controlled or reviewable — editing it by hand in the Play Console
leaves no history and no review step. The project's answer is to keep the
listing itself under version control, entirely separate from the binary build
pipeline.

## Decision

The Play Store listing lives in the repo, under
`fastlane/metadata/android/{en-US,ar}/` — `title.txt`, `short_description.txt`,
`full_description.txt`, a `changelogs/` folder, and per-locale screenshot
images [@play-store-doc]. Four `fastlane` lanes read and write that content
against the Play Developer API: `tracks` lists existing releases and their
version codes read-only, `validate` dry-runs the listing against the Play API
with no changes, `metadata` uploads listing text and images, and `pull` pulls
the live Play Console listing back down into the same folder structure
[@fastfile]. A `changelog` lane pushes release notes only. None of these lanes
touch the binary — every one of them sets `skip_upload_apk` and
`skip_upload_aab` [@fastfile].

This is a deliberate split of labor from `eas build` and `eas submit`, which
own the binary and nothing else. `eas.json` sets `appVersionSource: "remote"`,
so EAS auto-increments the Android `versionCode` on Expo's servers rather than
letting the repo choose it [@eas-json]. Because fastlane `supply` attaches
listing text, images, and changelogs to an existing Play release inside a
per-version-code upload loop, every listing lane requires an explicit
`version_code:` and `track:` pointing at a release that already exists — with
no binary to derive a version code from, fastlane fails with "Could not find
release for version code '' to update changelog" [@play-store-doc]. Since the
versionCode isn't known ahead of time, the changelog for a given locale
normally lives in a single `changelogs/default.txt` used for any release,
rather than one file per version; a maintainer can still add
`changelogs/<versionCode>.txt` to pin notes to one specific build
[@play-store-doc].

## Status

Current. The `release-aab.yml` GitHub Actions workflow wires both halves
together in one run: it builds the AAB with `eas build`, submits it with
`eas submit --platform android` to the Play internal track, reads the
resulting `versionCode` back out of the build metadata, and then runs
`fastlane metadata version_code:"$VERSION_CODE" track:internal` followed by
`fastlane changelog version_code:"$VERSION_CODE" track:internal` against that
same release [@release-aab-workflow].

This decision covers Google Play only. iOS listing text is also
version-controlled, in `store.config.json`, but pushed with `eas metadata:push`
instead of a fastlane lane [@store-config-json] — a different mechanism with
its own locale-code and field-limit rules, covered in
[Release an iOS build](../guides/release-an-ios-build) rather than repeated
here.

## Consequences

The listing copy in both languages, the screenshot set, and the changelog
text are versioned and reviewable like any other source file, and a
maintainer can dry-run a listing change with `fastlane validate` before it
goes live [@play-store-doc]. The cost is a second toolchain: Ruby and
fastlane sit alongside the Node/EAS pipeline, and the two systems must be kept
in sync by hand — the changelog step has to be pointed at the same track and
version code the binary actually landed on, or the upload targets the wrong
release. See [Update the Play Store listing](../guides/update-the-play-store-listing)
for the day-to-day lane commands, and
[Build and release config](../reference/build-and-release-config) for how
`eas.json` and the release workflows fit together.
