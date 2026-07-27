---
title: "Release An Android Build"
summary: "How to produce a shareable test APK versus submit a production AAB to Google Play, using the two manual GitHub Actions release workflows."
topics: [guides, release, android]
sources:
  - id: apk-workflow
    type: file
    path: .github/workflows/release-apk.yml
  - id: aab-workflow
    type: file
    path: .github/workflows/release-aab.yml
  - id: eas-json
    type: file
    path: eas.json
---

Kids Zone ships Android builds through two separate, manually triggered GitHub
Actions workflows rather than one pipeline, because a throwaway test APK and a
Play Store submission have different owners for versioning: the APK workflow
owns semver and git tags, while the AAB workflow lets EAS auto-increment the
Android version code remotely [@aab-workflow]. Which one to run depends on
whether the goal is a build to hand someone for testing, or a real submission
to the Play Console. iOS has no equivalent GitHub Actions workflow; it ships
through EAS commands run directly, covered in
[Release an iOS build](../guides/release-an-ios-build).

## Branch A: I Just Need A Shareable Test APK

Trigger `release-apk.yml` manually (`workflow_dispatch`) from the GitHub
Actions tab, choosing a semver bump (`patch`/`minor`/`major`) or supplying an
explicit `version` override [@apk-workflow]. The workflow:

1. Computes the next version from the latest `v*` git tag and the chosen bump
   (or uses the explicit override), and bumps `app.json`'s `expo.version`
   [@apk-workflow].
2. Runs `eas build --platform android --profile preview`, which is the
   `preview` EAS profile — internal distribution, meant for installing
   directly rather than through the Play Store [@apk-workflow] [@eas-json].
3. Waits for the build, downloads the resulting APK, commits the version bump
   and a matching git tag directly to `master`, and creates a GitHub Release
   with the APK attached [@apk-workflow].

Because neither `tsc` nor the Jest suite runs automatically as part of this
workflow, it's worth running `npx tsc --noEmit` and `npm test` locally before
triggering it — see [No CI quality gate](../decisions/no-ci-quality-gate) for
why that check is a manual habit rather than an enforced gate in this repo.

## Branch B: I Need To Ship A Production Build To The Play Store

Trigger `release-aab.yml` manually. It runs
`eas build --platform android --profile production`, the `production` EAS
profile, which has `autoIncrement: true` — EAS, not this repo, owns the
Android version code for production builds [@aab-workflow] [@eas-json]. The
workflow then:

1. Captures the EAS build id and the auto-incremented `appBuildVersion`
   (the version code) from the build output [@aab-workflow].
2. Runs `eas submit` against that build id to Google Play's `internal` track
   as a draft release, using the Play service-account key written from the
   `PLAY_STORE_KEY_JSON` secret, matching `eas.json`'s `submit.production`
   config (`track: "internal"`, `releaseStatus: "draft"`) [@aab-workflow]
   [@eas-json].
3. Runs `fastlane metadata` and then `fastlane changelog`, both targeting
   `track:internal` and the version code from step 1, to push the store
   listing text and that version's release notes [@aab-workflow]. See
   [Update the Play Store listing](../guides/update-the-play-store-listing)
   for what those fastlane lanes actually push and how to edit the listing
   content itself, rather than repeating fastlane's lane behavior here.

This workflow does not bump `app.json`'s semver or create a git tag — that
remains Branch A's responsibility [@aab-workflow]. In practice, a full
production release that should carry both a tagged version and a live Play
submission may mean running both workflows: Branch A for the version bump and
tag, Branch B for the actual Play Console submission.

## Verify

For Branch A, confirm the new GitHub Release appears in the repo's Releases
list with the APK attached and the new `v*` tag pushed to `master`
[@apk-workflow]. For Branch B, open the Play Console and confirm the build
shows up as a draft release on the internal testing track before promoting it
to any wider track [@aab-workflow] [@eas-json]. Field-by-field details of
`eas.json`'s build and submit profiles are covered in
[Build and release config](../reference/build-and-release-config).
