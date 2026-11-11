---
title: "Release An OTA Update"
summary: "How to publish a JS/asset-only change to installed builds via EAS Update instead of a new store build, when it reaches installed apps, and the native-change gotcha that makes an OTA silently invisible."
topics: [guides, release]
sources:
  - id: ota-workflow
    type: file
    path: .github/workflows/release-ota.yml
  - id: eas-json
    type: file
    path: eas.json
  - id: app-json
    type: file
    path: app.json
  - id: claude-md
    type: file
    path: CLAUDE.md
---

Use this guide when a change is JS- or asset-only — a bug fix, copy change,
balance tweak, or anything that touches no native module, Expo SDK version,
config plugin, permission, or icon — and the goal is to get it in front of
players without waiting for App Store/Play Store review. `release-ota.yml`
publishes the current JS bundle and assets as an over-the-air (OTA) update
through EAS Update; an installed app downloads it on launch and applies it on
the next cold start, with no store review step at all [@ota-workflow]. This
is a separate, narrower release path from
[Release an Android build](../guides/release-an-android-build) and
[Release an iOS build](../guides/release-an-ios-build), which both produce a
new installable binary.

## Precondition: this only reaches binaries with a matching runtime fingerprint

`app.json`'s `runtimeVersion.policy` is `"fingerprint"` — Expo derives the
`runtimeVersion` an installed build expects from a hash of that build's
native surface (Expo SDK version, native modules, config plugins), not from a
manually tracked number [@app-json]. An OTA update is only offered to an
installed app whose own `runtimeVersion` fingerprint matches the update's. Any
native change — a new native module, an Expo SDK bump, a new or reconfigured
config plugin, a new icon, or a new permission — changes the fingerprint, so
an OTA published after such a change simply matches no installed app and
silently reaches nobody [@ota-workflow]. Those changes need a real store build
(`release-aab.yml` for Android, the `eas build -p ios` flow in
[Release an iOS build](../guides/release-an-ios-build)) instead of an OTA.
When in doubt whether a change is "native enough" to break the fingerprint,
treat it as native and ship a store build.

## Channels: `preview` is the test track, `production` is the store track

`eas.json`'s `build.preview` and `build.production` profiles each carry a
`channel` field (`"preview"` and `"production"`) [@eas-json], and every build
is permanently bound to the channel it was built with. `preview` covers the
sideloaded GitHub-Release APKs produced by
[Release an Android build](../guides/release-an-android-build)'s Branch A;
`production` covers whatever is currently live on the Play Store or App
Store [@claude-md] [@eas-json]. Publishing to the wrong channel either does
nothing (no installed build is bound to it) or — for `production` — ships
untested JS straight to every live install, so always publish to `preview`
first and verify on a sideloaded test build before publishing the same change
to `production`.

## Publish an update

Trigger `release-ota.yml` manually (`workflow_dispatch`) from the GitHub
Actions tab, or run the equivalent command locally:

```bash
eas update --channel <preview|production> --environment <same> \
  --message "<what changed>" --rollout-percentage <1-100> --platform all
```

The workflow takes three inputs: `channel` (`preview`/`production`, required),
`message` (shown in the EAS dashboard, required), and `rollout` (a percentage,
default `100`) [@ota-workflow]. Before publishing, the workflow runs `npx jest
--ci` as a gate — a failing test suite blocks the publish step entirely,
unlike the build-and-submit workflows, which do not run tests at all
[@ota-workflow]. Because this ships directly to players with no store review
in between, confirm with the user before triggering `production`, the same
rule guides in this wiki apply to any other outward, publishing action.

`--rollout-percentage` below `100` publishes a staged rollout: only that
percentage of eligible installs receive the update initially, the same
staged-rollout idea Android's `fastlane rollout ... percent:<0-1>` lane
implements for store releases (see
[Release an Android build](../guides/release-an-android-build)), but as a
separate mechanism specific to EAS Update, not the Play Console.

## Verify

Open the EAS dashboard's Updates list for the project and confirm the new
update appears on the expected channel with the expected message. To confirm
it actually reaches a device, force-close and relaunch a sideloaded `preview`
build (or a `production` store build, for a `production` publish) — the
update applies on the next cold start, not immediately, so a simple backgrounded
app will not pick it up [@ota-workflow]. If the update does not appear after
relaunch, the most likely cause is a `runtimeVersion` fingerprint mismatch
from an unnoticed native change since that build was made — check the
dashboard's reported fingerprint for both the build and the update rather than
assuming the publish silently failed.
