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
  - id: fastfile
    type: file
    path: fastlane/Fastfile
  - id: skill
    type: file
    path: .claude/skills/fastlane-release/SKILL.md
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

Trigger `release-aab.yml` manually. It takes no `workflow_dispatch` inputs —
it always builds and ships to production, on purpose; there is no separate
internal/closed/production choice at trigger time [@aab-workflow]. It runs
`eas build --platform android --profile production`, the `production` EAS
profile, which has `autoIncrement: true` — EAS, not this repo, owns the
Android version code for production builds [@aab-workflow] [@eas-json]. The
workflow then:

1. Captures the EAS build id and the auto-incremented `appBuildVersion`
   (the version code) from the build output [@aab-workflow].
2. Runs `eas submit` against that build id to Google Play's **`production`**
   track as a draft release, using the Play service-account key written from
   the `PLAY_STORE_KEY_JSON` secret, matching `eas.json`'s `submit.production`
   config (`track: "production"`, `releaseStatus: "draft"`) [@aab-workflow]
   [@eas-json]. `releaseStatus: "draft"` means the build lands on production
   but stays behind a manual **"Start rollout"** click in the Play Console —
   this workflow is never a one-way door, even though it always targets
   production [@aab-workflow]. That click has a command-line equivalent:
   `fastlane rollout version_code:<vc> [track:production] [percent:<0-1>]`
   moves the release to `completed` (fully live) by default, or to a
   fractional, `inProgress` staged rollout when passed a `percent` below
   `1.0` (e.g. `percent:0.2` for 20%) [@fastfile].
3. Runs `fastlane metadata` and then `fastlane changelog`, both targeting
   `track:production` and the version code from step 1, to push the store
   listing text and that version's release notes [@aab-workflow]. See
   [Update the Play Store listing](../guides/update-the-play-store-listing)
   for what those fastlane lanes actually push and how to edit the listing
   content itself, rather than repeating fastlane's lane behavior here.

### Gotcha: `rollout` Must Always Set `rollout:`, Not Just `release_status:`

An earlier version of the `rollout` lane set `release_status: "completed"`
and left `rollout` unset for a full release. Running it printed "Successfully
finished the upload to Google Play" and changed nothing — versionCode 13 sat
on `production` as a draft, exactly as before [@fastfile]. The cause is in
fastlane `supply`'s `Uploader#perform_upload`: every lane in this Fastfile
sets `skip_upload_apk` and `skip_upload_aab`, so no version codes ever come
from a binary, and on that path `supply` only touches the existing release if
`track_promote_to` or `rollout` is set — `release_status` alone is never read
[@fastfile]. `promote` was never affected because it always sets
`track_promote_to`. The fix is to always pass `rollout:` explicitly — the
current lane defaults it to `"1.0"` for a full release — and derive
`release_status` from that value instead of setting it independently
(`inProgress` below `1.0`, `completed` at `1.0`) [@fastfile]. The lesson
generalizes: any future lane here that skips the binary upload needs
`track_promote_to` or `rollout` to actually change anything, no matter what
`release_status` says.

This workflow does not bump `app.json`'s semver or create a git tag — that
remains Branch A's responsibility [@aab-workflow]. In practice, a full
production release that should carry both a tagged version and a live Play
submission may mean running both workflows: Branch A for the version bump and
tag, Branch B for the actual Play Console submission.

Shipping straight to `production` (draft) is deliberate, not an oversight —
see [Play Store listing as code](../decisions/play-store-listing-as-code) for
why the workflow was changed from an internal-first path to this one after a
release got stranded on `internal`/`alpha` for weeks. For a deliberate test
build instead of a production ship, submit the same AAB by hand with the
separate `submit.internal` profile (`eas submit --platform android --profile
internal --id <BUILD_ID>`, `track: "internal"`, `releaseStatus: "draft"`),
then either move it to production with the `fastlane promote` lane or start
its rollout in place with `fastlane rollout` once it's ready to go live —
never rebuild an AAB just to change which track it lands on or to flip it
live [@eas-json] [@fastfile].

### Recovering From A Failed Submit

If the workflow fails at the "Submit AAB to Play" step, the EAS build already
succeeded — the AAB exists and its version code is known. Rebuilding wastes
about an hour and burns a version code for nothing; reuse the finished build
instead of restarting the workflow [@skill]:

1. Find the build: `eas build:list --platform android --limit 5
   --non-interactive --json` and read off the `id`, `appBuildVersion`, and
   `status` of the build that finished [@skill].
2. Submit it directly: `eas submit --platform android --profile production
   --id <BUILD_ID> --non-interactive` [@skill].
3. Run `fastlane tracks` to confirm the version code now shows `[draft]` on
   `production`, then run `fastlane metadata` and `fastlane changelog` for
   that version code and track, exactly as the workflow would have
   [@skill] [@fastfile].

A `Google Api Error: This edit has expired` or `This Edit has been deleted`
failure (after several retries) means the Play "edit" was invalidated while
the job was running — most often because a release was discarded in the Play
Console mid-flight — not a credentials or metadata problem. The fix is the
same manual re-submit above [@skill].

## Verify

For Branch A, confirm the new GitHub Release appears in the repo's Releases
list with the APK attached and the new `v*` tag pushed to `master`
[@apk-workflow]. For Branch B, run `fastlane tracks` and confirm the new
version code shows up `[draft]` on the `production` track — that is the only
reliable check, since a git tag or `app.json`'s version proves nothing about
what actually reached Play [@fastfile] [@skill]. Field-by-field details of
`eas.json`'s build and submit profiles are covered in
[Build and release config](../reference/build-and-release-config).
